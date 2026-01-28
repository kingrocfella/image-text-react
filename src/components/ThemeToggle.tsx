import React from "react";
import { View, StyleSheet } from "react-native";
import { Switch, useTheme, Menu, IconButton } from "react-native-paper";
import { useAppDispatch, useAppSelector } from "../store";
import { setThemeModePersisted, ThemeMode } from "../store/slices/themeSlice";

const ThemeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const themeMode = useAppSelector((state) => state.theme.mode);
  const [menuVisible, setMenuVisible] = React.useState(false);

  const isDarkMode = themeMode === "dark";
  const isSystemMode = themeMode === "system";

  const handleToggle = () => {
    const newMode: ThemeMode = isDarkMode ? "light" : "dark";
    dispatch(setThemeModePersisted(newMode));
  };

  const handleMenuSelect = (mode: ThemeMode) => {
    dispatch(setThemeModePersisted(mode));
    setMenuVisible(false);
  };

  const getModeLabel = () => {
    switch (themeMode) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return "System";
      default:
        return "System";
    }
  };

  return (
    <View style={styles.container}>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <View style={styles.toggleContainer}>
            {!isSystemMode && (
              <Switch
                value={isDarkMode}
                onValueChange={handleToggle}
                style={styles.switch}
              />
            )}
            <IconButton
              icon={
                isSystemMode
                  ? "theme-light-dark"
                  : isDarkMode
                    ? "weather-night"
                    : "weather-sunny"
              }
              iconColor={theme.colors.onSurface}
              size={20}
              onPress={() => setMenuVisible(true)}
              style={styles.iconButton}
            />
          </View>
        }
      >
        <Menu.Item
          onPress={() => handleMenuSelect("light")}
          title="Light"
          leadingIcon={themeMode === "light" ? "check" : "weather-sunny"}
        />
        <Menu.Item
          onPress={() => handleMenuSelect("dark")}
          title="Dark"
          leadingIcon={themeMode === "dark" ? "check" : "weather-night"}
        />
        <Menu.Item
          onPress={() => handleMenuSelect("system")}
          title="System"
          leadingIcon={themeMode === "system" ? "check" : "theme-light-dark"}
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  switch: {
    marginHorizontal: 0,
  },
  iconButton: {
    margin: 0,
  },
});

export default ThemeToggle;
