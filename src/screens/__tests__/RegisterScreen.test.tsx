import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '../RegisterScreen';
import { useAppDispatch, useAppSelector } from '../../store';
import { register } from '../../store/slices/authSlice';

jest.mock('../../store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('../../store/slices/authSlice', () => ({
  register: Object.assign(jest.fn(), {
    fulfilled: { match: jest.fn(() => false) },
    rejected: { match: jest.fn(() => false) },
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
const mockRegister = register as unknown as jest.Mock;

const createState = (overrides?: Partial<{ auth: any }>) => ({
  auth: {
    loading: false,
    error: null,
    ...((overrides?.auth) || {}),
  },
});

let currentState = createState();
let alertSpy: jest.SpyInstance;

beforeEach(() => {
  currentState = createState();
  mockDispatch.mockReset();
  mockDispatch.mockImplementation(() => Promise.resolve('Check your email'));
  mockUseAppDispatch.mockReturnValue(mockDispatch);
  mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
    selector(currentState)
  );
  mockRegister.mockReset();
  const thunk = jest.fn(() => Promise.resolve('Check your email'));
  mockRegister.mockReturnValue(thunk);
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
});

const renderRegisterScreen = (props?: Partial<React.ComponentProps<typeof RegisterScreen>>) => {
  const navigation = { navigate: jest.fn() };
  return {
    navigation,
    ...render(<RegisterScreen navigation={navigation as any} {...props} />),
  };
};

describe('RegisterScreen', () => {
  it('renders name, email, and password inputs', () => {
    const { getByTestId } = renderRegisterScreen();
    expect(getByTestId('name-input')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
  });

  it('shows validation errors when form is empty on submit', () => {
    const { getByTestId, getByText } = renderRegisterScreen();
    fireEvent.press(getByTestId('register-button'));
    expect(getByText('Name is required')).toBeTruthy();
    expect(getByText('Email is required')).toBeTruthy();
    expect(getByText('Password is required')).toBeTruthy();
  });

  it('dispatches register action with valid data', async () => {
    const thunk = jest.fn(() => Promise.resolve('Success')); 
    mockRegister.mockReturnValue(thunk);
    const { getByTestId } = renderRegisterScreen();

    fireEvent.changeText(getByTestId('name-input'), 'John Doe');
    fireEvent.changeText(getByTestId('email-input'), 'john@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'secret123');

    await act(async () => {
      fireEvent.press(getByTestId('register-button'));
    });

    expect(mockRegister).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'secret123',
    });
    expect(mockDispatch).toHaveBeenCalledWith(thunk);
  });

  it('toggles password visibility when eye icon is pressed', () => {
    const { getByTestId } = renderRegisterScreen();
    const passwordInput = getByTestId('password-input');
    expect(passwordInput.props.secureTextEntry).toBe(true);
    // Material Design TextInput.Icon renders as right-icon-adornment
    const toggleButton = getByTestId('toggle-password-visibility');
    fireEvent.press(toggleButton);
    // After toggle, secureTextEntry should be false
    expect(passwordInput.props.secureTextEntry).toBe(false);
  });

  it('navigates to login screen when link is pressed', () => {
    const { getByTestId, navigation } = renderRegisterScreen();
    fireEvent.press(getByTestId('login-link'));
    expect(navigation.navigate).toHaveBeenCalledWith('Login');
  });
});
