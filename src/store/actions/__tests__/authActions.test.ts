import configureStore from 'redux-mock-store';
import {
  login,
  register,
  refreshToken,
  logout,
  loginRequest,
  loginSuccess,
  loginFailure,
  refreshTokenSuccess,
  refreshTokenFailure,
  logoutAction,
} from '../authActions';
import { API_CONFIG } from '../../../../config';

// Import thunk correctly for redux-mock-store
const thunkMiddleware = require('redux-thunk');
const thunk = thunkMiddleware.thunk || thunkMiddleware.default || thunkMiddleware;
const middlewares = [thunk];
const mockStore = configureStore(middlewares);

// Mock fetch globally
global.fetch = jest.fn();

describe('authActions', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('login', () => {
    it('should dispatch LOGIN_SUCCESS on successful login', async () => {
      const mockResponse: any = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
        name: 'John Doe',
        user_id: '1',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const store = mockStore({
        auth: {
          user: null,
          accessToken: null,
          refreshToken: null,
          tokenType: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
      });

      await store.dispatch(
        login({ email: 'test@example.com', password: 'password123' }) as any
      );

      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'LOGIN_REQUEST' });
      expect(actions[1]).toEqual({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: {
            id: '1',
            name: 'John Doe',
            email: 'test@example.com',
          },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          tokenType: 'Bearer',
        },
      });
    });

    it('should dispatch LOGIN_FAILURE on failed login', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid credentials' }),
      });

      const store = mockStore({
        auth: {
          user: null,
          accessToken: null,
          refreshToken: null,
          tokenType: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
      });

      try {
        await store.dispatch(
          login({ email: 'test@example.com', password: 'wrong' }) as any
        );
      } catch (error) {
        // Expected to throw
      }

      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'LOGIN_REQUEST' });
      expect(actions[1].type).toBe('LOGIN_FAILURE');
      expect(actions[1].payload).toBe('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should dispatch REFRESH_TOKEN_SUCCESS on successful refresh', async () => {
      const mockResponse: any = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const store = mockStore({
        auth: {
          user: { id: '1', name: 'John Doe', email: 'test@example.com' },
          accessToken: 'old-access-token',
          refreshToken: 'old-refresh-token',
          tokenType: 'Bearer',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      });

      const result = await store.dispatch(refreshToken() as any);

      expect(result).toBe(true);
      const actions = store.getActions();
      expect(actions[0]).toEqual({
        type: 'REFRESH_TOKEN_SUCCESS',
        payload: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          tokenType: 'Bearer',
        },
      });
      expect(fetch).toHaveBeenCalledWith(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: 'old-refresh-token',
        }),
      });
    });

    it('should dispatch REFRESH_TOKEN_FAILURE when refresh token is missing', async () => {
      const store = mockStore({
        auth: {
          user: null,
          accessToken: null,
          refreshToken: null,
          tokenType: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
      });

      const result = await store.dispatch(refreshToken() as any);

      expect(result).toBe(false);
      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'REFRESH_TOKEN_FAILURE' });
    });

    it('should dispatch REFRESH_TOKEN_FAILURE on failed refresh', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const store = mockStore({
        auth: {
          user: { id: '1', name: 'John Doe', email: 'test@example.com' },
          accessToken: 'old-access-token',
          refreshToken: 'old-refresh-token',
          tokenType: 'Bearer',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      });

      const result = await store.dispatch(refreshToken() as any);

      expect(result).toBe(false);
      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'REFRESH_TOKEN_FAILURE' });
    });

    it('should dispatch REFRESH_TOKEN_FAILURE on network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const store = mockStore({
        auth: {
          user: { id: '1', name: 'John Doe', email: 'test@example.com' },
          accessToken: 'old-access-token',
          refreshToken: 'old-refresh-token',
          tokenType: 'Bearer',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      });

      const result = await store.dispatch(refreshToken() as any);

      expect(result).toBe(false);
      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'REFRESH_TOKEN_FAILURE' });
    });
  });

  describe('logout', () => {
    it('should call logout API and dispatch LOGOUT', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      const store = mockStore({
        auth: {
          user: { id: '1', name: 'John Doe', email: 'test@example.com' },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          tokenType: 'Bearer',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      });

      await store.dispatch(logout() as any);

      expect(fetch).toHaveBeenCalledWith(`${API_CONFIG.BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer access-token',
        },
        body: JSON.stringify({
          refresh_token: 'refresh-token',
        }),
      });

      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'LOGOUT' });
    });

    it('should dispatch LOGOUT even if logout API fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const store = mockStore({
        auth: {
          user: { id: '1', name: 'John Doe', email: 'test@example.com' },
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          tokenType: 'Bearer',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      });

      await store.dispatch(logout() as any);

      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'LOGOUT' });
    });

    it('should dispatch LOGOUT even if no refresh token', async () => {
      const store = mockStore({
        auth: {
          user: { id: '1', name: 'John Doe', email: 'test@example.com' },
          accessToken: 'access-token',
          refreshToken: null,
          tokenType: 'Bearer',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      });

      await store.dispatch(logout() as any);

      const actions = store.getActions();
      expect(actions[0]).toEqual({ type: 'LOGOUT' });
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('action creators', () => {
    it('should create loginRequest action', () => {
      expect(loginRequest()).toEqual({ type: 'LOGIN_REQUEST' });
    });

    it('should create loginSuccess action', () => {
      const user = { id: '1', name: 'John', email: 'john@example.com' };
      expect(loginSuccess(user, 'token', 'refresh', 'Bearer')).toEqual({
        type: 'LOGIN_SUCCESS',
        payload: {
          user,
          accessToken: 'token',
          refreshToken: 'refresh',
          tokenType: 'Bearer',
        },
      });
    });

    it('should create loginFailure action', () => {
      expect(loginFailure('Error')).toEqual({
        type: 'LOGIN_FAILURE',
        payload: 'Error',
      });
    });

    it('should create refreshTokenSuccess action', () => {
      expect(refreshTokenSuccess('token', 'refresh', 'Bearer')).toEqual({
        type: 'REFRESH_TOKEN_SUCCESS',
        payload: {
          accessToken: 'token',
          refreshToken: 'refresh',
          tokenType: 'Bearer',
        },
      });
    });

    it('should create refreshTokenFailure action', () => {
      expect(refreshTokenFailure()).toEqual({ type: 'REFRESH_TOKEN_FAILURE' });
    });

    it('should create logoutAction', () => {
      expect(logoutAction()).toEqual({ type: 'LOGOUT' });
    });
  });
});

