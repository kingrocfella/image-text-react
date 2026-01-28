import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_CONFIG } from "../../../config";
import { RootState } from "../index";
import {
  LoginResponseSchema,
  RegisterResponseSchema,
  RefreshTokenResponseSchema,
  validateResponse,
  parseApiError,
} from "../../api/schemas";

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
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  tokenType: null,
  isAuthenticated: false,
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
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Login failed" }));
      return rejectWithValue(parseApiError(errorData));
    }

    const rawData = await response.json();
    const data = validateResponse(LoginResponseSchema, rawData, "login");

    const user: User = {
      id: data.user_id,
      name: data.name,
      email: credentials.email,
    };

    return {
      user,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
    };
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
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Registration failed" }));
      return rejectWithValue(parseApiError(errorData));
    }

    const rawData = await response.json();
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

export const refreshToken = createAsyncThunk<
  { accessToken: string; refreshToken: string; tokenType: string },
  void,
  { state: RootState; rejectValue: string }
>("auth/refreshToken", async (_, { getState, rejectWithValue }) => {
  const { refreshToken: currentRefreshToken } = getState().auth;

  if (!currentRefreshToken) {
    return rejectWithValue("No refresh token available");
  }

  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: currentRefreshToken,
      }),
    });

    if (!response.ok) {
      return rejectWithValue("Token refresh failed");
    }

    const rawData = await response.json();
    const data = validateResponse(
      RefreshTokenResponseSchema,
      rawData,
      "token refresh",
    );

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
    };
  } catch (error) {
    console.error("Refresh token error:", error);
    return rejectWithValue("Token refresh failed");
  }
});

export const logout = createAsyncThunk<void, void, { state: RootState }>(
  "auth/logout",
  async (_, { getState }) => {
    const { refreshToken, accessToken, tokenType } = getState().auth;

    if (refreshToken) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (accessToken && tokenType) {
          headers["Authorization"] = `${tokenType} ${accessToken}`;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        });

        if (!response.ok) {
          console.error("Logout API call failed:", response.statusText);
        }
      } catch (error) {
        console.error("Logout API error:", error);
      }
    }
  },
);

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

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.tokenType = action.payload.tokenType;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.tokenType = null;
        state.isAuthenticated = false;
        state.error = null;
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.tokenType = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
