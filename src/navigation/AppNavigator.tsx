import React from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { useAppSelector } from '../store';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import PdfScreen from '../screens/PdfScreen';
import SoundScreen from '../screens/SoundScreen';
import AccountScreen from '../screens/AccountScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PaywallScreen from '../screens/PaywallScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string } | undefined;
  MainTabs: undefined;
  Paywall: { reason?: string } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  PDF: undefined;
  Sound: undefined;
  Account: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'PDF') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Sound') {
            iconName = focused ? 'mic' : 'mic-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          elevation: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="PDF" component={PdfScreen} />
      <Tab.Screen name="Sound" component={SoundScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { isAuthenticated, restoring } = useAppSelector((state) => state.auth);
  const theme = useTheme();

  // Until the stored session has been read, showing Login would flash the
  // sign-in form at a user who is about to be signed in.
  if (restoring) {
    return (
      <View
        style={[styles.restoring, { backgroundColor: theme.colors.background }]}
        testID="session-restoring"
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const navigationTheme: Theme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    dark: theme.dark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outline,
      notification: theme.colors.error,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  restoring: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default AppNavigator;

