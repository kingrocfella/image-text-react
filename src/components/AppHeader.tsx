import React from "react";
import { View, StyleSheet } from "react-native";
import { Surface, Text, IconButton, useTheme } from "react-native-paper";
import ThemeToggle from "./ThemeToggle";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onLogout?: () => void;
  showLogout?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  onLogout,
  showLogout = false,
}) => {
  const theme = useTheme();

  return (
    <Surface
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outline,
        },
      ]}
      elevation={1}
    >
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text
            variant="headlineMedium"
            style={{ color: theme.colors.primary, fontWeight: "bold" }}
            testID="app-header-title"
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
              testID="app-header-subtitle"
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <ThemeToggle />
          {showLogout && onLogout && (
            <IconButton
              icon="logout"
              iconColor={theme.colors.error}
              size={24}
              onPress={onLogout}
              testID="logout-button"
              style={styles.logoutButton}
            />
          )}
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoutButton: {
    margin: 0,
  },
});

export default AppHeader;

