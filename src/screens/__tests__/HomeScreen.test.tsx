import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import HomeScreen from '../HomeScreen';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/actions/authActions';
import { extractText, clearExtractedText } from '../../store/actions/imageActions';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

jest.mock('../../store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('../../components/ImagePickerComponent', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ onImageSelected }: { onImageSelected: (uri: string) => void }) => (
    <Text
      testID="mock-image-picker"
      onPress={() => onImageSelected('mock-image-uri')}
      accessibilityRole="button"
    >
      Select Image
    </Text>
  );
});

jest.mock('../../store/actions/authActions', () => ({
  logout: jest.fn(() => ({ type: 'LOGOUT' })),
}));

jest.mock('../../store/actions/imageActions', () => ({
  extractText: jest.fn(),
  clearExtractedText: jest.fn(() => ({ type: 'CLEAR_EXTRACTED_TEXT' })),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
  },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

const mockDispatch = jest.fn();
const mockUseAppDispatch = useAppDispatch as jest.Mock;
const mockUseAppSelector = useAppSelector as jest.Mock;
const mockExtractText = extractText as jest.Mock;
const mockClearExtractedText = clearExtractedText as jest.Mock;
const mockLogout = logout as jest.Mock;
const mockClipboardSet = Clipboard.setStringAsync as jest.Mock;
const mockToastShow = (Toast as unknown as { show: jest.Mock }).show;

let alertSpy: jest.SpyInstance;

const createState = (overrides?: Partial<{ auth: any; image: any; theme: any }>) => ({
  auth: {
    user: { id: '1', name: 'John Doe', email: 'john@example.com' },
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenType: 'Bearer',
    isAuthenticated: true,
    loading: false,
    error: null,
    ...((overrides?.auth) || {}),
  },
  image: {
    extractedText: null,
    extracting: false,
    error: null,
    ...((overrides?.image) || {}),
  },
  theme: {
    mode: 'system',
    ...((overrides?.theme) || {}),
  },
});

let currentState = createState();

beforeEach(() => {
  currentState = createState();
  mockDispatch.mockReset();
  mockDispatch.mockImplementation(() => Promise.resolve());
  mockUseAppDispatch.mockReturnValue(mockDispatch);
  mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
    selector(currentState)
  );
  mockExtractText.mockReset();
  mockExtractText.mockImplementation(() => jest.fn());
  mockClearExtractedText.mockClear();
  mockClearExtractedText.mockReturnValue({ type: 'CLEAR_EXTRACTED_TEXT' });
  mockLogout.mockClear();
  mockLogout.mockReturnValue({ type: 'LOGOUT' });
  mockClipboardSet.mockClear();
  mockToastShow.mockClear();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
});

const renderHomeScreen = () => render(<HomeScreen />);

describe('HomeScreen', () => {
  it('renders the app title', () => {
    const { getByTestId } = renderHomeScreen();
    expect(getByTestId('app-header-title').props.children).toBe('Image to Text');
  });

  it('displays welcome message when user exists', () => {
    const { getByTestId } = renderHomeScreen();
    expect(getByTestId('app-header-subtitle').props.children).toContain('John Doe');
  });

  it('renders image picker when no image is selected', () => {
    const { getByTestId } = renderHomeScreen();
    expect(getByTestId('mock-image-picker')).toBeTruthy();
  });

  it('dispatches clearExtractedText when an image is selected', () => {
    const { getByTestId } = renderHomeScreen();
    fireEvent.press(getByTestId('mock-image-picker'));
    expect(mockClearExtractedText).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_EXTRACTED_TEXT' });
  });

  it('shows extract button after image selection', () => {
    const { getByTestId, getByText } = renderHomeScreen();
    fireEvent.press(getByTestId('mock-image-picker'));
    expect(getByText('Extract Text from Picture')).toBeTruthy();
  });

  it('dispatches extractText when extract button is pressed', async () => {
    const extractThunk = jest.fn();
    mockExtractText.mockReturnValue(extractThunk);
    const { getByTestId, getByText } = renderHomeScreen();
    fireEvent.press(getByTestId('mock-image-picker'));

    await act(async () => {
      fireEvent.press(getByText('Extract Text from Picture'));
    });

    expect(mockExtractText).toHaveBeenCalledWith(
      'mock-image-uri',
      'mock-access-token',
      'Bearer'
    );
    expect(mockDispatch).toHaveBeenCalledWith(extractThunk);
  });

  it('shows loader when extracting is true', () => {
    currentState = createState({ image: { extracting: true } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );
    const { getByTestId } = renderHomeScreen();
    fireEvent.press(getByTestId('mock-image-picker'));
    expect(getByTestId('extract-loader')).toBeTruthy();
  });

  it('displays extracted text when available and hides extract button', () => {
    currentState = createState({ image: { extractedText: 'Hello World' } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );
    const { getByTestId, queryByText } = renderHomeScreen();
    fireEvent.press(getByTestId('mock-image-picker'));
    expect(getByTestId('extracted-text').props.children).toBe('Hello World');
    expect(queryByText('Extract Text from Picture')).toBeNull();
  });

  it('copies extracted text to clipboard and shows toast', async () => {
    currentState = createState({ image: { extractedText: 'Copied Text' } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );
    const { getByTestId } = renderHomeScreen();
    fireEvent.press(getByTestId('mock-image-picker'));

    await act(async () => {
      fireEvent.press(getByTestId('copy-button'));
    });

    expect(mockClipboardSet).toHaveBeenCalledWith('Copied Text');
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        text1: 'Text copied to clipboard',
      })
    );
  });

  it('dispatches logout action when logout button is pressed', () => {
    const { getByTestId } = renderHomeScreen();
    fireEvent.press(getByTestId('logout-button'));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOGOUT' });
  });
});
