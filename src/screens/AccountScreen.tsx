import React, { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Linking, Alert } from "react-native";
import {
  Text,
  Button,
  Card,
  Dialog,
  Portal,
  ProgressBar,
  TextInput,
  ActivityIndicator,
  useTheme,
} from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";
import { APP_VERSION, LEGAL_URLS } from "../constants";
import { useAccount } from "../hooks";
import { useAppDispatch, useAppSelector } from "../store";
import {
  deleteAccount,
  logout,
  type DeletionProof,
} from "../store/slices/authSlice";
import { getGoogleIdToken } from "../auth/googleSignIn";
import { signInWithAppleNative } from "../auth/appleSignIn";
import { formatPlanDate } from "../utils/plan";

const USAGE_LABELS: Record<string, string> = {
  image: "Image scans",
  sound: "Audio transcriptions",
  pdf: "PDF questions",
  cloud_model: "Cloud-model answers",
};
const USAGE_ORDER = ["image", "sound", "pdf", "cloud_model"];

const AccountScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data: account, isLoading, isError, refetch } = useAccount();
  const navigation = useNavigation<{ navigate: (screen: "Paywall") => void }>();
  // An account made through Google or Apple has no password to ask for.
  const hasPassword = account
    ? account.login_methods.includes("password")
    : true;

  const [deleteVisible, setDeleteVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Usage changes on the other tabs; show current numbers on every visit.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const closeDelete = () => {
    setDeleteVisible(false);
    setPassword("");
    setDeleteError(null);
  };

  /** Fresh proof of ownership: the password, or a new provider sign-in. */
  const collectProof = async (): Promise<DeletionProof | null> => {
    if (hasPassword) {
      if (!password) {
        setDeleteError("Enter your password to confirm.");
        return null;
      }
      return { password };
    }
    try {
      if (account?.login_methods.includes("google")) {
        const idToken = await getGoogleIdToken();
        return idToken ? { google_id_token: idToken } : null;
      }
      const { identityToken } = await signInWithAppleNative();
      return { apple_identity_token: identityToken };
    } catch {
      setDeleteError("We could not confirm it is you. Please try again.");
      return null;
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    const proof = await collectProof();
    if (!proof) return;
    setDeleting(true);
    const result = await dispatch(deleteAccount(proof));
    setDeleting(false);
    if (deleteAccount.rejected.match(result)) {
      setDeleteError(result.payload || "Your account could not be deleted.");
      return;
    }
    // Fulfilled: the store signs out and the navigator returns to Login.
    Alert.alert(
      "Account Deleted",
      "Your account and everything stored with it have been permanently deleted.",
    );
  };

  const usage = USAGE_ORDER.filter((kind) => account?.usage[kind]).map(
    (kind) => ({ kind, ...account!.usage[kind] }),
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader title="Account" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" testID="account-name">
              {account?.name ?? user?.name ?? ""}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
              testID="account-email"
            >
              {account?.email ?? user?.email ?? ""}
            </Text>
          </Card.Content>
        </Card>

        {account && (
          <Card style={styles.card} mode="outlined" testID="plan-card">
            <Card.Title
              title={account.pro ? "ScanGenAI Pro" : "Free plan"}
              subtitle={
                account.pro
                  ? account.pro_source === "subscription"
                    ? `Paid through ${formatPlanDate(account.pro_expires_at)}`
                    : `Included until ${formatPlanDate(account.pro_expires_at)}`
                  : "Upgrade for more models and higher limits"
              }
            />
            <Card.Content>
              <Button
                mode={account.pro ? "outlined" : "contained"}
                icon="star-four-points"
                onPress={() => navigation.navigate("Paywall")}
                testID="plan-button"
              >
                {account.pro ? "View Plan" : "Upgrade to Pro"}
              </Button>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card} mode="outlined">
          <Card.Title title="This month" subtitle="Resets on the 1st" />
          <Card.Content>
            {isLoading && <ActivityIndicator testID="usage-loading" />}
            {isError && (
              <View>
                <Text style={{ color: theme.colors.error }}>
                  Usage could not be loaded.
                </Text>
                <Button onPress={() => refetch()} testID="usage-retry">
                  Try Again
                </Button>
              </View>
            )}
            {usage.map(({ kind, used, limit }) => (
              <View key={kind} style={styles.usageRow} testID={`usage-${kind}`}>
                <View style={styles.usageLabels}>
                  <Text variant="bodyMedium">{USAGE_LABELS[kind]}</Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {limit > 0 ? `${used} of ${limit}` : "Not available"}
                  </Text>
                </View>
                <ProgressBar
                  progress={limit > 0 ? Math.min(used / limit, 1) : 0}
                  color={
                    limit > 0 && used >= limit
                      ? theme.colors.error
                      : theme.colors.primary
                  }
                />
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Button
              icon="shield-check"
              onPress={() => Linking.openURL(LEGAL_URLS.privacy)}
              testID="account-privacy-link"
            >
              Privacy Policy
            </Button>
            <Button
              icon="lifebuoy"
              onPress={() => Linking.openURL(LEGAL_URLS.support)}
              testID="account-support-link"
            >
              Support
            </Button>
            <Button
              icon="logout"
              onPress={() => dispatch(logout())}
              testID="account-logout-button"
            >
              Log Out
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="outlined">
          <Card.Title title="Delete account" />
          <Card.Content>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Permanently deletes your account, your uploaded documents and
              everything derived from them. This cannot be undone.
            </Text>
            <Button
              mode="outlined"
              textColor={theme.colors.error}
              icon="delete-forever"
              onPress={() => setDeleteVisible(true)}
              style={styles.deleteButton}
              testID="delete-account-button"
            >
              Delete My Account
            </Button>
          </Card.Content>
        </Card>

        <Text
          variant="labelSmall"
          style={[styles.version, { color: theme.colors.onSurfaceVariant }]}
        >
          Version {APP_VERSION}
        </Text>
      </ScrollView>

      <Portal>
        <Dialog visible={deleteVisible} onDismiss={deleting ? undefined : closeDelete}>
          <Dialog.Title>Delete your account?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              This permanently deletes your account and all of your data.{" "}
              {hasPassword
                ? "Enter your password to confirm."
                : "You will be asked to sign in once more to confirm it is you."}
            </Text>
            {account?.pro_source === "subscription" && (
              <Text
                variant="bodyMedium"
                style={[styles.dialogText, { color: theme.colors.error }]}
                testID="delete-subscription-warning"
              >
                Deleting your account does not cancel your subscription. Cancel
                it in your store account first, or you will keep being charged.
              </Text>
            )}
            {hasPassword && (<TextInput
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (deleteError) setDeleteError(null);
              }}
              mode="outlined"
              secureTextEntry
              autoCapitalize="none"
              error={!!deleteError}
              testID="delete-account-password"
            />)}
            {deleteError && (
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.error, marginTop: 6 }}
                testID="delete-account-error"
              >
                {deleteError}
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDelete} disabled={deleting} testID="delete-account-cancel">
              Cancel
            </Button>
            <Button
              onPress={handleDelete}
              loading={deleting}
              disabled={deleting}
              textColor={theme.colors.error}
              testID="delete-account-confirm"
            >
              Delete Forever
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 16 },
  card: { borderRadius: 16 },
  usageRow: { marginBottom: 14 },
  usageLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  deleteButton: { marginTop: 16 },
  dialogText: { marginBottom: 16 },
  version: { textAlign: "center" },
});

export default AccountScreen;
