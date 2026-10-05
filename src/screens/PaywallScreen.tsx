import React, { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { Account } from "../api/client";
import {
  PurchaseCancelledError,
  fetchProOffers,
  manageProSubscription,
  purchasePro,
  restorePro,
  type ProOffer,
  type ProPlan,
} from "../billing/purchases";
import { LEGAL_URLS } from "../constants";
import { ACCOUNT_QUERY_KEY, useAccount } from "../hooks";
import { createMobileLogger } from "../logging/logger";
import { useAppSelector } from "../store";
import { formatPlanDate, proBenefits } from "../utils/plan";

const logger = createMobileLogger("paywall");

type ParamList = { Paywall: { reason?: string } | undefined };
type Props = NativeStackScreenProps<ParamList, "Paywall">;

const PLAN_TITLES: Record<ProPlan, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
};

/**
 * ScanGenAI Pro. Prices come from the store at the moment of sale; what Pro
 * includes comes from the server; whether the purchase worked is the server's
 * answer after it has verified the receipt. Always dismissable.
 */
const PaywallScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { data: account } = useAccount();

  const [offers, setOffers] = useState<ProOffer[] | null>(null);
  const [offersFailed, setOffersFailed] = useState(false);
  const [busy, setBusy] = useState<ProPlan | "restore" | null>(null);

  const purchasesAvailable = account?.purchases_available === true;
  const subscribed = account?.pro === true && account.pro_source === "subscription";

  useEffect(() => {
    if (!purchasesAvailable || subscribed) return;
    let mounted = true;
    fetchProOffers()
      .then((found) => {
        if (mounted) setOffers(found);
      })
      .catch((error) => {
        logger.warn("offers_failed", "Could not load plans", { error });
        if (mounted) setOffersFailed(true);
      });
    return () => {
      mounted = false;
    };
  }, [purchasesAvailable, subscribed]);

  const apply = (next: Account) =>
    queryClient.setQueryData([...ACCOUNT_QUERY_KEY, userId], next);

  const handleBuy = async (plan: ProPlan) => {
    setBusy(plan);
    try {
      const next = await purchasePro(plan);
      apply(next);
      if (next.pro) navigation.goBack();
    } catch (error) {
      if (!(error instanceof PurchaseCancelledError)) {
        Alert.alert(
          "Purchase Not Completed",
          error instanceof Error ? error.message : "Please try again.",
        );
      }
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    setBusy("restore");
    try {
      const next = await restorePro();
      if (next) apply(next);
      Alert.alert(
        next?.pro ? "Purchases Restored" : "Nothing to Restore",
        next?.pro
          ? "ScanGenAI Pro is active on this account."
          : "The store has no active ScanGenAI Pro subscription for this account.",
      );
      if (next?.pro) navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Restore Failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(null);
    }
  };

  const handleManage = () =>
    manageProSubscription().catch(() =>
      Alert.alert("Not Available", "Open your store account to manage it."),
    );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.closeRow}>
        <IconButton
          icon="close"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Close"
          testID="paywall-close"
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          variant="labelLarge"
          style={{ color: theme.colors.primary, fontWeight: "700" }}
        >
          ScanGenAI Pro
        </Text>
        <Text variant="headlineSmall" style={styles.title}>
          More answers, from more models.
        </Text>
        {route.params?.reason ? (
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
            testID="paywall-reason"
          >
            {route.params.reason}
          </Text>
        ) : null}

        <Card mode="outlined" style={styles.card}>
          <Card.Content>
            {proBenefits(account).map((benefit) => (
              <Text key={benefit} variant="bodyLarge" style={styles.benefit}>
                ✓ {benefit}
              </Text>
            ))}
          </Card.Content>
        </Card>

        {account?.pro ? (
          <Card mode="outlined" style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" testID="paywall-active">
                You are on ScanGenAI Pro
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {subscribed
                  ? `Paid through ${formatPlanDate(account.pro_expires_at)}. Manage or cancel any time in your store account.`
                  : `Pro is included with your account until ${formatPlanDate(account.pro_expires_at)}.`}
              </Text>
              {subscribed && (
                <Button onPress={handleManage} testID="paywall-manage">
                  Manage Subscription
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : null}

        {!subscribed && !purchasesAvailable && (
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
            testID="paywall-coming-soon"
          >
            Plans are coming soon.
          </Text>
        )}

        {!subscribed && purchasesAvailable && (
          <View style={styles.plans}>
            {offers === null && !offersFailed && (
              <ActivityIndicator testID="paywall-loading" />
            )}
            {offersFailed && (
              <Text style={{ color: theme.colors.error }} testID="paywall-store-error">
                The store could not be reached. Please try again later.
              </Text>
            )}
            {offers?.length === 0 && (
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                No plans are available right now.
              </Text>
            )}
            {offers?.map((offer) => (
              <Button
                key={offer.plan}
                mode={offer.plan === "yearly" ? "contained" : "outlined"}
                onPress={() => handleBuy(offer.plan)}
                loading={busy === offer.plan}
                disabled={busy !== null}
                contentStyle={styles.planContent}
                testID={`paywall-buy-${offer.plan}`}
              >
                {PLAN_TITLES[offer.plan]} — {offer.displayPrice}
              </Button>
            ))}
            <Button
              onPress={handleRestore}
              loading={busy === "restore"}
              disabled={busy !== null}
              testID="paywall-restore"
            >
              Restore Purchases
            </Button>
            <Text
              variant="bodySmall"
              style={[styles.finePrint, { color: theme.colors.onSurfaceVariant }]}
            >
              Subscriptions renew automatically until cancelled. Cancel any
              time in your store account settings.
            </Text>
          </View>
        )}

        <View style={styles.links}>
          <Button compact onPress={() => Linking.openURL(LEGAL_URLS.terms)}>
            Terms of Use
          </Button>
          <Button compact onPress={() => Linking.openURL(LEGAL_URLS.privacy)}>
            Privacy Policy
          </Button>
        </View>
        <Button onPress={() => navigation.goBack()} testID="paywall-not-now">
          Not Now
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeRow: { paddingTop: 48, paddingHorizontal: 8, alignItems: "flex-end" },
  content: { padding: 20, paddingTop: 0, paddingBottom: 40, gap: 14 },
  title: { fontWeight: "800" },
  card: { borderRadius: 16 },
  benefit: { marginVertical: 4 },
  plans: { gap: 12 },
  planContent: { paddingVertical: 8 },
  finePrint: { textAlign: "center" },
  links: { flexDirection: "row", justifyContent: "center", gap: 8 },
});

export default PaywallScreen;
