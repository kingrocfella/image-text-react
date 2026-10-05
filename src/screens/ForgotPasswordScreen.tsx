import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text, TextInput, Button, Surface, useTheme } from "react-native-paper";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppDispatch } from "../store";
import { forgotPassword } from "../store/slices/authSlice";
import { getEmailError } from "../utils/validation";
import AppLogo from "../components/AppLogo";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string } | undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

/**
 * Asks the server to email a reset link. The new password is chosen on the
 * page that link opens, so no reset token ever passes through the app.
 */
const ForgotPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();

  const [email, setEmail] = useState(route.params?.email ?? "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const handleSend = async () => {
    const emailErr = getEmailError(email);
    setEmailError(emailErr);
    if (emailErr) return;

    setSending(true);
    setNotice(null);
    setFailure(null);
    const result = await dispatch(forgotPassword(email.trim()));
    setSending(false);
    if (forgotPassword.fulfilled.match(result)) {
      setNotice(result.payload);
    } else {
      setFailure(result.payload || "Could not send the reset email");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Surface
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            elevation={2}
          >
            <View style={styles.header}>
              <AppLogo size={76} />
              <Text
                variant="headlineMedium"
                style={[styles.title, { color: theme.colors.primary }]}
              >
                Reset Password
              </Text>
              <Text
                variant="bodyLarge"
                style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
              >
                Enter your email and we will send you a link to choose a new
                password.
              </Text>
            </View>

            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(null);
              }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={!!emailError}
              left={<TextInput.Icon icon="email" />}
              style={styles.input}
              testID="forgot-email-input"
            />
            {emailError && (
              <Text
                variant="labelSmall"
                style={[styles.message, { color: theme.colors.error }]}
              >
                {emailError}
              </Text>
            )}
            {notice && (
              <Text
                variant="bodyMedium"
                style={[styles.message, { color: theme.colors.primary }]}
                testID="forgot-notice"
              >
                {notice}
              </Text>
            )}
            {failure && (
              <Text
                variant="bodyMedium"
                style={[styles.message, { color: theme.colors.error }]}
                testID="forgot-failure"
              >
                {failure}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleSend}
              loading={sending}
              disabled={sending}
              style={styles.button}
              contentStyle={styles.buttonContent}
              testID="forgot-submit-button"
            >
              Send Reset Link
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate("Login")}
              style={styles.linkButton}
              testID="back-to-login-link"
            >
              Back to Login
            </Button>
          </Surface>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: "center", padding: 20 },
  card: { padding: 24, borderRadius: 16 },
  header: { marginBottom: 24, alignItems: "center" },
  title: { fontWeight: "bold", marginTop: 16, marginBottom: 8 },
  subtitle: { textAlign: "center" },
  input: { marginBottom: 8 },
  message: { marginBottom: 8, marginLeft: 4 },
  button: { marginTop: 16, borderRadius: 8 },
  buttonContent: { paddingVertical: 8 },
  linkButton: { marginTop: 16 },
});

export default ForgotPasswordScreen;
