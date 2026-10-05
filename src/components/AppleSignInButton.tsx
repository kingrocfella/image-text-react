import { StyleSheet, View } from "react-native";

import { AppleAuthentication } from "../auth/appleSignIn";

type Props = {
  mode: "sign-in" | "sign-up";
  disabled?: boolean;
  onPress: () => void;
};

export function AppleSignInButton({ mode, disabled = false, onPress }: Props) {
  const buttonType =
    mode === "sign-up"
      ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
      : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN;

  return (
    <View
      pointerEvents={disabled ? "none" : "auto"}
      style={[styles.wrap, disabled && styles.disabled]}
    >
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={buttonType}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={10}
        style={styles.button}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    height: 52,
  },
  button: {
    width: "100%",
    height: 52,
  },
  disabled: {
    opacity: 0.7,
  },
});
