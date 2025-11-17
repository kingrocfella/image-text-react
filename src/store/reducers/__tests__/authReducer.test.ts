import authReducer from '../authReducer';
import { AuthState } from '../../types/authTypes';

describe('authReducer', () => {
  const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    tokenType: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  };

  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'UNKNOWN_ACTION' as any })).toEqual(initialState);
  });

  it('should handle LOGIN_REQUEST', () => {
    const action = { type: 'LOGIN_REQUEST' as const };
    const state = authReducer(initialState, action);
    expect(state.loading).toBe(true);
    expect(state.error).toBe(null);
  });

  it('should handle LOGIN_SUCCESS', () => {
    const user = { id: '1', name: 'John Doe', email: 'john@example.com' };
    const action = {
      type: 'LOGIN_SUCCESS' as const,
      payload: {
        user,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
      },
    };
    const state = authReducer(initialState, action);
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe('new-access-token');
    expect(state.refreshToken).toBe('new-refresh-token');
    expect(state.tokenType).toBe('Bearer');
    expect(state.isAuthenticated).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle LOGIN_FAILURE', () => {
    const action = {
      type: 'LOGIN_FAILURE' as const,
      payload: 'Invalid credentials',
    };
    const state = authReducer(initialState, action);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Invalid credentials');
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
  });

  it('should handle REFRESH_TOKEN_SUCCESS', () => {
    const stateWithUser: AuthState = {
      user: { id: '1', name: 'John Doe', email: 'john@example.com' },
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token',
      tokenType: 'Bearer',
      isAuthenticated: true,
      loading: false,
      error: null,
    };
    const action = {
      type: 'REFRESH_TOKEN_SUCCESS' as const,
      payload: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        tokenType: 'Bearer',
      },
    };
    const state = authReducer(stateWithUser, action);
    expect(state.accessToken).toBe('new-access-token');
    expect(state.refreshToken).toBe('new-refresh-token');
    expect(state.tokenType).toBe('Bearer');
    expect(state.user).toEqual(stateWithUser.user); // User should remain unchanged
    expect(state.isAuthenticated).toBe(true);
    expect(state.error).toBe(null);
  });

  it('should handle REFRESH_TOKEN_FAILURE', () => {
    const stateWithUser: AuthState = {
      user: { id: '1', name: 'John Doe', email: 'john@example.com' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      isAuthenticated: true,
      loading: false,
      error: null,
    };
    const action = { type: 'REFRESH_TOKEN_FAILURE' as const };
    const state = authReducer(stateWithUser, action);
    expect(state.user).toBe(null);
    expect(state.accessToken).toBe(null);
    expect(state.refreshToken).toBe(null);
    expect(state.tokenType).toBe(null);
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle LOGOUT', () => {
    const stateWithUser: AuthState = {
      user: { id: '1', name: 'John Doe', email: 'john@example.com' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      isAuthenticated: true,
      loading: false,
      error: null,
    };
    const action = { type: 'LOGOUT' as const };
    const state = authReducer(stateWithUser, action);
    expect(state).toEqual(initialState);
  });

  it('should handle REGISTER_REQUEST', () => {
    const action = { type: 'REGISTER_REQUEST' as const };
    const state = authReducer(initialState, action);
    expect(state.loading).toBe(true);
    expect(state.error).toBe(null);
  });

  it('should handle REGISTER_SUCCESS', () => {
    const action = { type: 'REGISTER_SUCCESS' as const };
    const state = authReducer(initialState, action);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle REGISTER_FAILURE', () => {
    const action = {
      type: 'REGISTER_FAILURE' as const,
      payload: 'Registration failed',
    };
    const state = authReducer(initialState, action);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Registration failed');
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
  });
});

