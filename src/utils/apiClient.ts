import { ThunkDispatch } from "redux-thunk";
import { RootState } from "../store";
import { AuthActionTypes } from "../store/types/authTypes";
import { refreshToken } from "../store/actions/authActions";
import { logoutAction } from "../store/actions/authActions";

type FetchOptions = RequestInit & {
  body?: FormData | string;
};

/**
 * Makes an API call with automatic token refresh on 401 errors
 * @param url - The API endpoint URL
 * @param options - Fetch options (method, headers, body, etc.)
 * @param dispatch - Redux dispatch function
 * @param getState - Redux getState function
 * @param accessToken - Current access token
 * @param tokenType - Token type (e.g., "Bearer")
 * @returns Promise<Response>
 */
export const apiCallWithRefresh = async (
  url: string,
  options: FetchOptions,
  dispatch: ThunkDispatch<RootState, unknown, AuthActionTypes>,
  getState: () => RootState,
  accessToken: string | null,
  tokenType: string | null
): Promise<Response> => {
  // Add authorization header if token exists
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };

  if (accessToken && tokenType) {
    headers["Authorization"] = `${tokenType} ${accessToken}`;
  }

  // Make the initial request
  let response = await fetch(url, {
    ...options,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });

  // If we get a 401, try to refresh the token
  if (response.status === 401) {
    const refreshSuccess = await dispatch(refreshToken());

    if (refreshSuccess) {
      // Get the new token from state
      const newState = getState();
      const newAccessToken = newState.auth.accessToken;
      const newTokenType = newState.auth.tokenType;

      // Update headers with new token
      if (newAccessToken && newTokenType) {
        headers["Authorization"] = `${newTokenType} ${newAccessToken}`;
      }

      // Retry the original request with the new token
      response = await fetch(url, {
        ...options,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });
    } else {
      // Refresh failed, logout the user
      dispatch(logoutAction());
      throw new Error("Session expired. Please login again.");
    }
  }

  return response;
};

