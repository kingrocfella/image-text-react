import React from "react";
import { Platform } from "react-native";
import { render, fireEvent, act } from "@testing-library/react-native";
import * as AppleAuthentication from "expo-apple-authentication";

jest.mock("react-native-paper", () => require("../../testing/paperMock"));
jest.mock("../AppleSignInButton", () => {
  const React = require("react");
  const { TouchableOpacity } = require("react-native");
  return {
    AppleSignInButton: ({ onPress }: { onPress: () => void }) =>
      React.createElement(TouchableOpacity, {
        onPress,
        testID: "apple-sign-in-button",
      }),
  };
});
const mockDispatch = jest.fn(() => Promise.resolve({}));
jest.mock("../../store", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { loading: false } }),
}));
jest.mock("../../store/slices/authSlice", () => ({
  socialLogin: Object.assign(
    jest.fn((credential: unknown) => ({ type: "auth/socialLogin", credential })),
    { rejected: { match: jest.fn(() => false) } },
  ),
}));
const mockConstants = { GOOGLE_SIGN_IN_ENABLED: true };
jest.mock("../../constants", () => ({
  get GOOGLE_SIGN_IN_ENABLED() {
    return mockConstants.GOOGLE_SIGN_IN_ENABLED;
  },
  GOOGLE_WEB_CLIENT_ID: "web-client",
  MOBILE_LOGGING: { level: "info" },
}));
jest.mock("../../auth/googleSignIn", () => ({
  getGoogleIdToken: jest.fn(() => Promise.resolve("google-id-token")),
  isGoogleSignInCancelledError: jest.fn(() => false),
}));

import SocialSignIn from "../SocialSignIn";
import { socialLogin } from "../../store/slices/authSlice";

const setPlatform = (os: "ios" | "android") =>
  Object.defineProperty(Platform, "OS", { get: () => os, configurable: true });

beforeEach(() => {
  jest.clearAllMocks();
  mockConstants.GOOGLE_SIGN_IN_ENABLED = true;
  (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValue(true);
});
afterAll(() => setPlatform("ios"));

it("Android shows Google and never Apple", async () => {
  setPlatform("android");
  const screen = await render(<SocialSignIn mode="sign-in" />);
  await act(async () => {});

  expect(screen.getByTestId("google-sign-in-button")).toBeTruthy();
  expect(screen.queryByTestId("apple-sign-in-button")).toBeNull();

  await act(async () => {
    await fireEvent.press(screen.getByTestId("google-sign-in-button"));
  });
  expect(socialLogin).toHaveBeenCalledWith({
    provider: "google",
    idToken: "google-id-token",
  });
});

it("iOS shows Apple and never Google, and passes on the name Apple gives once", async () => {
  setPlatform("ios");
  (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
    identityToken: "apple-identity-token",
    fullName: { givenName: "Ada", familyName: "Lovelace" },
  });
  const screen = await render(<SocialSignIn mode="sign-up" />);
  await act(async () => {});

  expect(screen.queryByTestId("google-sign-in-button")).toBeNull();
  await act(async () => {
    await fireEvent.press(screen.getByTestId("apple-sign-in-button"));
  });

  expect(socialLogin).toHaveBeenCalledWith({
    provider: "apple",
    identityToken: "apple-identity-token",
    name: "Ada Lovelace",
  });
});

it("renders nothing where no provider is configured", async () => {
  setPlatform("android");
  mockConstants.GOOGLE_SIGN_IN_ENABLED = false;
  const screen = await render(<SocialSignIn mode="sign-in" />);
  await act(async () => {});

  expect(screen.queryByTestId("social-sign-in")).toBeNull();
});
