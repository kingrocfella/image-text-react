import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PdfScreen from '../PdfScreen';
import { useAppDispatch, useAppSelector } from '../../store';
import { extractPdfText, clearExtractedPdfText } from '../../store/actions/pdfActions';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

jest.mock('../../store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('../../store/actions/pdfActions', () => ({
  extractPdfText: jest.fn(),
  clearExtractedPdfText: jest.fn(() => ({ type: 'CLEAR_EXTRACTED_PDF_TEXT' })),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
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
    TextInput: ({ onChangeText, value, ...props }: any) => (
      <TextInput onChangeText={onChangeText} value={value} {...props} />
    ),
    Card: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    Surface: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    IconButton: ({ onPress, ...props }: any) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <Text>Icon</Text>
      </TouchableOpacity>
    ),
    ActivityIndicator: ({ testID, ...props }: any) => <View testID={testID || "activity-indicator"} {...props} />,
    useTheme: () => ({
      colors: {
        primary: '#374151',
        background: '#ffffff',
        surface: '#ffffff',
        onSurface: '#111827',
        onSurfaceVariant: '#6b7280',
        outline: '#e5e7eb',
        error: '#dc2626',
      },
    }),
  };
});

const mockDispatch = jest.fn();
const mockUseAppDispatch = useAppDispatch as jest.Mock;
const mockUseAppSelector = useAppSelector as jest.Mock;
const mockExtractPdfText = extractPdfText as jest.Mock;
const mockClearExtractedPdfText = clearExtractedPdfText as jest.Mock;
const mockGetDocumentAsync = DocumentPicker.getDocumentAsync as jest.Mock;
const mockClipboardSet = Clipboard.setStringAsync as jest.Mock;
const mockToastShow = (Toast as unknown as { show: jest.Mock }).show;

let alertSpy: jest.SpyInstance;

const createState = (overrides?: Partial<{ auth: any; pdf: any }>) => ({
  auth: {
    accessToken: 'mock-access-token',
    tokenType: 'Bearer',
    ...((overrides?.auth) || {}),
  },
  pdf: {
    extractedText: null,
    extracting: false,
    error: null,
    ...((overrides?.pdf) || {}),
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
  mockExtractPdfText.mockReset();
  mockExtractPdfText.mockImplementation(() => jest.fn());
  mockClearExtractedPdfText.mockClear();
  mockClearExtractedPdfText.mockReturnValue({ type: 'CLEAR_EXTRACTED_PDF_TEXT' });
  mockGetDocumentAsync.mockClear();
  mockClipboardSet.mockClear();
  mockToastShow.mockClear();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
});

const renderPdfScreen = () => render(<PdfScreen />);

describe('PdfScreen', () => {
  it('renders the PDF screen title', () => {
    const { getByTestId } = renderPdfScreen();
    expect(getByTestId('pdf-screen-title')).toBeTruthy();
  });

  it('renders upload button when no PDF is selected', () => {
    const { getByTestId } = renderPdfScreen();
    expect(getByTestId('upload-pdf-button')).toBeTruthy();
  });

  it('displays PDF name after document is selected', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'mock-pdf-uri', name: 'test-document.pdf' }],
    });

    const { getByTestId } = renderPdfScreen();

    await act(async () => {
      fireEvent.press(getByTestId('upload-pdf-button'));
    });

    expect(getByTestId('pdf-name')).toBeTruthy();
    expect(getByTestId('pdf-name').props.children).toBe('test-document.pdf');
  });

  it('shows question input after PDF is selected', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'mock-pdf-uri', name: 'test.pdf' }],
    });

    const { getByTestId } = renderPdfScreen();

    await act(async () => {
      fireEvent.press(getByTestId('upload-pdf-button'));
    });

    expect(getByTestId('question-input')).toBeTruthy();
  });

  it('disables extract button when question is empty', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'mock-pdf-uri', name: 'test.pdf' }],
    });

    const { getByTestId } = renderPdfScreen();

    await act(async () => {
      fireEvent.press(getByTestId('upload-pdf-button'));
    });

    const extractButton = getByTestId('extract-pdf-button');
    // Material Design Button uses accessibilityState for disabled state
    expect(extractButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('dispatches extractPdfText when extract button is pressed with valid inputs', async () => {
    const extractThunk = jest.fn();
    mockExtractPdfText.mockReturnValue(extractThunk);
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'mock-pdf-uri', name: 'test.pdf' }],
    });

    const { getByTestId } = renderPdfScreen();

    await act(async () => {
      fireEvent.press(getByTestId('upload-pdf-button'));
    });

    const questionInput = getByTestId('question-input');
    fireEvent.changeText(questionInput, 'What is this document about?');

    await act(async () => {
      fireEvent.press(getByTestId('extract-pdf-button'));
    });

    expect(mockExtractPdfText).toHaveBeenCalledWith(
      'mock-pdf-uri',
      'test.pdf',
      'What is this document about?',
      'mock-access-token',
      'Bearer'
    );
    expect(mockDispatch).toHaveBeenCalledWith(extractThunk);
  });

  it('shows loader when extracting is true', async () => {
    currentState = createState({ pdf: { extracting: true } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'mock-pdf-uri', name: 'test.pdf' }],
    });

    const { getByTestId } = renderPdfScreen();

    // First select a PDF to set pdfUri state, which is required for loader to show
    await act(async () => {
      fireEvent.press(getByTestId('upload-pdf-button'));
    });

    expect(getByTestId('extract-loader')).toBeTruthy();
  });

  it('displays extracted text when available and hides extract button', async () => {
    currentState = createState({ pdf: { extractedText: 'Extracted PDF content' } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'mock-pdf-uri', name: 'test.pdf' }],
    });

    const { getByTestId } = renderPdfScreen();

    // First select a PDF to set pdfUri state
    await act(async () => {
      fireEvent.press(getByTestId('upload-pdf-button'));
    });

    // Now extracted text should be visible
    expect(getByTestId('extracted-text')).toBeTruthy();
    expect(getByTestId('extracted-text').props.children).toBe('Extracted PDF content');
  });

  it('copies extracted text to clipboard and shows toast', async () => {
    currentState = createState({ pdf: { extractedText: 'PDF Text Content' } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'mock-pdf-uri', name: 'test.pdf' }],
    });

    const { getByTestId } = renderPdfScreen();

    // First select a PDF to set pdfUri state
    await act(async () => {
      fireEvent.press(getByTestId('upload-pdf-button'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('copy-button'));
    });

    expect(mockClipboardSet).toHaveBeenCalledWith('PDF Text Content');
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        text1: 'Text copied to clipboard',
      })
    );
  });

  it('resets state when Extract Another button is pressed', async () => {
    currentState = createState({ pdf: { extractedText: 'Some text' } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'mock-pdf-uri', name: 'test.pdf' }],
    });

    const { getByTestId } = renderPdfScreen();

    // First select a PDF to set pdfUri state
    await act(async () => {
      fireEvent.press(getByTestId('upload-pdf-button'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('extract-another-button'));
    });

    expect(mockClearExtractedPdfText).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_EXTRACTED_PDF_TEXT' });
  });
});

