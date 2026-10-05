import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch, readJson } from "../../api/http";
import { API_ROUTES } from "../../api/routes.generated";
import {
  LoginResponseSchema,
  MessageResponseSchema,
  RegisterResponseSchema,
  RefreshTokenResponseSchema,
  validateResponse,
  parseApiError,
} from "../../api/schemas";
import {
  clearSession,
  loadSession,
  saveSession,
  type StoredSession,
} from "../../auth/sessionStorage";
import { EMAIL_NOT_VERIFIED_DETAIL } from "../../constants";
import { createMobileLogger } from "../../logging/logger";
import type { RootState } from "../index";

const logger = createMobileLogger("auth");

const jsonRequest = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

/** Persist the session; a keystore failure must not fail the sign-in itself. */
const persist = async (session: StoredSession): Promise<void> => {
  try {
    await saveSession(session);
  } catch (error) {
    logger.warn("session_save_failed", "Could not store the session", { error });
  }
};

// Types
export interface User {
  id?: string;
  name: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  isAuthenticated: boolean;
  /** True until the stored session has been read on a cold start. */
  restoring: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  tokenType: null,
  isAuthenticated: false,
  restoring: true,
  loading: false,
  error: null,
};

// Async Thunks
export const login = createAsyncThunk<
  { user: User; accessToken: string; refreshToken: string; tokenType: string },
  LoginCredentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await apiFetch(
      API_ROUTES.authLogin,
      jsonRequest("POST", credentials),
    );
    const rawData = await readJson(response);

    if (!response.ok) {
      const message = parseApiError(rawData);
      // The screen offers "resend verification email" on exactly this value.
      if (response.status === 403 && message === EMAIL_NOT_VERIFIED_DETAIL) {
        return rejectWithValue(EMAIL_NOT_VERIFIED_DETAIL);
      }
      return rejectWithValue(
        message === "An error occurred" ? "Login failed" : message,
      );
    }

    const data = validateResponse(LoginResponseSchema, rawData, "login");

    const session = {
      user: {
        id: data.user_id,
        name: data.name,
        email: credentials.email,
      } as User,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
    };
    await persist(session);
    logger.info("signed_in", "Signed in");
    return session;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "An unknown error occurred",
    );
  }
});

export type SocialCredential =
  | { provider: "google"; idToken: string }
  | { provider: "apple"; identityToken: string; name?: string | null };

/**
 * Exchange a Google or Apple token for a session. The server verifies the
 * token and decides whose account it is; the app only carries it.
 */
export const socialLogin = createAsyncThunk<
  { user: User; accessToken: string; refreshToken: string; tokenType: string },
  SocialCredential,
  { rejectValue: string }
>("auth/socialLogin", async (credential, { rejectWithValue }) => {
  try {
    const response =
      credential.provider === "google"
        ? await apiFetch(
            API_ROUTES.authGoogle,
            jsonRequest("POST", { id_token: credential.idToken }),
          )
        : await apiFetch(
            API_ROUTES.authApple,
            jsonRequest("POST", {
              identity_token: credential.identityToken,
              name: credential.name ?? null,
            }),
          );
    const rawData = await readJson(response);
    if (!response.ok) {
      const message = parseApiError(rawData);
      return rejectWithValue(
        message === "An error occurred" ? "Sign-in failed" : message,
      );
    }
    const data = validateResponse(LoginResponseSchema, rawData, "login");
    const session = {
      // The email is not in the token response; GET /v1/me supplies it.
      user: { id: data.user_id, name: data.name, email: "" } as User,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
    };
    await persist(session);
    logger.info("signed_in", "Signed in", { provider: credential.provider });
    return session;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "An unknown error occurred",
    );
  }
});

export const register = createAsyncThunk<
  string,
  RegisterCredentials,
  { rejectValue: string }
>("auth/register", async (credentials, { rejectWithValue }) => {
  try {
    const response = await apiFetch(
      API_ROUTES.authRegister,
      jsonRequest("POST", credentials),
    );
    const rawData = await readJson(response);

    if (!response.ok) {
      const message = parseApiError(rawData);
      return rejectWithValue(
        message === "An error occurred" ? "Registration failed" : message,
      );
    }

    const data = validateResponse(
      RegisterResponseSchema,
      rawData,
      "registration",
    );
    return data.message;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "An unknown error occurred",
    );
  }
});

/** POST an email address to an endpoint that answers with a message. */
const emailRequestThunk = (type: string, path: string, fallback: string) =>
  createAsyncThunk<string, string, { rejectValue: string }>(
    type,
    async (email, { rejectWithValue }) => {
      try {
        const response = await apiFetch(path, jsonRequest("POST", { email }));
        const rawData = await readJson(response);
        if (!response.ok) {
          const message = parseApiError(rawData);
          return rejectWithValue(
            message === "An error occurred" ? fallback : message,
          );
        }
        return validateResponse(MessageResponseSchema, rawData, type).message;
      } catch (error) {
        return rejectWithValue(
          error instanceof Error ? error.message : fallback,
        );
      }
    },
  );

export const resendVerification = emailRequestThunk(
  "auth/resendVerification",
  API_ROUTES.authResendVerification,
  "Could not send the verification email",
);

export const forgotPassword = emailRequestThunk(
  "auth/forgotPassword",
  API_ROUTES.authForgotPassword,
  "Could not send the reset email",
);

/** The server said the refresh token is no longer valid: the session is over. */
export const REFRESH_REFUSED = "refresh_refused";
/** The refresh could not be attempted or completed; the session may be fine. */
export const REFRESH_UNAVAILABLE = "refresh_unavailable";

/**
 * Read the stored session on a cold start. No network call: the first API
 * request refreshes the access token if it has expired meanwhile.
 */
export const restoreSession = createAsyncThunk<StoredSession | null>(
  "auth/restoreSession",
  async () => loadSession(),
);

export const refreshToken = createAsyncThunk<
  { accessToken: string; refreshToken: string; tokenType: string },
  void,
  { state: RootState; rejectValue: string }
>("auth/refreshToken", async (_, { getState, rejectWithValue }) => {
  const { refreshToken: currentRefreshToken, user } = getState().auth;

  if (!currentRefreshToken) {
    return rejectWithValue(REFRESH_REFUSED);
  }

  try {
    const response = await apiFetch(
      API_ROUTES.authRefresh,
      jsonRequest("POST", { refresh_token: currentRefreshToken }),
    );

    if (!response.ok) {
      // Only a definite refusal ends the session. A 5xx or a 429 says nothing
      // about the token, and signing the user out for it would be wrong.
      return rejectWithValue(
        response.status === 401 ? REFRESH_REFUSED : REFRESH_UNAVAILABLE,
      );
    }

    const rawData = await readJson(response);
    const data = validateResponse(
      RefreshTokenResponseSchema,
      rawData,
      "token refresh",
    );

    const tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
    };
    // The old refresh token is now spent; the stored copy must be replaced.
    if (user) await persist({ ...tokens, user });
    return tokens;
  } catch (error) {
    logger.warn("refresh_failed", "Token refresh failed", { error });
    return rejectWithValue(REFRESH_UNAVAILABLE);
  }
});

export const logout = createAsyncThunk<void, void, { state: RootState }>(
  "auth/logout",
  async (_, { getState }) => {
    const { refreshToken, accessToken, tokenType } = getState().auth;
    // Forget the session on this device first: signing out must work offline.
    await clearSession();

    if (refreshToken) {
      try {
        const headers: Record<string, string> = {};
        if (accessToken && tokenType) {
          headers["Authorization"] = `${tokenType} ${accessToken}`;
        }

        const response = await apiFetch(API_ROUTES.authLogout, {
          ...jsonRequest("POST", { refresh_token: refreshToken }),
          headers,
        });

        if (!response.ok) {
          logger.warn("logout_rejected", "Logout API call failed", {
            status: response.status,
          });
        }
      } catch (error) {
        logger.warn("logout_failed", "Logout API call errored", { error });
      }
    }
  },
);

/** Fresh proof of ownership: the password, or a new Google / Apple token. */
export type DeletionProof =
  | { password: string }
  | { google_id_token: string }
  | { apple_identity_token: string };

/**
 * Permanently delete the account. The server requires fresh proof, so a
 * borrowed unlocked phone is not enough.
 */
export const deleteAccount = createAsyncThunk<
  void,
  DeletionProof,
  { state: RootState; rejectValue: string }
>("auth/deleteAccount", async (proof, { getState, rejectWithValue }) => {
  const { accessToken, tokenType } = getState().auth;
  try {
    const response = await apiFetch(API_ROUTES.authAccount, {
      ...jsonRequest("DELETE", proof),
      headers:
        accessToken && tokenType
          ? { Authorization: `${tokenType} ${accessToken}` }
          : {},
    });
    if (!response.ok) {
      if (response.status === 401) {
        return rejectWithValue(
          "password" in proof
            ? "That password is not correct."
            : "That sign-in does not match this account.",
        );
      }
      const message = parseApiError(await readJson(response));
      return rejectWithValue(
        message === "An error occurred"
          ? "Your account could not be deleted. Please try again."
          : message,
      );
    }
    await clearSession();
    logger.info("account_deleted", "Account deleted");
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Your account could not be deleted. Please try again.",
    );
  }
});

// Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Synchronous logout action (for use by apiClient when refresh fails)
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tokenType = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.tokenType = action.payload.tokenType;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(socialLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(socialLogin.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.tokenType = action.payload.tokenType;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(socialLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Sign-in failed";
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
        state.isAuthenticated = false;
        state.user = null;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Registration failed";
        state.isAuthenticated = false;
        state.user = null;
      });

    // Restore the stored session on a cold start
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.tokenType = action.payload.tokenType;
          state.isAuthenticated = true;
        }
        state.restoring = false;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.restoring = false;
      });

    // Refresh Token. A rejection does not sign anyone out here: the caller
    // (authFetch) decides, because a network error is not a revoked session.
    builder.addCase(refreshToken.fulfilled, (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.tokenType = action.payload.tokenType;
      state.error = null;
    });

    // Logout, and a deleted account, both end the session
    const signedOut = (state: AuthState) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tokenType = null;
      state.isAuthenticated = false;
      state.error = null;
    };
    builder
      .addCase(logout.fulfilled, signedOut)
      .addCase(logout.rejected, signedOut)
      .addCase(deleteAccount.fulfilled, signedOut);
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
