import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import ForgotPasswordScreen from "../ForgotPasswordScreen";
import { useAppDispatch } from "../../store";
import { forgotPassword } from "../../store/slices/authSlice";

jest.mock("../../components/AppLogo", () => () => null);
jest.mock("react-native-paper", () => require("../../testing/paperMock"));
jest.mock("../../store", () => ({ useAppDispatch: jest.fn() }));
jest.mock("../../store/slices/authSlice", () => ({
  forgotPassword: Object.assign(
    jest.fn((email: string) => ({ type: "auth/forgotPassword", email })),
    { fulfilled: { match: jest.fn() } },
  ),
}));

const mockDispatch = jest.fn();
const mockFulfilledMatch = forgotPassword.fulfilled.match as unknown as jest.Mock;
const navigation = { navigate: jest.fn() } as any;

const renderScreen = (email?: string) =>
  render(
    <ForgotPasswordScreen
      navigation={navigation}
      route={{ key: "k", name: "ForgotPassword", params: email ? { email } : undefined } as any}
    />,
  );

beforeEach(() => {
  jest.clearAllMocks();
  (useAppDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch);
});

it("starts with the email typed on the login screen", async () => {
  const { getByTestId } = await renderScreen("ada@example.com");
  expect(getByTestId("forgot-email-input").props.value).toBe("ada@example.com");
});

it("refuses an invalid email without calling the server", async () => {
  const { getByTestId } = await renderScreen();
  await fireEvent.changeText(getByTestId("forgot-email-input"), "not-an-email");

  await act(async () => {
    await fireEvent.press(getByTestId("forgot-submit-button"));
  });

  expect(forgotPassword).not.toHaveBeenCalled();
});

it("shows the server\'s (deliberately non-committal) confirmation", async () => {
  mockDispatch.mockResolvedValue({
    payload: "If that address has an account, a password reset email is on its way.",
  });
  mockFulfilledMatch.mockReturnValue(true);
  const { getByTestId } = await renderScreen("ada@example.com");

  await act(async () => {
    await fireEvent.press(getByTestId("forgot-submit-button"));
  });

  expect(forgotPassword).toHaveBeenCalledWith("ada@example.com");
  expect(getByTestId("forgot-notice")).toHaveTextContent(/on its way/);
});

it("shows a failure such as a rate limit", async () => {
  mockDispatch.mockResolvedValue({ payload: "Too many requests. Please try again later." });
  mockFulfilledMatch.mockReturnValue(false);
  const { getByTestId } = await renderScreen("ada@example.com");

  await act(async () => {
    await fireEvent.press(getByTestId("forgot-submit-button"));
  });

  expect(getByTestId("forgot-failure")).toHaveTextContent(/Too many requests/);
});
