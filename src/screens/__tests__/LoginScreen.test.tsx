import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../LoginScreen';
import { useAppDispatch, useAppSelector } from '../../store';
import { login } from '../../store/slices/authSlice';

jest.mock('../../store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('../../store/slices/authSlice', () => ({
  login: Object.assign(jest.fn(), {
    fulfilled: { match: jest.fn(() => false) },
    rejected: { match: jest.fn(() => false) },
  }),
  resendVerification: Object.assign(jest.fn((email: string) => ({ type: 'auth/resendVerification', email })), {
    fulfilled: { match: jest.fn(() => true) },
  }),
}));

jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View, Text, TextInput, Button, TouchableOpacity } = require('react-native');
  return {
    Text: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
    Button: ({ children, onPress, ...props }: any) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    TextInput: ({ onChangeText, value, right, left, ...props }: any) => {
      const RightIcon = right;
      const LeftIcon = left;
      return (
        <View>
          <TextInput onChangeText={onChangeText} value={value} {...props} />
          {LeftIcon && (
            <View testID="left-icon-adornment">
              <TouchableOpacity onPress={LeftIcon.props?.onPress}>
                <Text>LeftIcon</Text>
              </TouchableOpacity>
            </View>
          )}
          {RightIcon && (
            <View testID="right-icon-adornment">
              <TouchableOpacity onPress={RightIcon.props?.onPress} testID="toggle-password-visibility">
                <Text>RightIcon</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    },
    Surface: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    useTheme: () => ({
      colors: {
        primary: '#374151',
        background: '#ffffff',
        surface: '#ffffff',
        onSurface: '#111827',
        onSurfaceVariant: '#6b7280',
        error: '#dc2626',
      },
    }),
  };
});

const mockDispatch = jest.fn();
const mockUseAppDispatch = useAppDispatch as jest.Mock;
const mockUseAppSelector = useAppSelector as jest.Mock;
const mockLogin = login as unknown as jest.Mock;

const createState = (overrides?: Partial<{ auth: any }>) => ({
  auth: {
    loading: false,
    error: null,
    ...((overrides?.auth) || {}),
  },
});

let currentState = createState();
let alertSpy: jest.SpyInstance;

beforeEach(async () => {
  currentState = createState();
  mockDispatch.mockReset();
  mockDispatch.mockImplementation(() => Promise.resolve());
  mockUseAppDispatch.mockReturnValue(mockDispatch);
  mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
    selector(currentState)
  );
  mockLogin.mockReset();
  mockLogin.mockImplementation(() => jest.fn());
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(async () => {
  alertSpy.mockRestore();
});

const renderLoginScreen = async (props?: Partial<React.ComponentProps<typeof LoginScreen>>) => {
  const navigation = { navigate: jest.fn() };
  return {
    navigation,
    ...(await render(<LoginScreen navigation={navigation as any} {...props} />)),
  };
};

describe('LoginScreen', () => {
  it('renders email and password inputs', async () => {
    const { getByTestId } = await renderLoginScreen();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
  });

  it('shows validation errors when submitting empty form', async () => {
    const { getByTestId, getByText } = await renderLoginScreen();
    await fireEvent.press(getByTestId('login-button'));
    expect(getByText('Email is required')).toBeTruthy();
    expect(getByText('Password is required')).toBeTruthy();
  });

  it('dispatches login action with valid credentials', async () => {
    const thunk = jest.fn();
    mockLogin.mockReturnValue(thunk);
    const { getByTestId } = await renderLoginScreen();

    await fireEvent.changeText(getByTestId('email-input'), 'user@example.com');
    await fireEvent.changeText(getByTestId('password-input'), 'secret123');

    await act(async () => {
      await fireEvent.press(getByTestId('login-button'));
    });

    expect(mockLogin).toHaveBeenCalledWith({ email: 'user@example.com', password: 'secret123' });
    expect(mockDispatch).toHaveBeenCalledWith(thunk);
  });

  it('toggles password visibility when eye icon is pressed', async () => {
    const { getByTestId } = await renderLoginScreen();
    const passwordInput = getByTestId('password-input');
    expect(passwordInput.props.secureTextEntry).toBe(true);
    await fireEvent.press(getByTestId('toggle-password-visibility'));
    expect(passwordInput.props.secureTextEntry).toBe(false);
  });

  it('navigates to register screen when link is pressed', async () => {
    const { getByTestId, navigation } = await renderLoginScreen();
    await fireEvent.press(getByTestId('register-link'));
    expect(navigation.navigate).toHaveBeenCalledWith('Register');
  });
});

describe('LoginScreen account recovery', () => {
  it('opens the forgot-password screen with the typed email', async () => {
    const { getByTestId, navigation } = await renderLoginScreen();
    await fireEvent.changeText(getByTestId('email-input'), 'user@example.com');

    await fireEvent.press(getByTestId('forgot-password-link'));

    expect(navigation.navigate).toHaveBeenCalledWith('ForgotPassword', {
      email: 'user@example.com',
    });
  });

  it('offers to resend the verification email when the account is unverified', async () => {
    const { login: mockedLogin, resendVerification } = jest.requireMock(
      '../../store/slices/authSlice',
    );
    mockedLogin.rejected.match.mockReturnValueOnce(true);
    mockDispatch
      .mockResolvedValueOnce({ payload: 'Email not verified' })
      .mockResolvedValueOnce({ payload: 'A new verification email is on its way.' });
    const { getByTestId } = await renderLoginScreen();
    await fireEvent.changeText(getByTestId('email-input'), 'user@example.com');
    await fireEvent.changeText(getByTestId('password-input'), 'secret123');

    await act(async () => {
      await fireEvent.press(getByTestId('login-button'));
    });

    const [title, , buttons] = alertSpy.mock.calls[0];
    expect(title).toBe('Verify Your Email');
    const resend = buttons.find((b: { text: string }) => b.text === 'Resend Email');

    await act(async () => {
      await resend.onPress();
    });

    expect(resendVerification).toHaveBeenCalledWith('user@example.com');
    expect(alertSpy.mock.calls[1][0]).toBe('Check Your Inbox');
  });
});
