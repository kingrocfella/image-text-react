import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import PdfScreen from "../PdfScreen";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  extractPdfText,
  clearExtractedPdfText,
  askPdfQuestion,
} from "../../store/actions/pdfActions";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";

jest.mock("../../store", () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock("../../store/actions/pdfActions", () => ({
  extractPdfText: jest.fn(),
  clearExtractedPdfText: jest.fn(() => ({ type: "CLEAR_EXTRACTED_PDF_TEXT" })),
  askPdfQuestion: jest.fn(),
}));

jest.mock("../../components/ThemeToggle", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => <View testID="theme-toggle" />;
});

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

jest.mock("react-native-paper", () => {
  const React = require("react");
  const {
    View,
    Text,
    TextInput,
    Button,
    TouchableOpacity,
  } = require("react-native");
  return {
    Text: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
    Button: ({ children, onPress, ...props }: any) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    TextInput: Object.assign(
      ({ onChangeText, value, right, left, ...props }: any) => {
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
                <TouchableOpacity
                  onPress={RightIcon.props?.onPress}
                  testID="toggle-password-visibility"
                >
                  <Text>RightIcon</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      },
      {
        Icon: ({ onPress, icon, ...props }: any) => (
          <TouchableOpacity onPress={onPress} {...props}>
            <Text>{icon}</Text>
          </TouchableOpacity>
        ),
      }
    ),
    Card: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    Surface: ({ children, ...props }: any) => (
      <View {...props}>{children}</View>
    ),
    IconButton: ({ onPress, ...props }: any) => (
      <TouchableOpacity onPress={onPress} {...props}>
        <Text>Icon</Text>
      </TouchableOpacity>
    ),
    ActivityIndicator: ({ testID, ...props }: any) => (
      <View testID={testID || "activity-indicator"} {...props} />
    ),
    Portal: ({ children }: any) => <View>{children}</View>,
    Dialog: Object.assign(
      ({ visible, children, onDismiss, ...props }: any) => {
        if (!visible) return null;
        return (
          <View testID="dialog" {...props}>
            {children}
          </View>
        );
      },
      {
        Title: ({ children, ...props }: any) => (
          <View testID="dialog-title" {...props}>
            <Text>{children}</Text>
          </View>
        ),
        Content: ({ children, ...props }: any) => (
          <View testID="dialog-content" {...props}>
            {children}
          </View>
        ),
        Actions: ({ children, ...props }: any) => (
          <View testID="dialog-actions" {...props}>
            {children}
          </View>
        ),
      }
    ),
    Menu: Object.assign(
      ({ visible, onDismiss, anchor, children, ...props }: any) => {
        // Store menu items in a way that's accessible for testing
        const menuItems = React.Children.toArray(children);
        const AnchorComponent = React.cloneElement(anchor, {
          onPress: anchor.props.onPress,
        });
        return (
          <View testID="menu-container">
            {AnchorComponent}
            {visible && (
              <View testID="menu-items-container">
                {menuItems.map((child: any, index: number) =>
                  React.cloneElement(child, {
                    key: index,
                    onPress: () => {
                      if (child.props.onPress) {
                        child.props.onPress();
                      }
                      if (onDismiss) {
                        onDismiss();
                      }
                    },
                  })
                )}
              </View>
            )}
          </View>
        );
      },
      {
        Item: ({ onPress, title, testID, ...props }: any) => (
          <TouchableOpacity onPress={onPress} testID={testID} {...props}>
            <Text>{title}</Text>
          </TouchableOpacity>
        ),
      }
    ),
    useTheme: () => ({
      colors: {
        primary: "#374151",
        background: "#ffffff",
        surface: "#ffffff",
        onSurface: "#111827",
        onSurfaceVariant: "#6b7280",
        outline: "#e5e7eb",
        error: "#dc2626",
      },
    }),
  };
});

const mockDispatch = jest.fn();
const mockUseAppDispatch = useAppDispatch as jest.Mock;
const mockUseAppSelector = useAppSelector as jest.Mock;
const mockExtractPdfText = extractPdfText as jest.Mock;
const mockClearExtractedPdfText = clearExtractedPdfText as jest.Mock;
const mockAskPdfQuestion = askPdfQuestion as jest.Mock;
const mockGetDocumentAsync = DocumentPicker.getDocumentAsync as jest.Mock;
const mockClipboardSet = Clipboard.setStringAsync as jest.Mock;
const mockToastShow = (Toast as unknown as { show: jest.Mock }).show;

let alertSpy: jest.SpyInstance;

const createState = (overrides?: Partial<{ auth: any; pdf: any }>) => ({
  auth: {
    accessToken: "mock-access-token",
    tokenType: "Bearer",
    ...(overrides?.auth || {}),
  },
  pdf: {
    extractedText: null,
    description: null,
    requestId: null,
    extracting: false,
    error: null,
    ...(overrides?.pdf || {}),
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
  mockAskPdfQuestion.mockReset();
  mockAskPdfQuestion.mockImplementation(() => jest.fn());
  mockClearExtractedPdfText.mockClear();
  mockClearExtractedPdfText.mockReturnValue({
    type: "CLEAR_EXTRACTED_PDF_TEXT",
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

  it("shows Extract Another button when PDF is uploaded but not extracted", async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-pdf-uri", name: "test.pdf" }],
    });

    const { getByTestId } = renderPdfScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    expect(getByTestId("extract-another-upload-button")).toBeTruthy();
  });

  it("allows changing PDF file when Extract Another button is pressed before extraction", async () => {
    mockGetDocumentAsync
      .mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: "mock-pdf-uri-1", name: "test1.pdf" }],
      })
      .mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: "mock-pdf-uri-2", name: "test2.pdf" }],
      });

    const { getByTestId } = renderPdfScreen();

    // Upload first PDF
    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    expect(getByTestId("pdf-name").props.children).toBe("test1.pdf");

    // Press Extract Another button to change PDF
    await act(async () => {
      fireEvent.press(getByTestId("extract-another-upload-button"));
    });

    // Should show the new PDF name
    expect(getByTestId("pdf-name").props.children).toBe("test2.pdf");
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

  it("dispatches extractPdfText when extract button is pressed with valid inputs", async () => {
    const extractThunk = jest.fn();
    mockExtractPdfText.mockReturnValue(extractThunk);
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-pdf-uri", name: "test.pdf" }],
    });

    const { getByTestId } = renderPdfScreen();

    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    // Select a model - the Menu mock renders items when visible
    // We need to trigger the menu to open first, then select an option
    const modelDropdown = getByTestId("model-dropdown");
    await act(async () => {
      fireEvent.press(modelDropdown);
    });

    // Select a model that doesn't require OpenAI pass (e.g., ollama)
    await act(async () => {
      const ollamaOption = getByTestId("model-option-ollama");
      fireEvent.press(ollamaOption);
    });

    const questionInput = getByTestId("question-input");
    fireEvent.changeText(questionInput, "What is this document about?");

    await act(async () => {
      fireEvent.press(getByTestId("extract-pdf-button"));
    });

    expect(mockExtractPdfText).toHaveBeenCalledWith(
      "mock-pdf-uri",
      "test.pdf",
      "What is this document about?",
      "ollama",
      undefined,
      "mock-access-token",
      "Bearer"
    );
    expect(mockDispatch).toHaveBeenCalledWith(extractThunk);
  });

  it("shows loader when extracting is true", async () => {
    currentState = createState({ pdf: { extracting: true } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );
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

  it("displays extracted text when available and hides extract button", async () => {
    currentState = createState({
      pdf: { extractedText: "Extracted PDF content" },
    });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-pdf-uri", name: "test.pdf" }],
    });

    const { getByTestId } = renderPdfScreen();

    // First select a PDF to set pdfUri state
    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    // Now extracted text should be visible
    expect(getByTestId("extracted-text")).toBeTruthy();
    expect(getByTestId("extracted-text").props.children).toBe(
      "Extracted PDF content"
    );
  });

  it("copies extracted text to clipboard and shows toast", async () => {
    currentState = createState({ pdf: { extractedText: "PDF Text Content" } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-pdf-uri", name: "test.pdf" }],
    });

    const { getByTestId } = renderPdfScreen();

    // First select a PDF to set pdfUri state
    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    await act(async () => {
      fireEvent.press(getByTestId("copy-button"));
    });

    expect(mockClipboardSet).toHaveBeenCalledWith("PDF Text Content");
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        text1: "Text copied to clipboard",
      })
    );
  });

  it("resets state when Extract Another button is pressed", async () => {
    currentState = createState({ pdf: { extractedText: "Some text" } });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "mock-pdf-uri", name: "test.pdf" }],
    });

    const { getByTestId } = renderPdfScreen();

    // First select a PDF to set pdfUri state
    await act(async () => {
      fireEvent.press(getByTestId("upload-pdf-button"));
    });

    await act(async () => {
      fireEvent.press(getByTestId("extract-another-button"));
    });

    expect(mockClearExtractedPdfText).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "CLEAR_EXTRACTED_PDF_TEXT",
    });
  });

  it("displays description when available", () => {
    currentState = createState({
      pdf: {
        extractedText: "PDF content",
        description: "This is a test description",
        requestId: "test-request-id",
      },
    });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );

    const { getByTestId } = renderPdfScreen();

    // When requestId exists, description should be visible without needing to upload
    expect(getByTestId("description-text")).toBeTruthy();
    expect(getByTestId("description-text").props.children).toBe(
      "This is a test description"
    );
  });

  it("shows follow-up question input when requestId exists", async () => {
    currentState = createState({
      pdf: {
        extractedText: "PDF content",
        requestId: "test-request-id",
      },
    });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );

    const { getByTestId } = renderPdfScreen();

    expect(getByTestId("question-input-followup")).toBeTruthy();
    expect(getByTestId("ask-question-button")).toBeTruthy();
  });

  it("dispatches askPdfQuestion when follow-up question is submitted", async () => {
    const askQuestionThunk = jest.fn();
    mockAskPdfQuestion.mockReturnValue(askQuestionThunk);
    currentState = createState({
      pdf: {
        extractedText: "PDF content",
        requestId: "test-request-id",
      },
    });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );

    const { getByTestId } = renderPdfScreen();

    // Select model
    const modelDropdown = getByTestId("model-dropdown-followup");
    await act(async () => {
      fireEvent.press(modelDropdown);
    });

    // Select a model that doesn't require OpenAI pass (e.g., ollama)
    await act(async () => {
      const ollamaOption = getByTestId("model-option-followup-ollama");
      fireEvent.press(ollamaOption);
    });

    // Enter question
    const questionInput = getByTestId("question-input-followup");
    fireEvent.changeText(questionInput, "What is the main topic?");

    // Submit question
    await act(async () => {
      fireEvent.press(getByTestId("ask-question-button"));
    });

    expect(mockAskPdfQuestion).toHaveBeenCalledWith(
      "test-request-id",
      "What is the main topic?",
      "ollama",
      undefined,
      "mock-access-token",
      "Bearer"
    );
    expect(mockDispatch).toHaveBeenCalledWith(askQuestionThunk);
  });

  it("displays Upload Fresh PDF button when requestId exists", async () => {
    currentState = createState({
      pdf: {
        extractedText: "PDF content",
        requestId: "test-request-id",
      },
    });
    mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
      selector(currentState)
    );

    const { getByTestId } = renderPdfScreen();

    expect(getByTestId("upload-fresh-pdf-button")).toBeTruthy();
  });

  it("renders ThemeToggle component in header", () => {
    const { getByTestId } = renderPdfScreen();
    expect(getByTestId("theme-toggle")).toBeTruthy();
  });
});
