import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { Text, TextInput, Button, Surface, useTheme } from "react-native-paper";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppDispatch, useAppSelector } from "../store";
import { register } from "../store/actions/authActions";
import {
  getEmailError,
  getPasswordError,
  getNameError,
} from "../utils/validation";

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Register"
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const theme = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const nameErr = getNameError(name);
    const emailErr = getEmailError(email);
    const passwordErr = getPasswordError(password);

    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    return !nameErr && !emailErr && !passwordErr;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const message = await dispatch(register({ name, email, password }));
      Alert.alert("Registration Successful", message, [
        {
          text: "LOGIN",
          onPress: () => navigation.navigate("Login"),
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error instanceof Error ? error.message : "An error occurred"
      );
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
              <Text
                variant="displaySmall"
                style={[styles.title, { color: theme.colors.primary }]}
              >
                Create Account
              </Text>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Sign up to get started
              </Text>
            </View>

            <View style={styles.form}>
              <TextInput
                label="Name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError(null);
                }}
                mode="outlined"
                autoCapitalize="words"
                left={<TextInput.Icon icon="account" />}
                error={!!nameError}
                style={styles.input}
                testID="name-input"
              />
              {nameError && (
                <Text
                  variant="labelSmall"
                  style={[styles.errorText, { color: theme.colors.error }]}
                >
                  {nameError}
                </Text>
              )}

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
                testID="email-input"
              />
              {emailError && (
                <Text
                  variant="labelSmall"
                  style={[styles.errorText, { color: theme.colors.error }]}
                >
                  {emailError}
                </Text>
              )}

              <TextInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(null);
                }}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                error={!!passwordError}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                testID="password-input"
              />
              {passwordError && (
                <Text
                  variant="labelSmall"
                  style={[styles.errorText, { color: theme.colors.error }]}
                >
                  {passwordError}
                </Text>
              )}

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                testID="register-button"
              >
                Register
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate("Login")}
                style={styles.linkButton}
                testID="login-link"
              >
                Already have an account?{" "}
                <Text style={{ fontWeight: "bold" }}>Login</Text>
              </Button>

              <Button
                mode="text"
                onPress={() =>
                  Linking.openURL("https://kingsleyabia.dev/scangenai/policy")
                }
                style={styles.privacyButton}
                icon="shield-check"
                testID="privacy-policy-link"
              >
                Privacy Policy
              </Button>
            </View>
          </Surface>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    padding: 24,
    borderRadius: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 12,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 16,
  },
  privacyButton: {
    marginTop: 8,
  },
});

export default RegisterScreen;
