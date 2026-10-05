/**
 * The real auth slice against a real store: persistence, restore, and what
 * does (and does not) end a session.
 */
import { configureStore } from "@reduxjs/toolkit";
import * as SecureStore from "expo-secure-store";

import authReducer, {
  REFRESH_REFUSED,
  REFRESH_UNAVAILABLE,
  deleteAccount,
  forgotPassword,
  login,
  logout,
  refreshToken,
  resendVerification,
  restoreSession,
  socialLogin,
} from "../authSlice";
import themeReducer from "../themeSlice";
import { API_BASE_URL, EMAIL_NOT_VERIFIED_DETAIL, SESSION_STORAGE } from "../../../constants";

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

const reply = (status: number, body: unknown = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

const TOKENS = {
  access_token: "access-1",
  refresh_token: "refresh-1",
  token_type: "bearer",
  name: "Ada",
  user_id: "user-1",
};

const makeStore = () =>
  configureStore({ reducer: { auth: authReducer, theme: themeReducer } });
const stored = async () => {
  const raw = await SecureStore.getItemAsync(SESSION_STORAGE.key);
  return raw ? JSON.parse(raw) : null;
};
const signIn = async (store: ReturnType<typeof makeStore>) => {
  mockFetch.mockResolvedValueOnce(reply(200, TOKENS));
  await store.dispatch(login({ email: "ada@example.com", password: "password123" }));
};

beforeEach(() => {
  mockFetch.mockReset();
  (SecureStore as unknown as { __reset: () => void }).__reset();
});

describe("signing in", () => {
  it("stores the session in the keystore, device-only", async () => {
    const store = makeStore();
    await signIn(store);

    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(await stored()).toEqual({
      accessToken: "access-1",
      refreshToken: "refresh-1",
      tokenType: "bearer",
      user: { id: "user-1", name: "Ada", email: "ada@example.com" },
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      SESSION_STORAGE.key,
      expect.any(String),
      expect.objectContaining({
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
    );
    expect(mockFetch.mock.calls[0][0]).toBe(`${API_BASE_URL}/v1/auth/login`);
  });

  it("reports an unverified account distinctly, so the screen can offer a resend", async () => {
    const store = makeStore();
    mockFetch.mockResolvedValueOnce(reply(403, { detail: EMAIL_NOT_VERIFIED_DETAIL }));

    const result = await store.dispatch(
      login({ email: "ada@example.com", password: "password123" }),
    );

    expect(result.payload).toBe(EMAIL_NOT_VERIFIED_DETAIL);
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(await stored()).toBeNull();
  });

  it("shows the first message of a validation error", async () => {
    const store = makeStore();
    mockFetch.mockResolvedValueOnce(
      reply(422, { detail: [{ msg: "value is not a valid email address", loc: ["body", "email"] }] }),
    );

    const result = await store.dispatch(login({ email: "nope", password: "x" }));

    expect(result.payload).toBe("value is not a valid email address");
  });
});

describe("a cold start", () => {
  it("restores the stored session without a network call", async () => {
    await signIn(makeStore());
    mockFetch.mockReset();

    const fresh = makeStore();
    expect(fresh.getState().auth.restoring).toBe(true);
    await fresh.dispatch(restoreSession());

    const { auth } = fresh.getState();
    expect(auth.restoring).toBe(false);
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.user?.email).toBe("ada@example.com");
    expect(auth.refreshToken).toBe("refresh-1");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("starts signed out when nothing is stored", async () => {
    const store = makeStore();
    await store.dispatch(restoreSession());

    expect(store.getState().auth.restoring).toBe(false);
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it("discards a stored value it cannot read", async () => {
    await SecureStore.setItemAsync(SESSION_STORAGE.key, "{not json");
    const store = makeStore();
    await store.dispatch(restoreSession());

    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(await stored()).toBeNull();
  });
});

describe("refreshing", () => {
  it("replaces the stored refresh token, which the server has now spent", async () => {
    const store = makeStore();
    await signIn(store);
    mockFetch.mockResolvedValueOnce(
      reply(200, { access_token: "access-2", refresh_token: "refresh-2", token_type: "bearer" }),
    );

    await store.dispatch(refreshToken());

    expect(store.getState().auth.accessToken).toBe("access-2");
    expect((await stored()).refreshToken).toBe("refresh-2");
    expect((await stored()).user.email).toBe("ada@example.com");
  });

  it("distinguishes a refused token from an unreachable server", async () => {
    const store = makeStore();
    await signIn(store);

    mockFetch.mockResolvedValueOnce(reply(401, { detail: "Refresh token has been revoked" }));
    expect((await store.dispatch(refreshToken())).payload).toBe(REFRESH_REFUSED);

    mockFetch.mockResolvedValueOnce(reply(503));
    expect((await store.dispatch(refreshToken())).payload).toBe(REFRESH_UNAVAILABLE);

    mockFetch.mockRejectedValueOnce(new TypeError("Network request failed"));
    expect((await store.dispatch(refreshToken())).payload).toBe(REFRESH_UNAVAILABLE);

    // None of these sign the user out by themselves; authFetch decides.
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });
});

describe("ending a session", () => {
  it("logout forgets the session on the device even when the server is unreachable", async () => {
    const store = makeStore();
    await signIn(store);
    mockFetch.mockRejectedValueOnce(new TypeError("Network request failed"));

    await store.dispatch(logout());

    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.refreshToken).toBeNull();
    expect(await stored()).toBeNull();
  });

  it("deleting the account sends the password and signs out", async () => {
    const store = makeStore();
    await signIn(store);
    mockFetch.mockResolvedValueOnce(reply(200, { message: "deleted" }));

    const result = await store.dispatch(deleteAccount({ password: "password123" }));

    expect(deleteAccount.fulfilled.match(result)).toBe(true);
    const [url, init] = mockFetch.mock.calls[1];
    expect(url).toBe(`${API_BASE_URL}/v1/auth/account`);
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body)).toEqual({ password: "password123" });
    expect(init.headers.Authorization).toBe("bearer access-1");
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(await stored()).toBeNull();
  });

  it("a wrong password deletes nothing and keeps the session", async () => {
    const store = makeStore();
    await signIn(store);
    mockFetch.mockResolvedValueOnce(reply(401, { detail: "Invalid credentials" }));

    const result = await store.dispatch(deleteAccount({ password: "wrong" }));

    expect(result.payload).toBe("That password is not correct.");
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(await stored()).not.toBeNull();
  });
});

describe("account email requests", () => {
  it("resend verification and forgot password return the server\'s message", async () => {
    const store = makeStore();
    mockFetch.mockResolvedValueOnce(reply(200, { message: "On its way." }));
    mockFetch.mockResolvedValueOnce(reply(200, { message: "Reset sent." }));

    const resent = await store.dispatch(resendVerification("ada@example.com"));
    const reset = await store.dispatch(forgotPassword("ada@example.com"));

    expect(resent.payload).toBe("On its way.");
    expect(reset.payload).toBe("Reset sent.");
    expect(mockFetch.mock.calls[0][0]).toBe(`${API_BASE_URL}/v1/auth/resend-verification`);
    expect(mockFetch.mock.calls[1][0]).toBe(`${API_BASE_URL}/v1/auth/forgot-password`);
  });

  it("surfaces a rate limit", async () => {
    const store = makeStore();
    mockFetch.mockResolvedValueOnce(
      reply(429, { detail: "Too many requests. Please try again later." }),
    );

    const result = await store.dispatch(forgotPassword("ada@example.com"));

    expect(result.payload).toBe("Too many requests. Please try again later.");
  });
});

describe("social sign-in", () => {
  it("exchanges a Google token for a stored session", async () => {
    const store = makeStore();
    mockFetch.mockResolvedValueOnce(reply(200, TOKENS));

    await store.dispatch(socialLogin({ provider: "google", idToken: "g-token" }));

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/v1/auth/google`);
    expect(JSON.parse(init.body)).toEqual({ id_token: "g-token" });
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect((await stored()).refreshToken).toBe("refresh-1");
  });

  it("sends Apple\'s token and name, and reports a refusal", async () => {
    const store = makeStore();
    mockFetch.mockResolvedValueOnce(reply(401, { detail: "Invalid Apple token" }));

    const result = await store.dispatch(
      socialLogin({ provider: "apple", identityToken: "a-token", name: "Ada" }),
    );

    expect(mockFetch.mock.calls[0][0]).toBe(`${API_BASE_URL}/v1/auth/apple`);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      identity_token: "a-token",
      name: "Ada",
    });
    expect(result.payload).toBe("Invalid Apple token");
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it("deletes a passwordless account with a fresh provider token", async () => {
    const store = makeStore();
    await signIn(store);
    mockFetch.mockResolvedValueOnce(reply(200, { message: "deleted" }));

    await store.dispatch(deleteAccount({ google_id_token: "fresh" }));

    expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
      google_id_token: "fresh",
    });
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });
});
