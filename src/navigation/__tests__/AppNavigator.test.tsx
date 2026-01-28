import { render } from "@testing-library/react-native";
import AppNavigator from "../AppNavigator";
import { useAppSelector } from "../../store";

// Mock store
jest.mock("../../store", () => ({
  useAppSelector: jest.fn(),
}));

// Mock react-navigation
jest.mock("@react-navigation/native", () => {
  const actualNav = jest.requireActual("@react-navigation/native");
  const React = require("react");
  const { View } = require("react-native");
  return {
    ...actualNav,
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { testID: "navigation-container" }, children),
  };
});

jest.mock("@react-navigation/native-stack", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        React.createElement(View, { testID: "stack-navigator" }, children),
      Screen: ({
        name,
        component: Component,
      }: {
        name: string;
        component: React.ComponentType;
      }) =>
        React.createElement(
          View,
          { testID: `stack-screen-${name}` },
          React.createElement(Component),
        ),
    }),
  };
});

jest.mock("@react-navigation/bottom-tabs", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    createBottomTabNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        React.createElement(View, { testID: "tab-navigator" }, children),
      Screen: ({
        name,
        component: Component,
      }: {
        name: string;
        component: React.ComponentType;
      }) =>
        React.createElement(
          View,
          { testID: `tab-screen-${name}` },
          React.createElement(Component),
        ),
    }),
  };
});

// Mock screens
jest.mock("../../screens/LoginScreen", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return function MockLoginScreen() {
    return React.createElement(
      View,
      { testID: "login-screen" },
      React.createElement(Text, null, "Login Screen"),
    );
  };
});

jest.mock("../../screens/RegisterScreen", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return function MockRegisterScreen() {
    return React.createElement(
      View,
      { testID: "register-screen" },
      React.createElement(Text, null, "Register Screen"),
    );
  };
});

jest.mock("../../screens/HomeScreen", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return function MockHomeScreen() {
    return React.createElement(
      View,
      { testID: "home-screen" },
      React.createElement(Text, null, "Home Screen"),
    );
  };
});

jest.mock("../../screens/PdfScreen", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return function MockPdfScreen() {
    return React.createElement(
      View,
      { testID: "pdf-screen" },
      React.createElement(Text, null, "PDF Screen"),
    );
  };
});

jest.mock("../../screens/SoundScreen", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return function MockSoundScreen() {
    return React.createElement(
      View,
      { testID: "sound-screen" },
      React.createElement(Text, null, "Sound Screen"),
    );
  };
});

// Mock react-native-paper
jest.mock("react-native-paper", () => ({
  useTheme: () => ({
    dark: false,
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
}));

// Mock expo vector icons
jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

const mockUseAppSelector = useAppSelector as jest.Mock;

describe("AppNavigator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when user is not authenticated", () => {
    beforeEach(() => {
      mockUseAppSelector.mockImplementation((selector) =>
        selector({ auth: { isAuthenticated: false } }),
      );
    });

    it("renders login screen", () => {
      const { getByTestId } = render(<AppNavigator />);
      expect(getByTestId("login-screen")).toBeTruthy();
    });

    it("renders register screen", () => {
      const { getByTestId } = render(<AppNavigator />);
      expect(getByTestId("register-screen")).toBeTruthy();
    });

    it("does not render home screen", () => {
      const { queryByTestId } = render(<AppNavigator />);
      expect(queryByTestId("home-screen")).toBeNull();
    });

    it("renders navigation container", () => {
      const { getByTestId } = render(<AppNavigator />);
      expect(getByTestId("navigation-container")).toBeTruthy();
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockUseAppSelector.mockImplementation((selector) =>
        selector({ auth: { isAuthenticated: true } }),
      );
    });

    it("renders home screen (main tabs)", () => {
      const { getByTestId } = render(<AppNavigator />);
      expect(getByTestId("home-screen")).toBeTruthy();
    });

    it("renders PDF screen in tabs", () => {
      const { getByTestId } = render(<AppNavigator />);
      expect(getByTestId("pdf-screen")).toBeTruthy();
    });

    it("renders Sound screen in tabs", () => {
      const { getByTestId } = render(<AppNavigator />);
      expect(getByTestId("sound-screen")).toBeTruthy();
    });

    it("does not render login screen", () => {
      const { queryByTestId } = render(<AppNavigator />);
      expect(queryByTestId("login-screen")).toBeNull();
    });

    it("does not render register screen", () => {
      const { queryByTestId } = render(<AppNavigator />);
      expect(queryByTestId("register-screen")).toBeNull();
    });
  });

  describe("authentication state changes", () => {
    it("switches from login to home on authentication", () => {
      // Start unauthenticated
      mockUseAppSelector.mockImplementation((selector) =>
        selector({ auth: { isAuthenticated: false } }),
      );

      const { getByTestId, queryByTestId, rerender } = render(<AppNavigator />);
      expect(getByTestId("login-screen")).toBeTruthy();
      expect(queryByTestId("home-screen")).toBeNull();

      // Become authenticated
      mockUseAppSelector.mockImplementation((selector) =>
        selector({ auth: { isAuthenticated: true } }),
      );

      rerender(<AppNavigator />);
      expect(queryByTestId("login-screen")).toBeNull();
      expect(getByTestId("home-screen")).toBeTruthy();
    });

    it("switches from home to login on logout", () => {
      // Start authenticated
      mockUseAppSelector.mockImplementation((selector) =>
        selector({ auth: { isAuthenticated: true } }),
      );

      const { getByTestId, queryByTestId, rerender } = render(<AppNavigator />);
      expect(getByTestId("home-screen")).toBeTruthy();

      // Logout
      mockUseAppSelector.mockImplementation((selector) =>
        selector({ auth: { isAuthenticated: false } }),
      );

      rerender(<AppNavigator />);
      expect(getByTestId("login-screen")).toBeTruthy();
      expect(queryByTestId("home-screen")).toBeNull();
    });
  });
});
