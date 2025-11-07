import { AuthActionTypes, AuthState } from '../types/authTypes';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  tokenType: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authReducer = (state = initialState, action: AuthActionTypes): AuthState => {
  switch (action.type) {
    case 'LOGIN_REQUEST':
    case 'REGISTER_REQUEST':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        tokenType: action.payload.tokenType,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        user: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        tokenType: null,
        isAuthenticated: false,
        error: null,
      };
    default:
      return state;
  }
};

export default authReducer;

