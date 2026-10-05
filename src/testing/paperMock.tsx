/**
 * A plain-React-Native stand-in for react-native-paper, for screen tests:
 *
 *   jest.mock("react-native-paper", () => require("../../testing/paperMock"));
 *
 * The real components need native-backed providers that the jest environment
 * does not have. These keep every prop a test looks at (testID, value,
 * onPress, children) and drop the styling.
 */
import React from "react";
import {
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AnyProps = Record<string, any>;

const Box = ({ children, testID }: AnyProps) => (
  <View testID={testID}>{children}</View>
);

export const Text = ({ children, testID }: AnyProps) => (
  <RNText testID={testID}>{children}</RNText>
);

export const Button = ({ children, onPress, disabled, testID }: AnyProps) => (
  <TouchableOpacity onPress={disabled ? undefined : onPress} testID={testID}>
    <RNText>{children}</RNText>
  </TouchableOpacity>
);

export const IconButton = ({ onPress, testID }: AnyProps) => (
  <TouchableOpacity onPress={onPress} testID={testID} />
);

export const TextInput = Object.assign(
  ({ onChangeText, value, testID, secureTextEntry }: AnyProps) => (
    <RNTextInput
      onChangeText={onChangeText}
      value={value}
      testID={testID}
      secureTextEntry={secureTextEntry}
    />
  ),
  { Icon: () => null },
);

export const Card = Object.assign(Box, {
  Content: Box,
  Title: ({ title, subtitle }: AnyProps) => (
    <View>
      <RNText>{title}</RNText>
      {subtitle ? <RNText>{subtitle}</RNText> : null}
    </View>
  ),
});

export const Dialog = Object.assign(
  ({ children, visible }: AnyProps) => (visible ? <View>{children}</View> : null),
  { Title: Text, Content: Box, Actions: Box },
);

export const Portal = ({ children }: AnyProps) => <>{children}</>;
export const Surface = Box;
export const PaperProvider = ({ children }: AnyProps) => <>{children}</>;
export const ProgressBar = () => null;
export const ActivityIndicator = ({ testID }: AnyProps) => <View testID={testID} />;

export const useTheme = () => ({
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
});
