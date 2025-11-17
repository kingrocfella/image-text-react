import { ThunkAction } from "redux-thunk";
import { RootState } from "../index";
import {
  AuthActionTypes,
  LoginCredentials,
  RegisterCredentials,
  User,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
} from "../types/authTypes";
import { API_CONFIG } from "../../../config";

export const loginRequest = (): AuthActionTypes => ({ type: "LOGIN_REQUEST" });
export const loginSuccess = (
  user: User,
  accessToken: string,
  refreshToken: string,
  tokenType: string
): AuthActionTypes => ({
  type: "LOGIN_SUCCESS",
  payload: { user, accessToken, refreshToken, tokenType },
});
export const loginFailure = (error: string): AuthActionTypes => ({
  type: "LOGIN_FAILURE",
  payload: error,
});

export const registerRequest = (): AuthActionTypes => ({
  type: "REGISTER_REQUEST",
});
export const registerSuccess = (): AuthActionTypes => ({
  type: "REGISTER_SUCCESS",
});
export const registerFailure = (error: string): AuthActionTypes => ({
  type: "REGISTER_FAILURE",
  payload: error,
});

export const refreshTokenSuccess = (
  accessToken: string,
  refreshToken: string,
  tokenType: string
): AuthActionTypes => ({
  type: "REFRESH_TOKEN_SUCCESS",
  payload: { accessToken, refreshToken, tokenType },
});

export const refreshTokenFailure = (): AuthActionTypes => ({
  type: "REFRESH_TOKEN_FAILURE",
});

export const logoutAction = (): AuthActionTypes => ({ type: "LOGOUT" });

export const logout = (): ThunkAction<
  Promise<void>,
  RootState,
  unknown,
  AuthActionTypes
> => {
  return async (dispatch, getState) => {
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

        // Log error but don't block logout because we still want to clear local state
        if (!response.ok) {
          console.error("Logout API call failed:", response.statusText);
        }
      } catch (error) {
        console.error("Logout API error:", error);
      }
    }

    // clear local state
    dispatch(logoutAction());
  };
};

export const login = (
  credentials: LoginCredentials
): ThunkAction<Promise<void>, RootState, unknown, AuthActionTypes> => {
  return async (dispatch) => {
    dispatch(loginRequest());

    try {
      console.log(`${API_CONFIG.BASE_URL}/auth/login`);
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
        throw new Error(errorData.detail || "Login failed");
      }

      const data: LoginResponse = await response.json();

      const user: User = {
        id: data.user_id,
        name: data.name,
        email: credentials.email,
      };

      dispatch(
        loginSuccess(
          user,
          data.access_token,
          data.refresh_token,
          data.token_type
        )
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      dispatch(loginFailure(errorMessage));
      throw error;
    }
  };
};

export const register = (
  credentials: RegisterCredentials
): ThunkAction<Promise<string>, RootState, unknown, AuthActionTypes> => {
  return async (dispatch) => {
    dispatch(registerRequest());

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
        throw new Error(errorData.message || "Registration failed");
      }

      const data: RegisterResponse = await response.json();

      dispatch(registerSuccess());

      return data.message;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      dispatch(registerFailure(errorMessage));
      throw error;
    }
  };
};

export const refreshToken = (): ThunkAction<
  Promise<boolean>,
  RootState,
  unknown,
  AuthActionTypes
> => {
  return async (dispatch, getState) => {
    const { refreshToken: currentRefreshToken } = getState().auth;

    if (!currentRefreshToken) {
      dispatch(refreshTokenFailure());
      return false;
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
        dispatch(refreshTokenFailure());
        return false;
      }

      const data: RefreshTokenResponse = await response.json();

      dispatch(
        refreshTokenSuccess(
          data.access_token,
          data.refresh_token,
          data.token_type
        )
      );

      return true;
    } catch (error) {
      console.error("Refresh token error:", error);
      dispatch(refreshTokenFailure());
      return false;
    }
  };
};
