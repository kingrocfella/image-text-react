import { apiCallWithRefresh } from '../apiClient';
import { refreshToken, logoutAction } from '../../store/actions/authActions';
import { ThunkDispatch } from 'redux-thunk';
import { RootState } from '../../store';
import { AuthActionTypes } from '../../store/types/authTypes';

// Mock the auth actions
jest.mock('../../store/actions/authActions', () => ({
  refreshToken: jest.fn(),
  logoutAction: jest.fn(() => ({ type: 'LOGOUT' })),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('apiCallWithRefresh', () => {
  let mockDispatch: jest.MockedFunction<ThunkDispatch<RootState, unknown, AuthActionTypes>>;
  let mockGetState: jest.MockedFunction<() => RootState>;
  const mockRefreshToken = refreshToken as jest.Mock;

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    mockRefreshToken.mockClear();
    
    mockGetState = jest.fn(() => ({
      auth: {
        user: { id: '1', name: 'John Doe', email: 'test@example.com' },
        accessToken: 'new-access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    })) as jest.MockedFunction<() => RootState>;

    mockDispatch = jest.fn((action: any) => {
      if (typeof action === 'function') {
        // It's a thunk, call it and return the result
        return action(mockDispatch, mockGetState, undefined);
      }
      return Promise.resolve(action);
    }) as jest.MockedFunction<ThunkDispatch<RootState, unknown, AuthActionTypes>>;
  });

  it('should make API call with authorization header when token exists', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'success' }),
    });

    await apiCallWithRefresh(
      'https://api.example.com/test',
      { method: 'GET' },
      mockDispatch,
      mockGetState,
      'access-token',
      'Bearer'
    );

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer access-token',
      },
    });
  });

  it('should make API call without authorization header when token is null', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'success' }),
    });

    await apiCallWithRefresh(
      'https://api.example.com/test',
      { method: 'GET' },
      mockDispatch,
      mockGetState,
      null,
      null
    );

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
      method: 'GET',
      headers: undefined,
    });
  });

  it('should refresh token and retry request on 401 error', async () => {
    mockRefreshToken.mockReturnValue(() => Promise.resolve(true));

    // First call returns 401
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      })
      // Second call (after refresh) succeeds
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' }),
      });

    mockGetState.mockReturnValue({
      auth: {
        user: { id: '1', name: 'John Doe', email: 'test@example.com' },
        accessToken: 'new-access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    } as RootState);

    const response = await apiCallWithRefresh(
      'https://api.example.com/test',
      { method: 'GET' },
      mockDispatch,
      mockGetState,
      'old-access-token',
      'Bearer'
    );

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
    
    // Verify second call uses new token
    expect(fetch).toHaveBeenLastCalledWith('https://api.example.com/test', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer new-access-token',
      },
    });
  });

  it('should logout user when refresh token fails', async () => {
    mockRefreshToken.mockReturnValue(() => Promise.resolve(false));

    // First call returns 401
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    await expect(
      apiCallWithRefresh(
        'https://api.example.com/test',
        { method: 'GET' },
        mockDispatch,
        mockGetState,
        'old-access-token',
        'Bearer'
      )
    ).rejects.toThrow('Session expired. Please login again.');

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOGOUT' });
    expect(fetch).toHaveBeenCalledTimes(1); // Should not retry after failed refresh
  });

  it('should preserve existing headers when adding authorization', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'success' }),
    });

    await apiCallWithRefresh(
      'https://api.example.com/test',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      },
      mockDispatch,
      mockGetState,
      'access-token',
      'Bearer'
    );

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer access-token',
      },
      body: JSON.stringify({ test: 'data' }),
    });
  });

  it('should handle FormData body correctly', async () => {
    const formData = new FormData();
    formData.append('file', 'test');

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: 'success' }),
    });

    await apiCallWithRefresh(
      'https://api.example.com/upload',
      {
        method: 'POST',
        body: formData,
      },
      mockDispatch,
      mockGetState,
      'access-token',
      'Bearer'
    );

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/upload', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer access-token',
      },
      body: formData,
    });
  });
});

