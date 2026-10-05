import { useCallback } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { ApiRequestError } from "../api/http";

type PaywallNavigation = {
  navigate: (screen: "Paywall", params?: { reason?: string }) => void;
};

/**
 * Show why a job failed. When upgrading would fix it (a free allowance has
 * run out), the alert offers the paywall; it never opens it uninvited.
 */
export const useJobFailure = (title: string) => {
  const navigation = useNavigation<PaywallNavigation>();
  return useCallback(
    (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      if (error instanceof ApiRequestError && error.needsPro) {
        Alert.alert(title, message, [
          { text: "Not Now", style: "cancel" },
          {
            text: "See Pro",
            onPress: () => navigation.navigate("Paywall", { reason: message }),
          },
        ]);
        return;
      }
      Alert.alert(title, message);
    },
    [navigation, title],
  );
};
