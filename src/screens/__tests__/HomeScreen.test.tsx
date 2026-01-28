import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import HomeScreen from "../HomeScreen";
import { useAppDispatch, useAppSelector } from "../../store";
import { logout } from "../../store/slices/authSlice";
import { useImageExtraction } from "../../hooks";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";

jest.mock("../../store", () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock("../../components/ThemeToggle", () => {
  const React = require("react");
  const { View } = require("react-native");
  return () => <View testID="theme-toggle" />;
});

jest.mock("../../components/ImagePickerComponent", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return ({ onImageSelected }: { onImageSelected: (uri: string) => void }) => (
    <Text
      testID="mock-image-picker"
      onPress={() => onImageSelected("mock-image-uri")}
      accessibilityRole="button"
    >
      Select Image
    </Text>
  );
});

jest.mock("../../store/slices/authSlice", () => ({
  logout: Object.assign(jest.fn(() => ({ type: "auth/logout/pending" })), {
    fulfilled: { match: jest.fn(() => false) },
    rejected: { match: jest.fn(() => false) },
  }),
}));

const mockMutate = jest.fn();
const mockReset = jest.fn();

jest.mock("../../hooks", () => ({
  useImageExtraction: jest.fn(),
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

const mockDispatch = jest.fn();
const mockUseAppDispatch = useAppDispatch as jest.Mock;
const mockUseAppSelector = useAppSelector as jest.Mock;
const mockUseImageExtraction = useImageExtraction as jest.Mock;
const mockLogout = logout as unknown as jest.Mock;
const mockClipboardSet = Clipboard.setStringAsync as jest.Mock;
const mockToastShow = (Toast as unknown as { show: jest.Mock }).show;

let alertSpy: jest.SpyInstance;

const createState = (overrides?: Partial<{ auth: any; theme: any }>) => ({
  auth: {
    user: { id: "1", name: "John Doe", email: "john@example.com" },
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    tokenType: "Bearer",
    isAuthenticated: true,
    loading: false,
    error: null,
    ...(overrides?.auth || {}),
  },
  theme: {
    mode: "system",
    ...(overrides?.theme || {}),
  },
});

let currentState = createState();
let mockMutationState = {
  data: undefined as string | undefined,
  isPending: false,
};

beforeEach(() => {
  currentState = createState();
  mockMutationState = { data: undefined, isPending: false };
  mockDispatch.mockReset();
  mockDispatch.mockImplementation(() => Promise.resolve());
  mockUseAppDispatch.mockReturnValue(mockDispatch);
  mockUseAppSelector.mockImplementation((selector: (state: any) => any) =>
    selector(currentState),
  );
  mockMutate.mockClear();
  mockReset.mockClear();
  mockUseImageExtraction.mockReturnValue({
    mutate: mockMutate,
    data: mockMutationState.data,
    isPending: mockMutationState.isPending,
    reset: mockReset,
  });
  mockLogout.mockClear();
  mockLogout.mockReturnValue({ type: "auth/logout/pending" });
  mockClipboardSet.mockClear();
  mockToastShow.mockClear();
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => {
  alertSpy.mockRestore();
});

const renderHomeScreen = () => render(<HomeScreen />);

describe("HomeScreen", () => {
  it("renders the app title", () => {
    const { getByTestId } = renderHomeScreen();
    expect(getByTestId("app-header-title").props.children).toBe("Image to Text");
  });

  it("displays welcome message when user exists", () => {
    const { getByTestId } = renderHomeScreen();
    expect(getByTestId("app-header-subtitle").props.children).toContain(
      "John Doe",
    );
  });

  it("renders image picker when no image is selected", () => {
    const { getByTestId } = renderHomeScreen();
    expect(getByTestId("mock-image-picker")).toBeTruthy();
  });

  it("calls reset when an image is selected", () => {
    const { getByTestId } = renderHomeScreen();
    fireEvent.press(getByTestId("mock-image-picker"));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it("shows extract button after image selection", () => {
    const { getByTestId, getByText } = renderHomeScreen();
    fireEvent.press(getByTestId("mock-image-picker"));
    expect(getByText("Extract Text from Picture")).toBeTruthy();
  });

  it("calls mutate when extract button is pressed", async () => {
    const { getByTestId, getByText } = renderHomeScreen();
    fireEvent.press(getByTestId("mock-image-picker"));

    await act(async () => {
      fireEvent.press(getByText("Extract Text from Picture"));
    });

    expect(mockMutate).toHaveBeenCalledWith("mock-image-uri", expect.any(Object));
  });

  it("shows loader when isPending is true", () => {
    mockMutationState.isPending = true;
    mockUseImageExtraction.mockReturnValue({
      mutate: mockMutate,
      data: undefined,
      isPending: true,
      reset: mockReset,
    });
    const { getByTestId } = renderHomeScreen();
    fireEvent.press(getByTestId("mock-image-picker"));
    expect(getByTestId("extract-loader")).toBeTruthy();
  });

  it("displays extracted text when available and hides extract button", () => {
    mockUseImageExtraction.mockReturnValue({
      mutate: mockMutate,
      data: "Hello World",
      isPending: false,
      reset: mockReset,
    });
    const { getByTestId, queryByText } = renderHomeScreen();
    fireEvent.press(getByTestId("mock-image-picker"));
    expect(getByTestId("extracted-text").props.children).toBe("Hello World");
    expect(queryByText("Extract Text from Picture")).toBeNull();
  });

  it("copies extracted text to clipboard and shows toast", async () => {
    mockUseImageExtraction.mockReturnValue({
      mutate: mockMutate,
      data: "Copied Text",
      isPending: false,
      reset: mockReset,
    });
    const { getByTestId } = renderHomeScreen();
    fireEvent.press(getByTestId("mock-image-picker"));

    await act(async () => {
      fireEvent.press(getByTestId("copy-button"));
    });

    expect(mockClipboardSet).toHaveBeenCalledWith("Copied Text");
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
        text1: "Text copied to clipboard",
      }),
    );
  });

  it("dispatches logout action when logout button is pressed", () => {
    const { getByTestId } = renderHomeScreen();
    fireEvent.press(getByTestId("logout-button"));
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "auth/logout/pending" });
  });
});
