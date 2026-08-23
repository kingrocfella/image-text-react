import React from "react";
import { Image, ImageStyle, StyleProp, StyleSheet } from "react-native";

interface AppLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
  testID?: string;
}

const logo = require("../../assets/icon.png");

const AppLogo: React.FC<AppLogoProps> = ({
  size = 72,
  style,
  testID = "scangenai-logo",
}) => (
  <Image
    accessibilityLabel="ScanGenAI logo"
    accessibilityRole="image"
    resizeMode="contain"
    source={logo}
    style={[
      styles.logo,
      { width: size, height: size, borderRadius: size * 0.22 },
      style,
    ]}
    testID={testID}
  />
);

const styles = StyleSheet.create({
  logo: {
    flexShrink: 0,
  },
});

export default AppLogo;
