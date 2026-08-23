import React from "react";
import { View, StyleSheet } from "react-native";
import { Surface, Text, IconButton, useTheme } from "react-native-paper";
import AppLogo from "./AppLogo";
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
          <AppLogo size={42} testID="app-header-logo" />
          <View style={styles.headerText}>
            <Text
              variant="headlineSmall"
              numberOfLines={1}
              style={{ color: theme.colors.primary, fontWeight: "bold" }}
              testID="app-header-title"
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                variant="bodyMedium"
                numberOfLines={1}
                style={{ color: theme.colors.onSurfaceVariant }}
                testID="app-header-subtitle"
              >
                {subtitle}
              </Text>
            )}
          </View>
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
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
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
