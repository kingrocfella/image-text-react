import { apiCall, getAuthTokens, pollJobStatus } from "../client";
import { store } from "../../store";
import { refreshToken, clearAuth } from "../../store/slices/authSlice";

// Mock the store module
jest.mock("../../store", () => ({
  store: {
    getState: jest.fn(),
    dispatch: jest.fn(),
  },
}));

jest.mock("../../store/slices/authSlice", () => ({
  refreshToken: Object.assign(jest.fn(), {
    fulfilled: { match: jest.fn() },
  }),
  clearAuth: jest.fn(() => ({ type: "auth/clearAuth" })),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockStore = store as jest.Mocked<typeof store>;
const mockRefreshToken = refreshToken as unknown as jest.Mock;

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.getState.mockReturnValue({
      auth: {
        accessToken: "test-access-token",
        tokenType: "Bearer",
        refreshToken: "test-refresh-token",
      },
    });
  });

  describe("getAuthTokens", () => {
    it("returns tokens from store", () => {
      const tokens = getAuthTokens();
      expect(tokens.accessToken).toBe("test-access-token");
      expect(tokens.tokenType).toBe("Bearer");
    });

    it("returns null tokens when not authenticated", () => {
      mockStore.getState.mockReturnValue({
        auth: {
          accessToken: null,
          tokenType: null,
        },
      });
      const tokens = getAuthTokens();
      expect(tokens.accessToken).toBeNull();
      expect(tokens.tokenType).toBeNull();
    });
  });

  describe("apiCall", () => {
    it("makes request with authorization header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "test" }),
      });

      await apiCall("https://api.example.com/test", { method: "GET" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-access-token",
          }),
        }),
      );
    });

    it("makes request without auth header when no token", async () => {
      mockStore.getState.mockReturnValue({
        auth: {
          accessToken: null,
          tokenType: null,
        },
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await apiCall("https://api.example.com/test");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          headers: undefined,
        }),
      );
    });

    it("attempts token refresh on 401", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      mockStore.dispatch.mockResolvedValueOnce({ type: "auth/refreshToken/fulfilled" });
      (refreshToken.fulfilled.match as jest.Mock).mockReturnValueOnce(true);

      await apiCall("https://api.example.com/test");

      expect(mockStore.dispatch).toHaveBeenCalledWith(mockRefreshToken());
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("clears auth and throws on refresh failure", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

      mockStore.dispatch.mockResolvedValueOnce({ type: "auth/refreshToken/rejected" });
      (refreshToken.fulfilled.match as jest.Mock).mockReturnValueOnce(false);

      await expect(apiCall("https://api.example.com/test")).rejects.toThrow(
        "Session expired. Please login again.",
      );

      expect(mockStore.dispatch).toHaveBeenCalledWith(clearAuth());
    });

    it("preserves custom headers", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      await apiCall("https://api.example.com/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-access-token",
          }),
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

    it("returns completed job result", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            content: "Extracted text",
            description: "Document description",
            request_id: "req-123",
          }),
      });

      const result = await pollJobStatus("job-123");

      expect(result).toEqual({
        content: "Extracted text",
        description: "Document description",
        request_id: "req-123",
      });
    });

    it("polls until job is completed", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ status: "pending" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              content: "Done",
              description: "Desc",
              request_id: "id",
            }),
        });

      const pollPromise = pollJobStatus("job-456");

      // Fast-forward through the polling interval
      await jest.advanceTimersByTimeAsync(10000);

      const result = await pollPromise;

      expect(result.content).toBe("Done");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("throws error on API failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: "Job not found" }),
      });

      await expect(pollJobStatus("invalid-job")).rejects.toThrow("Job not found");
    });

    it("throws error on unexpected response format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ unexpected: "data" }),
      });

      await expect(pollJobStatus("job-789")).rejects.toThrow(
        "Unexpected response format",
      );
    });
  });
});
