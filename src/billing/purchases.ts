/**
 * Store purchase + restore for ScanGenAI Pro (monthly and yearly). The store
 * sells it; the server decides the plan and when it ends. Ported from NoAlibi
 * (and Lost Vowels / Letterbolt before it), including their review fixes.
 */
import { Platform } from "react-native";
import {
  deepLinkToSubscriptions,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type ProductSubscription,
  type Purchase,
} from "react-native-iap";

import {
  recoverPurchases,
  verifyPurchase,
  type Account as Entitlement,
  type StorePlatform,
} from "../api/client";
import { IAP } from "../constants";
import { createMobileLogger } from "../logging/logger";

const log = createMobileLogger("purchases");

export type ProPlan = "monthly" | "yearly";

/** A plan as the store prices it now, in the user's own currency. */
export interface ProOffer {
  plan: ProPlan;
  productId: string;
  displayPrice: string;
}

const PLAN_PRODUCT_IDS: Record<ProPlan, string> = {
  monthly: IAP.proMonthlyProductId,
  yearly: IAP.proYearlyProductId,
};
const PRODUCT_IDS: readonly string[] = Object.values(PLAN_PRODUCT_IDS);

function storePlatform(): StorePlatform {
  if (Platform.OS === "ios" || Platform.OS === "android") return Platform.OS;
  throw new Error("In-app purchases are available only on iOS and Android.");
}

/** The user closed the store sheet. Not a failure: the UI shows nothing. */
export class PurchaseCancelledError extends Error {
  constructor() {
    super("The purchase was cancelled.");
    this.name = "PurchaseCancelledError";
  }
}

function purchaseError(error: unknown): Error {
  // Checked before instanceof: the store's error is often a plain object, and
  // wrapping it would lose the code that marks a cancellation.
  if (isUserCancelledError(error)) return new PurchaseCancelledError();
  return error instanceof Error ? error : new Error("Purchase failed.");
}

let connected: Promise<boolean> | null = null;
let listeners: { remove: () => void }[] | null = null;
let purchaseInFlight: Promise<Entitlement> | null = null;
const entitlementListeners = new Set<(entitlement: Entitlement) => void>();
let pending: {
  resolve: (entitlement: Entitlement) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
} | null = null;

function settle(outcome: { entitlement: Entitlement } | { error: unknown }): void {
  if (!pending) return;
  const current = pending;
  pending = null;
  clearTimeout(current.timeout);
  if ("entitlement" in outcome) current.resolve(outcome.entitlement);
  else current.reject(purchaseError(outcome.error));
}

async function processPurchase(purchase: Purchase): Promise<Entitlement | null> {
  if (!PRODUCT_IDS.includes(purchase.productId) || purchase.purchaseState !== "purchased") {
    return null;
  }
  if (!purchase.purchaseToken) {
    throw new Error("The store returned a completed purchase with no token.");
  }
  // Store callbacks can repeat while verification is in flight. Collapse them
  // so one transaction makes one server call and one finish.
  purchaseInFlight ??= (async () => {
    const entitlement = await verifyPurchase(storePlatform(), purchase.purchaseToken as string);
    // Finished only after the server recorded it: a crash before this leaves
    // the transaction for the store to re-deliver instead of losing a payment.
    // On Android this also acknowledges it, which Play requires within 3 days.
    await finishTransaction({ purchase, isConsumable: false });
    entitlementListeners.forEach((listener) => listener(entitlement));
    return entitlement;
  })().finally(() => {
    purchaseInFlight = null;
  });
  return purchaseInFlight;
}

/** Observe entitlement changes from transactions that finish outside a button
 *  press (renewals delivered at launch, a late-completing purchase). */
export function onProEntitlementChanged(
  listener: (entitlement: Entitlement) => void,
): () => void {
  entitlementListeners.add(listener);
  return () => entitlementListeners.delete(listener);
}

function installListeners(): void {
  if (listeners) return;
  listeners = [
    purchaseUpdatedListener((purchase) => {
      void processPurchase(purchase)
        .then((entitlement) => {
          if (entitlement) settle({ entitlement });
        })
        .catch((error) => {
          log.warn("purchase.verify_failed", "Purchase verification failed", { error });
          settle({ error });
        });
    }),
    purchaseErrorListener((error) => {
      if (isUserCancelledError(error)) {
        log.info("purchase.cancelled", "User closed the store sheet");
      } else {
        log.warn("purchase.error", "Store reported a purchase error", { error });
      }
      settle({ error });
    }),
  ];
}

/** Open the store connection once. Safe to call repeatedly. */
export function initPurchases(): Promise<boolean> {
  connected ??= initConnection()
    .then(() => {
      // Lives for the app process, not just while the paywall is open: that is
      // how a renewal or a late-completing purchase is verified and finished.
      installListeners();
      return true;
    })
    .catch((error) => {
      log.warn("purchase.init_failed", "Store connection failed", { error });
      connected = null;
      return false;
    });
  return connected;
}

async function fetchSubscriptions(): Promise<ProductSubscription[]> {
  const products = await fetchProducts({ skus: [...PRODUCT_IDS], type: "subs" });
  return (products ?? []).filter(
    (product): product is ProductSubscription => product.type === "subs",
  );
}

/** The plans the store will sell now, with localized prices. Apple requires
 *  the real price before the purchase sheet opens. */
export async function fetchProOffers(): Promise<ProOffer[]> {
  if (!(await initPurchases())) throw new Error("The store is unavailable.");
  const products = await fetchSubscriptions();
  return (Object.keys(PLAN_PRODUCT_IDS) as ProPlan[]).flatMap((plan) => {
    const product = products.find((p) => p.id === PLAN_PRODUCT_IDS[plan]);
    return product ? [{ plan, productId: product.id, displayPrice: product.displayPrice }] : [];
  });
}

/** Subscribe to a plan; resolves with the server's entitlement. */
export async function purchasePro(plan: ProPlan): Promise<Entitlement> {
  if (!(await initPurchases())) throw new Error("The store is unavailable.");
  const platform = storePlatform();
  const sku = PLAN_PRODUCT_IDS[plan];
  const product = (await fetchSubscriptions()).find((p) => p.id === sku);
  if (!product) throw new Error("This plan is not available right now.");
  // Play sells a subscription through one of its offers (the base plan, or the
  // free trial when the user is eligible); the first is Play's recommendation.
  const offerToken =
    product.platform === "android"
      ? product.subscriptionOffers?.find((offer) => offer.offerTokenAndroid)?.offerTokenAndroid
      : undefined;
  if (platform === "android" && !offerToken) {
    throw new Error("This plan is not available right now.");
  }
  if (pending) throw new Error("A purchase is already in progress.");
  return new Promise<Entitlement>((resolve, reject) => {
    pending = {
      resolve,
      reject,
      timeout: setTimeout(() => {
        settle({ error: new Error("The purchase is still pending.") });
      }, 2 * 60_000),
    };
    requestPurchase({
      request:
        platform === "ios"
          ? { apple: { sku } }
          : {
              google: {
                skus: [sku],
                subscriptionOffers: [{ sku, offerToken: offerToken as string }],
              },
            },
      type: "subs",
    }).catch((error) => settle({ error }));
  });
}

async function activeReceipts(): Promise<string[]> {
  const purchases = await getAvailablePurchases();
  return purchases
    .filter((p) => PRODUCT_IDS.includes(p.productId) && Boolean(p.purchaseToken))
    .map((p) => p.purchaseToken as string);
}

/** Restore Purchases: re-verify the store's active subscriptions. Null when
 *  the store holds none. */
export async function restorePro(): Promise<Entitlement | null> {
  if (!(await initPurchases())) throw new Error("The store is unavailable.");
  const receipts = await activeReceipts();
  if (receipts.length === 0) return null;
  return recoverPurchases(storePlatform(), receipts);
}

/** Quietly re-send a subscription the server may have missed (a renewal whose
 *  notification never arrived). Costs no server call when there is none. */
export async function reconcilePro(): Promise<Entitlement | null> {
  if (!(await initPurchases())) return null;
  const receipts = await activeReceipts();
  if (receipts.length === 0) return null;
  return recoverPurchases(storePlatform(), receipts);
}

/** Open the store's own subscription page; cancelling is the store's job. */
export async function manageProSubscription(): Promise<void> {
  if (!(await initPurchases())) throw new Error("The store is unavailable.");
  const active = (await getAvailablePurchases()).find((p) => PRODUCT_IDS.includes(p.productId));
  await deepLinkToSubscriptions({
    skuAndroid: active?.productId ?? IAP.proMonthlyProductId,
    packageNameAndroid: IAP.androidPackageName,
  });
}
