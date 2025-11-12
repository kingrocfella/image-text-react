import React from 'react';
import { Provider } from 'react-redux';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'react-native';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#374151',
    primaryContainer: '#f3f4f6',
    secondary: '#6b7280',
    secondaryContainer: '#f9fafb',
    tertiary: '#4b5563',
    surface: '#ffffff',
    surfaceVariant: '#ffffff',
    background: '#fafafa',
    error: '#dc2626',
    errorContainer: '#fee2e2',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#111827',
    onBackground: '#111827',
    outline: '#e5e7eb',
  },
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#e5e7eb',
    primaryContainer: '#374151',
    secondary: '#9ca3af',
    secondaryContainer: '#1f2937',
    tertiary: '#d1d5db',
    surface: '#1f2937',
    surfaceVariant: '#111827',
    background: '#0f172a',
    error: '#ef4444',
    errorContainer: '#7f1d1d',
    onPrimary: '#111827',
    onSecondary: '#111827',
    onSurface: '#d1d5db',
    onSurfaceVariant: '#9ca3af',
    onBackground: '#d1d5db',
    outline: '#374151',
  },
};

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? customDarkTheme : customLightTheme;

  return (
    <Provider store={store}>
      <PaperProvider theme={theme}>
        <AppNavigator />
        <Toast />
      </PaperProvider>
    </Provider>
  );
}
