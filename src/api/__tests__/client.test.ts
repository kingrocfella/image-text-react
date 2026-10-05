import {
  ApiRequestError,
  JobTimeoutError,
  authFetch,
  extractTextFromPdf,
  fetchAccount,
  getAuthTokens,
  pollJobStatus,
  verifyPurchase,
} from "../client";
import { API_ROUTES } from "../routes.generated";
import { API_BASE_URL, APP_VERSION, JOB_POLLING } from "../../constants";
import { store } from "../../store";
import {
  REFRESH_REFUSED,
  REFRESH_UNAVAILABLE,
  clearAuth,
  refreshToken,
} from "../../store/slices/authSlice";
import { clearSession } from "../../auth/sessionStorage";

// Mock the store module
jest.mock("../../store", () => ({
  store: {
    getState: jest.fn(),
    dispatch: jest.fn(),
  },
}));

jest.mock("../../store/slices/authSlice", () => ({
  REFRESH_REFUSED: "refresh_refused",
  REFRESH_UNAVAILABLE: "refresh_unavailable",
  refreshToken: Object.assign(jest.fn(() => ({ type: "auth/refreshToken" })), {
    fulfilled: { match: jest.fn() },
  }),
  clearAuth: jest.fn(() => ({ type: "auth/clearAuth" })),
}));

jest.mock("../../auth/sessionStorage", () => ({
  clearSession: jest.fn(() => Promise.resolve()),
}));

// Mock global fetch
const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const mockGetState = store.getState as unknown as jest.Mock;
const mockDispatch = store.dispatch as unknown as jest.Mock;
const mockFulfilledMatch = refreshToken.fulfilled.match as unknown as jest.Mock;

const reply = (status: number, body: unknown = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

const signedIn = () =>
  mockGetState.mockReturnValue({
    auth: {
      accessToken: "test-access-token",
      tokenType: "Bearer",
      refreshToken: "test-refresh-token",
    },
  });

const url = (path: string) => `${API_BASE_URL}${path}`;

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    signedIn();
  });

  describe("getAuthTokens", () => {
    it("returns tokens from store", () => {
      const tokens = getAuthTokens();
      expect(tokens.accessToken).toBe("test-access-token");
      expect(tokens.tokenType).toBe("Bearer");
    });

    it("returns null tokens when not authenticated", () => {
      mockGetState.mockReturnValue({
        auth: { accessToken: null, tokenType: null },
      });
      const tokens = getAuthTokens();
      expect(tokens.accessToken).toBeNull();
      expect(tokens.tokenType).toBeNull();
    });
  });

  describe("authFetch", () => {
    it("sends the bearer token and the app version to the API origin", async () => {
      mockFetch.mockResolvedValueOnce(reply(200));

      await authFetch(API_ROUTES.me, { method: "GET" });

      expect(mockFetch).toHaveBeenCalledWith(
        url("/v1/me"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-access-token",
            "X-App-Version": APP_VERSION,
          }),
        }),
      );
    });

    it("sends no Authorization header when signed out", async () => {
      mockGetState.mockReturnValue({
        auth: { accessToken: null, tokenType: null },
      });
      mockFetch.mockResolvedValueOnce(reply(200));

      await authFetch(API_ROUTES.me);

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });

    it("refreshes once on 401 and repeats the request", async () => {
      mockFetch
        .mockResolvedValueOnce(reply(401))
        .mockResolvedValueOnce(reply(200));
      mockDispatch.mockResolvedValueOnce({ type: "auth/refreshToken/fulfilled" });
      mockFulfilledMatch.mockReturnValueOnce(true);

      const response = await authFetch(API_ROUTES.me);

      expect(response.status).toBe(200);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("shares one refresh between requests that fail together", async () => {
      // A refresh token works once: two refreshes would revoke the session.
      mockFetch
        .mockResolvedValueOnce(reply(401))
        .mockResolvedValueOnce(reply(401))
        .mockResolvedValue(reply(200));
      mockDispatch.mockResolvedValue({ type: "auth/refreshToken/fulfilled" });
      mockFulfilledMatch.mockReturnValue(true);

      await Promise.all([authFetch(API_ROUTES.me), authFetch(API_ROUTES.me)]);

      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it("signs out only when the server refuses the refresh token", async () => {
      mockFetch.mockResolvedValueOnce(reply(401));
      mockDispatch.mockResolvedValueOnce({ payload: REFRESH_REFUSED });
      mockFulfilledMatch.mockReturnValueOnce(false);

      await expect(authFetch(API_ROUTES.me)).rejects.toThrow(
        "Session expired. Please login again.",
      );

      expect(clearSession).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(clearAuth());
    });

    it("keeps the session when the refresh merely could not be reached", async () => {
      mockFetch.mockResolvedValueOnce(reply(401));
      mockDispatch.mockResolvedValueOnce({ payload: REFRESH_UNAVAILABLE });
      mockFulfilledMatch.mockReturnValueOnce(false);

      await expect(authFetch(API_ROUTES.me)).rejects.toThrow(
        "Could not reach the server",
      );

      expect(clearSession).not.toHaveBeenCalled();
      expect(clearAuth).not.toHaveBeenCalled();
    });

    it("preserves custom headers", async () => {
      mockFetch.mockResolvedValueOnce(reply(200));

      await authFetch(API_ROUTES.clientLogs, {
        method: "POST",
        headers: { "X-Custom": "yes" },
        body: JSON.stringify({ records: [] }),
      });

      expect(mockFetch.mock.calls[0][1].headers).toEqual(
        expect.objectContaining({
          "X-Custom": "yes",
          "Content-Type": "application/json",
          Authorization: "Bearer test-access-token",
        }),
      );
    });
  });

  describe("pollJobStatus", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns a completed PDF result", async () => {
      mockFetch.mockResolvedValueOnce(
        reply(200, {
          content: "Extracted text",
          description: "Document description",
          request_id: "req-123",
        }),
      );

      const result = await pollJobStatus("job-123");

      expect(result).toEqual({
        content: "Extracted text",
        description: "Document description",
        request_id: "req-123",
      });
      expect(mockFetch.mock.calls[0][0]).toBe(url("/v1/job/job-123"));
    });

    it("accepts an image or audio result, which has no description or request id", async () => {
      mockFetch.mockResolvedValueOnce(
        reply(200, { content: "Scanned text", filename: "a.png", segments_count: 3 }),
      );

      const result = await pollJobStatus("job-img");

      expect(result.content).toBe("Scanned text");
    });

    it("accepts the null description the server sends for a PDF answer", async () => {
      mockFetch.mockResolvedValueOnce(
        reply(200, { content: "Answer", description: null, request_id: "req-1" }),
      );

      expect((await pollJobStatus("job-pdf")).request_id).toBe("req-1");
    });

    it("polls until the job is completed, backing off", async () => {
      mockFetch
        .mockResolvedValueOnce(reply(200, { status: "pending" }))
        .mockResolvedValueOnce(reply(200, { status: "pending" }))
        .mockResolvedValueOnce(reply(200, { content: "Done" }));

      const pollPromise = pollJobStatus("job-456");

      await jest.advanceTimersByTimeAsync(JOB_POLLING.initialDelayMs);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // The second wait is longer than the first.
      await jest.advanceTimersByTimeAsync(JOB_POLLING.initialDelayMs);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(JOB_POLLING.initialDelayMs);

      expect((await pollPromise).content).toBe("Done");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("reports a failed job with the server\'s message", async () => {
      mockFetch.mockResolvedValueOnce(
        reply(200, { message_id: "x", status: "failed", error: "The job could not be completed. Please try again." }),
      );

      await expect(pollJobStatus("job-bad")).rejects.toThrow(
        "The job could not be completed",
      );
    });

    it("gives up after the maximum duration instead of polling for ever", async () => {
      mockFetch.mockResolvedValue(reply(200, { status: "pending" }));

      const pollPromise = pollJobStatus("job-slow");
      const outcome = expect(pollPromise).rejects.toBeInstanceOf(JobTimeoutError);
      await jest.advanceTimersByTimeAsync(JOB_POLLING.maxDurationMs + 60_000);

      await outcome;
      const calls = mockFetch.mock.calls.length;
      await jest.advanceTimersByTimeAsync(60_000);
      expect(mockFetch).toHaveBeenCalledTimes(calls);
    });

    it("stops as soon as the caller aborts", async () => {
      mockFetch.mockResolvedValue(reply(200, { status: "pending" }));
      const controller = new AbortController();

      const pollPromise = pollJobStatus("job-left", controller.signal);
      const outcome = expect(pollPromise).rejects.toThrow("Cancelled");
      await jest.advanceTimersByTimeAsync(0);
      controller.abort();

      await outcome;
      await jest.advanceTimersByTimeAsync(60_000);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("throws error on API failure", async () => {
      mockFetch.mockResolvedValueOnce(reply(404, { detail: "Job not found." }));

      await expect(pollJobStatus("invalid-job")).rejects.toThrow("Job not found");
    });

    it("throws error on unexpected response format", async () => {
      mockFetch.mockResolvedValueOnce(reply(200, { unexpected: "data" }));

      await expect(pollJobStatus("job-789")).rejects.toThrow(
        "Unexpected response format",
      );
    });
  });

  describe("extractTextFromPdf", () => {
    it("shows the server\'s allowance message when the monthly limit is reached", async () => {
      mockFetch.mockResolvedValueOnce(
        reply(429, {
          detail: "You have used all 50 cloud-model answers for this month. The allowance resets on the 1st.",
        }),
      );

      await expect(
        extractTextFromPdf({ requestId: "req-1", query: "Why?", model: "gemini" }),
      ).rejects.toThrow("resets on the 1st");
    });

    it("never sends a shared model password", async () => {
      mockFetch
        .mockResolvedValueOnce(reply(202, { message: "queued", message_id: "m1", status: "queued" }))
        .mockResolvedValueOnce(reply(200, { content: "A", description: null, request_id: "req-2" }));

      const result = await extractTextFromPdf({
        requestId: "req-1",
        query: "Why?",
        model: "openai",
      });

      const form = mockFetch.mock.calls[0][1].body as FormData;
      expect(JSON.stringify((form as any)._parts ?? [])).not.toContain("openai_pass");
      expect(result).toEqual({ content: "A", description: "", requestId: "req-2" });
    });
  });

  describe("plans", () => {
    const failing = (status: number, headers: Record<string, string> = {}) => ({
      ...reply(status, { detail: "No." }),
      headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    });

    it("a Pro-only model (402) and an exhausted free allowance both point at Pro", async () => {
      mockFetch.mockResolvedValueOnce(failing(402));
      const proOnly = await extractTextFromPdf({
        requestId: "r",
        query: "q",
        model: "openai",
      }).catch((error) => error);
      mockFetch.mockResolvedValueOnce(
        failing(429, { "x-upgrade-available": "true" }),
      );
      const freeLimit = await extractTextFromPdf({
        requestId: "r",
        query: "q",
        model: "gemini",
      }).catch((error) => error);
      mockFetch.mockResolvedValueOnce(
        failing(429, { "x-upgrade-available": "false" }),
      );
      const proLimit = await extractTextFromPdf({
        requestId: "r",
        query: "q",
        model: "gemini",
      }).catch((error) => error);

      expect(proOnly).toBeInstanceOf(ApiRequestError);
      expect([proOnly.needsPro, freeLimit.needsPro, proLimit.needsPro]).toEqual([
        true,
        true,
        false,
      ]);
    });

    it("sends a store receipt for the server to verify", async () => {
      mockFetch.mockResolvedValueOnce(
        reply(200, {
          user_id: "u1",
          name: "Ada",
          email: "ada@example.com",
          pro: true,
          models: ["ollama", "openai"],
          usage: {},
        }),
      );

      const account = await verifyPurchase("android", "purchase-token");

      const [calledUrl, init] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe(url("/v1/billing/purchases/verify"));
      expect(JSON.parse(init.body)).toEqual({
        platform: "android",
        receipt: "purchase-token",
      });
      expect(account.pro).toBe(true);
    });
  });

  describe("fetchAccount", () => {
    it("returns the models and usage the server reports", async () => {
      mockFetch.mockResolvedValueOnce(
        reply(200, {
          user_id: "u1",
          name: "Ada",
          email: "ada@example.com",
          models: ["ollama", "gemini"],
          usage: { pdf: { used: 2, limit: 200 } },
        }),
      );

      const account = await fetchAccount();

      expect(account.models).toEqual(["ollama", "gemini"]);
      expect(account.usage.pdf).toEqual({ used: 2, limit: 200 });
    });
  });
});
