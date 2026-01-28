import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import PdfScreen from "../PdfScreen";
import { usePdfExtraction } from "../../hooks";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";

jest.mock("../../components/ThemeToggle", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => <View testID="theme-toggle" />;
});

jest.mock("../../components/MarkdownRenderer", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ children, testID }: { children: string; testID?: string }) => (
    <Text testID={testID}>{children}</Text>
  );
});

jest.mock("../../components/OpenaiPassModal", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => <View testID="openai-pass-modal" />;
});

const mockMutate = jest.fn();
const mockReset = jest.fn();

jest.mock("../../hooks", () => ({
  usePdfExtraction: jest.fn(),
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
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

const mockUsePdfExtraction = usePdfExtraction as jest.Mock;
const mockGetDocumentAsync = DocumentPicker.getDocumentAsync as jest.Mock;
const mockClipboardSet = Clipboard.setStringAsync as jest.Mock;
const mockToastShow = (Toast as unknown as { show: jest.Mock }).show;

let alertSpy: jest.SpyInstance;

interface MockMutationState {
  data:
    | { content: string; description: string; requestId: string }
    | undefined;
  isPending: boolean;
}

let mockMutationState: MockMutationState = {
  data: undefined,
  isPending: false,
};

beforeEach(() => {
  mockMutationState = { data: undefined, isPending: false };
  mockMutate.mockClear();
  mockReset.mockClear();
  mockUsePdfExtraction.mockReturnValue({
    mutate: mockMutate,
    data: mockMutationState.data,
    isPending: mockMutationState.isPending,
    reset: mockReset,
  });
  mockGetDocumentAsync.mockClear();
  mockClipboardSet.mockClear();
  mockToastShow.mockClear();
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
});

const renderPdfScreen = () => render(<PdfScreen />);

describe("PdfScreen", () => {
  it("renders the PDF screen title", () => {
    const { getByTestId } = renderPdfScreen();
    expect(getByTestId("app-header-title")).toBeTruthy();
  });

  it("renders upload button when no PDF is selected", () => {
    const { getByTestId } = renderPdfScreen();
    expect(getByTestId("upload-pdf-button")).toBeTruthy();
  });

  it("displays PDF name after document is selected", async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-pdf-uri", name: "test-document.pdf" }],
    });

    const { getByTestId } = renderPdfScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    expect(getByTestId("pdf-name")).toBeTruthy();
    expect(getByTestId("pdf-name").props.children).toBe("test-document.pdf");
  });

  it("shows question input after PDF is selected", async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-pdf-uri", name: "test.pdf" }],
    });

    const { getByTestId } = renderPdfScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    expect(getByTestId("question-input")).toBeTruthy();
  });

  it("shows model dropdown after PDF is selected", async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-pdf-uri", name: "test.pdf" }],
    });

    const { getByTestId } = renderPdfScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    expect(getByTestId("model-dropdown")).toBeTruthy();
  });

  it("allows changing PDF before extraction", async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-pdf-uri", name: "test.pdf" }],
    });

    const { getByTestId } = renderPdfScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    // Should have the "Extract Another" button that allows re-uploading
    const extractAnotherButton = getByTestId("extract-another-upload-button");
    expect(extractAnotherButton).toBeTruthy();

    // Pressing it should trigger document picker
    await act(async () => {
      fireEvent.press(extractAnotherButton);
    });

    expect(mockGetDocumentAsync).toHaveBeenCalledTimes(2);
  });

  it("disables extract button when question is empty", async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-pdf-uri", name: "test.pdf" }],
    });

    const { getByTestId } = renderPdfScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    const extractButton = getByTestId("extract-pdf-button");
    // Material Design Button uses accessibilityState for disabled state
    expect(extractButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("shows loader when isPending is true", async () => {
    mockUsePdfExtraction.mockReturnValue({
      mutate: mockMutate,
      data: undefined,
      isPending: true,
      reset: mockReset,
    });
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-pdf-uri", name: "test.pdf" }],
    });

    const { getByTestId } = renderPdfScreen();

    // First select a PDF to set pdfUri state, which is required for loader to show
    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    expect(getByTestId("extract-loader")).toBeTruthy();
  });

  it("displays extracted text when available", () => {
    mockUsePdfExtraction.mockReturnValue({
      mutate: mockMutate,
      data: {
        content: "Extracted PDF content",
        description: "Test description",
        requestId: "test-request-id",
      },
      isPending: false,
      reset: mockReset,
    });

    const { getByTestId } = renderPdfScreen();

    // When there's data with requestId, the screen shows the extracted content
    expect(getByTestId("extracted-text").props.children).toBe(
      "Extracted PDF content",
    );
  });

  it("copies extracted text to clipboard and shows toast", async () => {
    mockUsePdfExtraction.mockReturnValue({
      mutate: mockMutate,
      data: {
        content: "PDF Text Content",
        description: "Description",
        requestId: "test-id",
      },
      isPending: false,
      reset: mockReset,
    });

    const { getByTestId } = renderPdfScreen();

    // When there's data with requestId, the copy button is available
    await act(async () => {
      fireEvent.press(getByTestId("copy-button"));
    });

    expect(mockClipboardSet).toHaveBeenCalledWith("PDF Text Content");
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        text1: "Text copied to clipboard",
      }),
    );
  });

  it("resets state when Extract Another button is pressed", async () => {
    mockUsePdfExtraction.mockReturnValue({
      mutate: mockMutate,
      data: {
        content: "Some text",
        description: "Desc",
        requestId: "id",
      },
      isPending: false,
      reset: mockReset,
    });

    const { getByTestId } = renderPdfScreen();

    // When there's data with requestId, the extract another button is available
    await act(async () => {
      fireEvent.press(getByTestId("extract-another-button"));
    });

    expect(mockReset).toHaveBeenCalled();
  });

  it("displays description when available", () => {
    mockUsePdfExtraction.mockReturnValue({
      mutate: mockMutate,
      data: {
        content: "PDF content",
        description: "This is a test description",
        requestId: "test-request-id",
      },
      isPending: false,
      reset: mockReset,
    });

    const { getByTestId } = renderPdfScreen();

    // When requestId exists, description should be visible without needing to upload
    expect(getByTestId("description-text")).toBeTruthy();
    expect(getByTestId("description-text").props.children).toBe(
      "This is a test description",
    );
  });

  it("shows follow-up question input when requestId exists", () => {
    mockUsePdfExtraction.mockReturnValue({
      mutate: mockMutate,
      data: {
        content: "PDF content",
        description: "Desc",
        requestId: "test-request-id",
      },
      isPending: false,
      reset: mockReset,
    });

    const { getByTestId } = renderPdfScreen();

    expect(getByTestId("question-input-followup")).toBeTruthy();
    expect(getByTestId("ask-question-button")).toBeTruthy();
  });

  it("displays Upload Fresh PDF button when requestId exists", () => {
    mockUsePdfExtraction.mockReturnValue({
      mutate: mockMutate,
      data: {
        content: "PDF content",
        description: "Desc",
        requestId: "test-request-id",
      },
      isPending: false,
      reset: mockReset,
    });

    const { getByTestId } = renderPdfScreen();

    expect(getByTestId("upload-fresh-pdf-button")).toBeTruthy();
  });

  it("renders ThemeToggle component in header", () => {
    const { getByTestId } = renderPdfScreen();
    expect(getByTestId("theme-toggle")).toBeTruthy();
  });
});
