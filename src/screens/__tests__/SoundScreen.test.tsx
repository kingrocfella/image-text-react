import React from "react";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import SoundScreen from "../SoundScreen";
import { useAudioTranscription } from "../../hooks";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import { AudioModule } from "expo-audio";

jest.mock("../../components/ThemeToggle", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => <View testID="theme-toggle" />;
});

const mockMutate = jest.fn();
const mockReset = jest.fn();

jest.mock("../../hooks", () => ({
  useAudioTranscription: jest.fn(),
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
  },
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

// Mock expo-audio
const mockAudioRecorder = {
  uri: null,
  prepareToRecordAsync: jest.fn(() => Promise.resolve()),
  record: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
};

const mockRecorderState = {
  isRecording: false,
  metering: 0,
  durationMillis: 0,
};

jest.mock("expo-audio", () => ({
  useAudioRecorder: jest.fn(() => mockAudioRecorder),
  useAudioRecorderState: jest.fn(() => mockRecorderState),
  RecordingPresets: {
    HIGH_QUALITY: {},
  },
  AudioModule: {
    requestRecordingPermissionsAsync: jest.fn(() =>
      Promise.resolve({ granted: true }),
    ),
  },
}));

const mockUseAudioTranscription = useAudioTranscription as jest.Mock;
const mockClipboardSet = Clipboard.setStringAsync as jest.Mock;
const mockDocumentPicker = DocumentPicker.getDocumentAsync as jest.Mock;
const mockToastShow = (Toast as unknown as { show: jest.Mock }).show;
const mockRequestPermissions =
  AudioModule.requestRecordingPermissionsAsync as jest.Mock;

let alertSpy: jest.SpyInstance;

let mockMutationState = {
  data: undefined as string | undefined,
  isPending: false,
};

beforeEach(() => {
  mockMutationState = { data: undefined, isPending: false };
  mockMutate.mockClear();
  mockReset.mockClear();
  mockUseAudioTranscription.mockReturnValue({
    mutate: mockMutate,
    data: mockMutationState.data,
    isPending: mockMutationState.isPending,
    reset: mockReset,
  });
  mockClipboardSet.mockClear();
  mockDocumentPicker.mockClear();
  mockToastShow.mockClear();
  mockRequestPermissions.mockClear();
  mockRequestPermissions.mockResolvedValue({ granted: true });
  mockRecorderState.isRecording = false;
  mockAudioRecorder.uri = null;
  mockAudioRecorder.prepareToRecordAsync.mockClear();
  mockAudioRecorder.record.mockClear();
  mockAudioRecorder.stop.mockClear();
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
});

const renderSoundScreen = () => render(<SoundScreen />);

describe("SoundScreen", () => {
  it("renders the app title", () => {
    const { getByTestId } = renderSoundScreen();
    expect(getByTestId("app-header-title").props.children).toBe("Audio to Text");
  });

  it("renders welcome screen with record and upload buttons", () => {
    const { getByTestId } = renderSoundScreen();
    expect(getByTestId("start-recording-button")).toBeTruthy();
    expect(getByTestId("upload-audio-button")).toBeTruthy();
  });

  it("requests permission and starts recording when record button is pressed", async () => {
    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId("start-recording-button"));
    });

    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(mockAudioRecorder.prepareToRecordAsync).toHaveBeenCalledTimes(1);
    expect(mockAudioRecorder.record).toHaveBeenCalledTimes(1);
  });

  it("shows alert when microphone permission is denied", async () => {
    mockRequestPermissions.mockResolvedValueOnce({ granted: false });
    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId("start-recording-button"));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "Permission Required",
      "Please grant microphone permission to record audio.",
    );
    expect(mockAudioRecorder.record).not.toHaveBeenCalled();
  });

  it("opens document picker when upload audio button is pressed", async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "mock-audio-uri", name: "test-audio.m4a" }],
    });

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-audio-button"));
    });

    expect(mockDocumentPicker).toHaveBeenCalledWith({
      type: "audio/*",
      copyToCacheDirectory: true,
    });
  });

  it("displays audio file name after file upload", async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "mock-audio-uri", name: "test-audio.m4a" }],
    });

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-audio-button"));
    });

    await waitFor(() => {
      expect(getByTestId("audio-file-name").props.children).toBe(
        "test-audio.m4a",
      );
    });
  });

  it("calls mutate when transcribe button is pressed", async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "mock-audio-uri", name: "test-audio.m4a" }],
    });

    const { getByTestId } = renderSoundScreen();

    // Upload audio file
    await act(async () => {
      fireEvent.press(getByTestId("upload-audio-button"));
    });

    // Press transcribe button
    await act(async () => {
      fireEvent.press(getByTestId("transcribe-button"));
    });

    expect(mockMutate).toHaveBeenCalledWith(
      "mock-audio-uri",
      expect.any(Object),
    );
  });

  it("shows loader when isPending is true", async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "mock-audio-uri", name: "test-audio.m4a" }],
    });

    mockUseAudioTranscription.mockReturnValue({
      mutate: mockMutate,
      data: undefined,
      isPending: true,
      reset: mockReset,
    });

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-audio-button"));
    });

    expect(getByTestId("transcribe-loader")).toBeTruthy();
  });

  it("displays transcribed text when available", async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "mock-audio-uri", name: "test-audio.m4a" }],
    });

    mockUseAudioTranscription.mockReturnValue({
      mutate: mockMutate,
      data: "Hello from audio",
      isPending: false,
      reset: mockReset,
    });

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-audio-button"));
    });

    expect(getByTestId("transcribed-text").props.children).toBe(
      "Hello from audio",
    );
  });

  it("copies transcribed text to clipboard and shows toast", async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "mock-audio-uri", name: "test-audio.m4a" }],
    });

    mockUseAudioTranscription.mockReturnValue({
      mutate: mockMutate,
      data: "Copied Audio Text",
      isPending: false,
      reset: mockReset,
    });

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-audio-button"));
    });

    await act(async () => {
      fireEvent.press(getByTestId("copy-button"));
    });

    expect(mockClipboardSet).toHaveBeenCalledWith("Copied Audio Text");
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        text1: "Text copied to clipboard",
      }),
    );
  });

  it("resets state when transcribe another button is pressed", async () => {
    mockDocumentPicker.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "mock-audio-uri", name: "test-audio.m4a" }],
    });

    mockUseAudioTranscription.mockReturnValue({
      mutate: mockMutate,
      data: "Some text",
      isPending: false,
      reset: mockReset,
    });

    const { getByTestId } = renderSoundScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-audio-button"));
    });

    await act(async () => {
      fireEvent.press(getByTestId("transcribe-another-button"));
    });

    expect(mockReset).toHaveBeenCalled();
  });
});
