import React, { useEffect } from "react";
import { Alert, Linking, Platform, StyleSheet, View } from "react-native";
import { ErrorBoundary } from "react-error-boundary";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Button,
  PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
  Text,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import { useColorScheme } from "react-native";
import { store, useAppDispatch, useAppSelector } from "./src/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { loadThemeModeFromStorage } from "./src/store/slices/themeSlice";
import { restoreSession } from "./src/store/slices/authSlice";
import { setUpdateRequiredHandler } from "./src/api/http";
import { STORE_URLS } from "./src/constants";
import { createMobileLogger } from "./src/logging/logger";
import { startRemoteMobileLogging } from "./src/logging/remote";
import { BillingBootstrap } from "./src/billing/BillingBootstrap";

const logger = createMobileLogger("app");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      // A retried mutation would upload the same file twice.
      retry: false,
    },
  },
});

const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#374151",
    primaryContainer: "#f3f4f6",
    secondary: "#6b7280",
    secondaryContainer: "#f9fafb",
    tertiary: "#1f2937",
    surface: "#ffffff",
    surfaceVariant: "#ffffff",
    background: "#fafafa",
    error: "#dc2626",
    errorContainer: "#fee2e2",
    onPrimary: "#ffffff",
    onSecondary: "#ffffff",
    onSurface: "#111827",
    onBackground: "#111827",
    outline: "#e5e7eb",
  },
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#e5e7eb",
    primaryContainer: "#374151",
    secondary: "#9ca3af",
    secondaryContainer: "#1f2937",
    tertiary: "#1f2937",
    surface: "#1f2937",
    surfaceVariant: "#111827",
    background: "#0f172a",
    error: "#ef4444",
    errorContainer: "#7f1d1d",
    onPrimary: "#111827",
    onSecondary: "#111827",
    onSurface: "#d1d5db",
    onSurfaceVariant: "#9ca3af",
    onBackground: "#d1d5db",
    outline: "#374151",
  },
};

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const themeMode = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    dispatch(loadThemeModeFromStorage());
    dispatch(restoreSession());
  }, [dispatch]);

  useEffect(() => startRemoteMobileLogging(), []);

  useEffect(() => {
    // HTTP 426: the server no longer serves this build. Say so once, rather
    // than letting every request fail with a message that explains nothing.
    let shown = false;
    setUpdateRequiredHandler(() => {
      if (shown) return;
      shown = true;
      const storeUrl = Platform.OS === "ios" ? STORE_URLS.ios : STORE_URLS.android;
      Alert.alert(
        "Update Required",
        "This version of ScanGenAI is no longer supported. Please update to continue.",
        storeUrl
          ? [{ text: "Update", onPress: () => Linking.openURL(storeUrl) }]
          : [{ text: "OK" }],
        { onDismiss: () => (shown = false) },
      );
    });
    return () => setUpdateRequiredHandler(null);
  }, []);

  const getTheme = () => {
    if (themeMode === "system") {
      return colorScheme === "dark" ? customDarkTheme : customLightTheme;
    }
    return themeMode === "dark" ? customDarkTheme : customLightTheme;
  };

  const theme = getTheme();

  return (
    <PaperProvider theme={theme}>
      <BillingBootstrap />
      <AppNavigator />
      <Toast />
    </PaperProvider>
  );
};

const CrashScreen: React.FC<{ resetErrorBoundary: () => void }> = ({
  resetErrorBoundary,
}) => (
  <View style={styles.crash}>
    <Text variant="headlineSmall" style={styles.crashTitle}>
      Something went wrong
    </Text>
    <Text variant="bodyMedium" style={styles.crashBody}>
      The app hit an unexpected problem. Your account and files are safe.
    </Text>
    <Button mode="contained" onPress={resetErrorBoundary} testID="crash-retry">
      Try Again
    </Button>
  </View>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <PaperProvider>
          {/* A render error used to leave a blank white screen with no way out. */}
          <ErrorBoundary
            FallbackComponent={CrashScreen}
            onError={(error, info) =>
              logger.error("render_crash", "Unhandled render error", {
                error,
                stack: info.componentStack ?? undefined,
              })
            }
          >
            <AppContent />
          </ErrorBoundary>
        </PaperProvider>
      </Provider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  crash: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  crashTitle: { marginBottom: 12, textAlign: "center" },
  crashBody: { marginBottom: 24, textAlign: "center" },
});
