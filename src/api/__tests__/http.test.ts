import { RequestTimeoutError, apiFetch, setUpdateRequiredHandler } from "../http";
import { API_BASE_URL, APP_VERSION } from "../../constants";

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

beforeEach(() => mockFetch.mockReset());
afterEach(() => {
  setUpdateRequiredHandler(null);
  jest.useRealTimers();
});

it("prefixes the API origin and sends the app version", async () => {
  mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

  await apiFetch("/v1/me");

  const [url, init] = mockFetch.mock.calls[0];
  expect(url).toBe(`${API_BASE_URL}/v1/me`);
  expect(init.headers["X-App-Version"]).toBe(APP_VERSION);
  expect(init.signal).toBeInstanceOf(AbortSignal);
});

it("sets a JSON content type for string bodies only", async () => {
  mockFetch.mockResolvedValue({ ok: true, status: 200 });

  await apiFetch("/v1/x", { method: "POST", body: JSON.stringify({ a: 1 }) });
  await apiFetch("/v1/x", { method: "POST", body: new FormData() });

  expect(mockFetch.mock.calls[0][1].headers["Content-Type"]).toBe("application/json");
  // React Native must set the multipart boundary itself.
  expect(mockFetch.mock.calls[1][1].headers["Content-Type"]).toBeUndefined();
});

it("times out instead of hanging", async () => {
  jest.useFakeTimers();
  mockFetch.mockImplementation(
    (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new Error("Aborted")));
      }),
  );

  const outcome = expect(apiFetch("/v1/slow", {}, { timeoutMs: 1000 })).rejects.toBeInstanceOf(
    RequestTimeoutError,
  );
  await jest.advanceTimersByTimeAsync(1000);

  await outcome;
});

it("propagates a caller\'s cancellation as-is", async () => {
  const controller = new AbortController();
  mockFetch.mockImplementation(
    (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new Error("Aborted")));
      }),
  );

  const pending = apiFetch("/v1/slow", {}, { signal: controller.signal });
  controller.abort();

  await expect(pending).rejects.toThrow("Aborted");
});

it("reports HTTP 426 to the update-required handler", async () => {
  const handler = jest.fn();
  setUpdateRequiredHandler(handler);
  mockFetch.mockResolvedValueOnce({ ok: false, status: 426 });

  const response = await apiFetch("/v1/auth/login", { method: "POST" });

  expect(response.status).toBe(426);
  expect(handler).toHaveBeenCalledTimes(1);
});
