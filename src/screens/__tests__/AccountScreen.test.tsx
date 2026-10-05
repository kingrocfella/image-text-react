import React from "react";
import { Linking } from "react-native";
import { render, fireEvent, act } from "@testing-library/react-native";
import AccountScreen from "../AccountScreen";
import { useAccount } from "../../hooks";
import { useAppDispatch, useAppSelector } from "../../store";
import { deleteAccount, logout } from "../../store/slices/authSlice";
import { LEGAL_URLS } from "../../constants";

jest.mock("../../components/AppHeader", () => () => null);
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock("../../auth/googleSignIn", () => ({
  getGoogleIdToken: jest.fn(() => Promise.resolve("fresh-google-token")),
}));
jest.mock("../../auth/appleSignIn", () => ({
  signInWithAppleNative: jest.fn(),
}));
jest.mock("../../hooks", () => ({ useAccount: jest.fn() }));
jest.mock("react-native-paper", () => require("../../testing/paperMock"));
jest.mock("../../store", () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));
jest.mock("../../store/slices/authSlice", () => ({
  logout: jest.fn(() => ({ type: "auth/logout" })),
  deleteAccount: Object.assign(
    jest.fn((password: string) => ({ type: "auth/deleteAccount", password })),
    { rejected: { match: jest.fn() } },
  ),
}));

const mockDispatch = jest.fn();
const mockRejectedMatch = deleteAccount.rejected.match as unknown as jest.Mock;

const ACCOUNT = {
  user_id: "u1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  login_methods: ["password"],
  pro: false,
  pro_source: null,
  pro_product_id: null,
  pro_expires_at: null,
  purchases_available: true,
  models: ["ollama"],
  pro_models: ["openai"],
  pro_limits: {},
  usage: {
    image: { used: 3, limit: 300 },
    pdf: { used: 200, limit: 200 },
    cloud_model: { used: 0, limit: 0 },
  },
};

const renderScreen = () =>
  render(<AccountScreen />);

beforeEach(() => {
  jest.clearAllMocks();
  (useAppDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
  (useAppSelector as unknown as jest.Mock).mockImplementation((selector) =>
    selector({ auth: { user: { name: "Ada", email: "ada@example.com" } } }),
  );
  (useAccount as jest.Mock).mockReturnValue({
    data: ACCOUNT,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
});

it("shows who is signed in and this month\'s usage from the server", async () => {
  const { getByTestId, queryByTestId } = await renderScreen();

  expect(getByTestId("account-name").props.children).toBe("Ada Lovelace");
  expect(getByTestId("account-email").props.children).toBe("ada@example.com");
  expect(getByTestId("usage-image")).toHaveTextContent(/3 of 300/);
  expect(getByTestId("usage-pdf")).toHaveTextContent(/200 of 200/);
  // An allowance of zero means the feature is off, not "0 of 0".
  expect(getByTestId("usage-cloud_model")).toHaveTextContent(/Not available/);
  expect(queryByTestId("usage-sound")).toBeNull();
});

it("offers a retry when usage cannot be loaded", async () => {
  const refetch = jest.fn();
  (useAccount as jest.Mock).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
    refetch,
  });
  const { getByTestId } = await renderScreen();

  await fireEvent.press(getByTestId("usage-retry"));

  expect(refetch).toHaveBeenCalled();
});

it("links to the privacy policy and support, and signs out", async () => {
  const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  const { getByTestId } = await renderScreen();

  await fireEvent.press(getByTestId("account-privacy-link"));
  await fireEvent.press(getByTestId("account-support-link"));
  await fireEvent.press(getByTestId("account-logout-button"));

  expect(openURL).toHaveBeenCalledWith(LEGAL_URLS.privacy);
  expect(openURL).toHaveBeenCalledWith(LEGAL_URLS.support);
  expect(logout).toHaveBeenCalled();
});

describe("deleting the account", () => {
  it("does nothing until a password is entered", async () => {
    const { getByTestId } = await renderScreen();
    await fireEvent.press(getByTestId("delete-account-button"));

    await act(async () => {
      await fireEvent.press(getByTestId("delete-account-confirm"));
    });

    expect(deleteAccount).not.toHaveBeenCalled();
    expect(getByTestId("delete-account-error")).toHaveTextContent(/Enter your password/);
  });

  it("sends the password, and shows the server\'s refusal", async () => {
    mockDispatch.mockResolvedValue({ payload: "That password is not correct." });
    mockRejectedMatch.mockReturnValue(true);
    const { getByTestId } = await renderScreen();
    await fireEvent.press(getByTestId("delete-account-button"));
    await fireEvent.changeText(getByTestId("delete-account-password"), "wrong-password");

    await act(async () => {
      await fireEvent.press(getByTestId("delete-account-confirm"));
    });

    expect(deleteAccount).toHaveBeenCalledWith({ password: "wrong-password" });
    expect(getByTestId("delete-account-error")).toHaveTextContent(
      /That password is not correct/,
    );
  });

  it("can be cancelled without deleting anything", async () => {
    const { getByTestId } = await renderScreen();
    await fireEvent.press(getByTestId("delete-account-button"));
    await fireEvent.changeText(getByTestId("delete-account-password"), "password123");

    await fireEvent.press(getByTestId("delete-account-cancel"));

    expect(deleteAccount).not.toHaveBeenCalled();
  });
});

describe("the plan", () => {
  it("offers the upgrade to a free account", async () => {
    const { getByTestId } = await renderScreen();

    expect(getByTestId("plan-card")).toHaveTextContent(/Free plan/);
    await fireEvent.press(getByTestId("plan-button"));

    expect(mockNavigate).toHaveBeenCalledWith("Paywall");
  });

  it("shows a subscriber what they have, and warns before deletion", async () => {
    (useAccount as jest.Mock).mockReturnValue({
      data: {
        ...ACCOUNT,
        pro: true,
        pro_source: "subscription",
        pro_expires_at: "2026-11-05T00:00:00Z",
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const { getByTestId } = await renderScreen();

    expect(getByTestId("plan-card")).toHaveTextContent(/ScanGenAI Pro/);
    await fireEvent.press(getByTestId("delete-account-button"));
    expect(getByTestId("delete-subscription-warning")).toHaveTextContent(
      /does not cancel your subscription/,
    );
  });
});

it("an account with no password confirms deletion with a fresh provider sign-in", async () => {
  (useAccount as jest.Mock).mockReturnValue({
    data: { ...ACCOUNT, login_methods: ["google"] },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  });
  mockDispatch.mockResolvedValue({});
  mockRejectedMatch.mockReturnValue(false);
  const { getByTestId, queryByTestId } = await renderScreen();
  await fireEvent.press(getByTestId("delete-account-button"));

  expect(queryByTestId("delete-account-password")).toBeNull();
  await act(async () => {
    await fireEvent.press(getByTestId("delete-account-confirm"));
  });

  expect(deleteAccount).toHaveBeenCalledWith({
    google_id_token: "fresh-google-token",
  });
});
