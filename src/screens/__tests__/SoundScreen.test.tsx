import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SoundScreen from '../SoundScreen';
import { useAppDispatch, useAppSelector } from '../../store';
import { transcribeAudio, clearTranscribedText } from '../../store/actions/audioActions';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { AudioModule } from 'expo-audio';

jest.mock('../../store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('../../store/actions/audioActions', () => ({
  transcribeAudio: jest.fn(),
  clearTranscribedText: jest.fn(() => ({ type: 'CLEAR_TRANSCRIBED_TEXT' })),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
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

// Mock expo-audio
const mockAudioRecorder = {
  isRecording: false,
  uri: null,
  prepareToRecordAsync: jest.fn(() => Promise.resolve()),
  record: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
};

jest.mock('expo-audio', () => ({
  useAudioRecorder: jest.fn(() => mockAudioRecorder),
  RecordingPresets: {
    HIGH_QUALITY: {},
  },
  AudioModule: {
    requestRecordingPermissionsAsync: jest.fn(() =>
      Promise.resolve({ granted: true })
    ),
  },
}));

const mockDispatch = jest.fn();
const mockUseAppDispatch = useAppDispatch as jest.Mock;
const mockUseAppSelector = useAppSelector as jest.Mock;
const mockTranscribeAudio = transcribeAudio as jest.Mock;
const mockClearTranscribedText = clearTranscribedText as jest.Mock;
const mockClipboardSet = Clipboard.setStringAsync as jest.Mock;
const mockDocumentPicker = DocumentPicker.getDocumentAsync as jest.Mock;
const mockToastShow = (Toast as unknown as { show: jest.Mock }).show;
const mockRequestPermissions = AudioModule.requestRecordingPermissionsAsync as jest.Mock;

let alertSpy: jest.SpyInstance;

const createState = (overrides?: Partial<{ auth: any; audio: any; theme: any }>) => ({
  auth: {
    user: { id: '1', name: 'John Doe', email: 'john@example.com' },
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    tokenType: 'Bearer',
    isAuthenticated: true,
    loading: false,
    error: null,
    ...(overrides?.auth || {}),
  },
  audio: {
    transcribedText: null,
    transcribing: false,
    error: null,
    ...(overrides?.audio || {}),
  },
  theme: {
    mode: 'system',
    ...(overrides?.theme || {}),
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
  mockTranscribeAudio.mockReset();
  mockTranscribeAudio.mockImplementation(() => jest.fn());
  mockClearTranscribedText.mockClear();
  mockClearTranscribedText.mockReturnValue({ type: 'CLEAR_TRANSCRIBED_TEXT' });
  mockClipboardSet.mockClear();
  mockDocumentPicker.mockClear();
  mockToastShow.mockClear();
  mockRequestPermissions.mockClear();
  mockRequestPermissions.mockResolvedValue({ granted: true });
  mockAudioRecorder.isRecording = false;
  mockAudioRecorder.uri = null;
  mockAudioRecorder.prepareToRecordAsync.mockClear();
  mockAudioRecorder.record.mockClear();
  mockAudioRecorder.stop.mockClear();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => { });
});

afterEach(() => {
  alertSpy.mockRestore();
});

const renderSoundScreen = () => render(<SoundScreen />);

describe('SoundScreen', () => {
  it('renders the app title', () => {
    const { getByTestId } = renderSoundScreen();
    expect(getByTestId('app-header-title').props.children).toBe('Audio to Text');
  });

  it('renders welcome screen with record and upload buttons', () => {
    const { getByTestId } = renderSoundScreen();
    expect(getByTestId('start-recording-button')).toBeTruthy();
    expect(getByTestId('upload-audio-button')).toBeTruthy();
  });

  it('requests permission and starts recording when record button is pressed', async () => {
    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId('start-recording-button'));
    });

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(mockAudioRecorder.prepareToRecordAsync).toHaveBeenCalledTimes(1);
    expect(mockAudioRecorder.record).toHaveBeenCalledTimes(1);
  });

  it('shows alert when microphone permission is denied', async () => {
    mockRequestPermissions.mockResolvedValueOnce({ granted: false });
    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId('start-recording-button'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Permission Required',
      'Please grant microphone permission to record audio.'
    );
    expect(mockAudioRecorder.record).not.toHaveBeenCalled();
  });

  it('opens document picker when upload audio button is pressed', async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'mock-audio-uri', name: 'test-audio.m4a' }],
    });

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId('upload-audio-button'));
    });

    expect(mockDocumentPicker).toHaveBeenCalledWith({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });
  });

  it('displays audio file name after file upload', async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'mock-audio-uri', name: 'test-audio.m4a' }],
    });

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId('upload-audio-button'));
    });

    await waitFor(() => {
      expect(getByTestId('audio-file-name').props.children).toBe('test-audio.m4a');
    });
  });

  it('dispatches transcribeAudio when transcribe button is pressed', async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'mock-audio-uri', name: 'test-audio.m4a' }],
    });

    const transcribeThunk = jest.fn();
    mockTranscribeAudio.mockReturnValue(transcribeThunk);

    const { getByTestId } = renderSoundScreen();

    // Upload audio file
    await act(async () => {
      fireEvent.press(getByTestId('upload-audio-button'));
    });

    // Press transcribe button
    await act(async () => {
      fireEvent.press(getByTestId('transcribe-button'));
    });

    expect(mockTranscribeAudio).toHaveBeenCalledWith(
      'mock-audio-uri',
      'mock-access-token',
      'Bearer'
    );
    expect(mockDispatch).toHaveBeenCalledWith(transcribeThunk);
  });

  it('shows loader when transcribing is true', async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'mock-audio-uri', name: 'test-audio.m4a' }],
    });

    currentState = createState({ audio: { transcribing: true } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId('upload-audio-button'));
    });

    expect(getByTestId('transcribe-loader')).toBeTruthy();
  });

  it('displays transcribed text when available', async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'mock-audio-uri', name: 'test-audio.m4a' }],
    });

    currentState = createState({ audio: { transcribedText: 'Hello from audio' } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId('upload-audio-button'));
    });

    expect(getByTestId('transcribed-text').props.children).toBe('Hello from audio');
  });

  it('copies transcribed text to clipboard and shows toast', async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'mock-audio-uri', name: 'test-audio.m4a' }],
    });

    currentState = createState({ audio: { transcribedText: 'Copied Audio Text' } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId('upload-audio-button'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('copy-button'));
    });

    expect(mockClipboardSet).toHaveBeenCalledWith('Copied Audio Text');
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        text1: 'Text copied to clipboard',
      })
    );
  });

  it('clears audio and text when transcribe another button is pressed', async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'mock-audio-uri', name: 'test-audio.m4a' }],
    });

    currentState = createState({ audio: { transcribedText: 'Some text' } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId('upload-audio-button'));
    });

    await act(async () => {
      fireEvent.press(getByTestId('transcribe-another-button'));
    });

    expect(mockClearTranscribedText).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_TRANSCRIBED_TEXT' });
  });
});
