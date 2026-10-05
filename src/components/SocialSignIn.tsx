import React, { useEffect, useState } from "react";
import { Alert, Platform, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

import {
  isAppleAuthAvailable,
  isAppleSignInCancelledError,
  signInWithAppleNative,
} from "../auth/appleSignIn";
import {
  getGoogleIdToken,
  isGoogleSignInCancelledError,
} from "../auth/googleSignIn";
import { GOOGLE_SIGN_IN_ENABLED } from "../constants";
import { createMobileLogger } from "../logging/logger";
import { useAppDispatch, useAppSelector } from "../store";
import { socialLogin } from "../store/slices/authSlice";
import { AppleSignInButton } from "./AppleSignInButton";

const logger = createMobileLogger("social-sign-in");

interface Props {
  mode: "sign-in" | "sign-up";
}

/**
 * Google on Android, Apple on iOS (AGENTS.md §5): never the other way round,
 * and nothing at all where neither is available.
 */
const SocialSignIn: React.FC<Props> = ({ mode }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const loading = useAppSelector((state) => state.auth.loading);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    void isAppleAuthAvailable().then((available) => {
      if (mounted) setAppleAvailable(available);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const showGoogle = Platform.OS === "android" && GOOGLE_SIGN_IN_ENABLED;
  const showApple = Platform.OS === "ios" && appleAvailable;
  if (!showGoogle && !showApple) return null;

  const finish = async (
    credential: Parameters<typeof socialLogin>[0],
  ): Promise<void> => {
    const result = await dispatch(socialLogin(credential));
    if (socialLogin.rejected.match(result)) {
      Alert.alert("Sign-in Failed", result.payload || "An error occurred");
    }
  };

  const handleGoogle = async () => {
    try {
      const idToken = await getGoogleIdToken();
      if (idToken) await finish({ provider: "google", idToken });
    } catch (error) {
      if (isGoogleSignInCancelledError(error)) return;
      logger.warn("google_failed", "Google sign-in failed", { error });
      Alert.alert("Sign-in Failed", "Google sign-in could not be completed.");
    }
  };

  const handleApple = async () => {
    try {
      const { identityToken, fullName } = await signInWithAppleNative();
      const name = [fullName?.givenName, fullName?.familyName]
        .filter(Boolean)
        .join(" ");
      await finish({ provider: "apple", identityToken, name: name || null });
    } catch (error) {
      if (isAppleSignInCancelledError(error)) return;
      logger.warn("apple_failed", "Apple sign-in failed", { error });
      Alert.alert("Sign-in Failed", "Apple sign-in could not be completed.");
    }
  };

  return (
    <View style={styles.container} testID="social-sign-in">
      <Text
        variant="labelMedium"
        style={[styles.divider, { color: theme.colors.onSurfaceVariant }]}
      >
        or
      </Text>
      {showGoogle && (
        <Button
          mode="outlined"
          icon="google"
          onPress={handleGoogle}
          disabled={loading}
          contentStyle={styles.buttonContent}
          testID="google-sign-in-button"
        >
          {mode === "sign-up" ? "Sign up with Google" : "Continue with Google"}
        </Button>
      )}
      {showApple && (
        <AppleSignInButton mode={mode} disabled={loading} onPress={handleApple} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 8, gap: 12 },
  divider: { textAlign: "center" },
  buttonContent: { paddingVertical: 8 },
});

export default SocialSignIn;
