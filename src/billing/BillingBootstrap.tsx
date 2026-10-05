import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { Account } from "../api/client";
import { ACCOUNT_QUERY_KEY } from "../hooks/useAccount";
import { createMobileLogger } from "../logging/logger";
import { useAppSelector } from "../store";
import { initPurchases, onProEntitlementChanged, reconcilePro } from "./purchases";

const log = createMobileLogger("billing");

/**
 * While someone is signed in, keep the store connection open so renewals and
 * late-completing purchases are verified and finished, and quietly re-send a
 * subscription the server may have missed. Renders nothing.
 */
export function BillingBootstrap() {
  const queryClient = useQueryClient();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const signedIn = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!signedIn) return;
    const apply = (account: Account) =>
      queryClient.setQueryData([...ACCOUNT_QUERY_KEY, userId], account);
    const unsubscribe = onProEntitlementChanged(apply);
    void initPurchases()
      .then(() => reconcilePro())
      .then((account) => {
        if (account) apply(account);
      })
      .catch((error) => {
        log.warn("reconcile_failed", "Subscription reconcile failed", { error });
      });
    return unsubscribe;
  }, [signedIn, userId, queryClient]);

  return null;
}
