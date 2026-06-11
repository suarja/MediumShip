import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";

import { env } from "../../lib/env";
import { logBilling, maskRevenueCatKey } from "./billing-debug";
import {
  getPremiumEntitlementId,
  hasPremiumEntitlement,
} from "./premium-entitlement";

const isNativePurchasesAvailable = Platform.OS === "ios" || Platform.OS === "android";

let configuredForClerkId: string | null = null;
let sdkLogLevelSet = false;

type ApiKeySource = "test_store" | "ios" | "android" | "none";

function resolveApiKey(): { key: string | null; source: ApiKeySource } {
  const testStoreKey = env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_KEY?.trim();
  if (__DEV__ && testStoreKey) {
    return { key: testStoreKey, source: "test_store" };
  }

  if (Platform.OS === "ios") {
    const key = env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim() || null;
    return { key, source: key ? "ios" : "none" };
  }

  if (Platform.OS === "android") {
    const key = env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim() || null;
    return { key, source: key ? "android" : "none" };
  }

  return { key: null, source: "none" };
}

export function isPurchasesSupported(): boolean {
  return isNativePurchasesAvailable && Boolean(resolveApiKey().key);
}

export function getPurchasesDiagnostics(): {
  platform: string;
  purchasesSupported: boolean;
  apiKeySource: ApiKeySource;
  apiKeyPreview?: string;
  configuredForClerkId: string | null;
  sdkVersionHint: string;
} {
  const { key, source } = resolveApiKey();
  return {
    platform: Platform.OS,
    purchasesSupported: isPurchasesSupported(),
    apiKeySource: source,
    apiKeyPreview: maskRevenueCatKey(key ?? undefined),
    configuredForClerkId,
    sdkVersionHint: "react-native-purchases@9.5.4+ required for RevenueCat Test Store",
  };
}

function ensureSdkDebugLogging(): void {
  if (!__DEV__ || sdkLogLevelSet) return;
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  sdkLogLevelSet = true;
  logBilling("sdk.log_level", { level: "DEBUG" });
}

function serializeOfferings(offerings: PurchasesOfferings) {
  const allIds = Object.keys(offerings.all);
  const current = offerings.current;

  return {
    currentIdentifier: current?.identifier ?? null,
    allOfferingIds: allIds,
    currentPackages: (current?.availablePackages ?? []).map((pkg) => ({
      identifier: pkg.identifier,
      packageType: pkg.packageType,
      productId: pkg.product.identifier,
      priceString: pkg.product.priceString,
    })),
    allOfferings: allIds.map((id) => {
      const offering = offerings.all[id];
      return {
        identifier: offering.identifier,
        packageCount: offering.availablePackages.length,
        packageIds: offering.availablePackages.map((pkg) => pkg.identifier),
      };
    }),
  };
}

export async function configurePurchases(clerkId: string): Promise<void> {
  if (!isNativePurchasesAvailable) {
    logBilling("configure.skip", { reason: "not_native_platform", platform: Platform.OS });
    return;
  }

  const { key: apiKey, source } = resolveApiKey();
  if (!apiKey) {
    logBilling("configure.skip", {
      reason: "missing_api_key",
      diagnostics: getPurchasesDiagnostics(),
    });
    return;
  }

  ensureSdkDebugLogging();

  if (configuredForClerkId === clerkId) {
    logBilling("configure.skip", { reason: "already_configured", clerkId });
    return;
  }

  if (configuredForClerkId === null) {
    logBilling("configure.start", {
      clerkId,
      apiKeySource: source,
      apiKeyPreview: maskRevenueCatKey(apiKey),
    });
    Purchases.configure({ apiKey, appUserID: clerkId });
    configuredForClerkId = clerkId;
    logBilling("configure.done", { clerkId, mode: "initial" });
    return;
  }

  logBilling("login.start", { clerkId, previousClerkId: configuredForClerkId });
  const result = await Purchases.logIn(clerkId);
  configuredForClerkId = clerkId;
  logBilling("login.done", {
    clerkId,
    activeEntitlements: Object.keys(result.customerInfo.entitlements.active),
  });
}

export async function getPremiumOffering(): Promise<PurchasesOffering | null> {
  if (!isPurchasesSupported()) {
    logBilling("offerings.skip", { reason: "purchases_not_supported" });
    return null;
  }

  try {
    const offerings = await Purchases.getOfferings();
    const snapshot = serializeOfferings(offerings);
    logBilling("offerings.loaded", snapshot);

    if (!offerings.current) {
      logBilling("offerings.empty_current", {
        hint:
          "No current offering. For Test Store use EXPO_PUBLIC_REVENUECAT_TEST_STORE_KEY (SDK 9.5.4+) and attach products to an offering in RevenueCat.",
        ...snapshot,
      });
    }

    return offerings.current ?? null;
  } catch (error) {
    logBilling("offerings.error", {
      message: error instanceof Error ? error.message : String(error),
      code: (error as { code?: string }).code,
      diagnostics: getPurchasesDiagnostics(),
    });
    throw error;
  }
}

/** Configure the SDK for `clerkId`, then load the current premium offering. */
export async function loadPremiumOfferingForUser(clerkId: string): Promise<{
  offering: PurchasesOffering | null;
  package: PurchasesPackage | null;
  offeringsSnapshot?: ReturnType<typeof serializeOfferings>;
}> {
  if (!isPurchasesSupported()) {
    return { offering: null, package: null };
  }

  logBilling("load_offering.start", { clerkId, diagnostics: getPurchasesDiagnostics() });
  await configurePurchases(clerkId);

  try {
    const offerings = await Purchases.getOfferings();
    const snapshot = serializeOfferings(offerings);
    logBilling("load_offering.done", snapshot);
    const offering = offerings.current ?? null;
    const pkg = selectPremiumPackage(offering);
    if (!pkg) {
      logBilling("load_offering.no_package", snapshot);
    }
    return { offering, package: pkg, offeringsSnapshot: snapshot };
  } catch (error) {
    logBilling("load_offering.error", {
      clerkId,
      message: error instanceof Error ? error.message : String(error),
      code: (error as { code?: string }).code,
    });
    throw error;
  }
}

export function selectPremiumPackage(
  offering: PurchasesOffering | null,
): PurchasesPackage | null {
  if (!offering) {
    return null;
  }

  const selected =
    offering.annual ??
    offering.availablePackages.find((pkg) => pkg.packageType === "ANNUAL") ??
    offering.monthly ??
    offering.availablePackages.find((pkg) => pkg.packageType === "MONTHLY") ??
    offering.availablePackages[0] ??
    null;

  logBilling("package.selected", {
    offeringId: offering.identifier,
    selectedPackageId: selected?.identifier ?? null,
    selectedProductId: selected?.product.identifier ?? null,
    availablePackageIds: offering.availablePackages.map((pkg) => pkg.identifier),
  });

  return selected;
}

export type PurchaseResult =
  | { kind: "success"; customerInfo: CustomerInfo }
  | { kind: "cancelled" }
  | { kind: "already"; customerInfo: CustomerInfo }
  | { kind: "error"; message: string };

export async function purchasePremiumPackage(
  pkg: PurchasesPackage,
): Promise<PurchaseResult> {
  if (!isPurchasesSupported()) {
    return { kind: "error", message: "Purchases are not available on this platform." };
  }

  logBilling("purchase.start", {
    packageId: pkg.identifier,
    productId: pkg.product.identifier,
    priceString: pkg.product.priceString,
  });

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = Object.keys(customerInfo.entitlements.active);
    const premium = hasPremiumEntitlement(customerInfo);
    logBilling("purchase.done", {
      packageId: pkg.identifier,
      activeEntitlements: active,
      entitlementId: getPremiumEntitlementId(),
      hasPremium: premium,
    });
    // A resolved purchasePackage call is always a successful new purchase,
    // regardless of whether the client-side entitlement identifier matches.
    // The Convex webhook/sync is the source of truth for premium state.
    return { kind: "success", customerInfo };
  } catch (error) {
    const code = (error as { code?: string }).code;
    logBilling("purchase.error", {
      packageId: pkg.identifier,
      code,
      message: error instanceof Error ? error.message : String(error),
    });
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { kind: "cancelled" };
    }
    if (code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
      const customerInfo = (error as { userInfo?: { customerInfo?: CustomerInfo } }).userInfo
        ?.customerInfo;
      return { kind: "already", customerInfo: customerInfo as CustomerInfo };
    }
    const message =
      error instanceof Error ? error.message : "Purchase failed. Please try again.";
    return { kind: "error", message };
  }
}

export type RestoreResult =
  | { kind: "success"; customerInfo: CustomerInfo }
  | { kind: "none" }
  | { kind: "error"; message: string };

export async function restorePurchases(): Promise<RestoreResult> {
  if (!isPurchasesSupported()) {
    return { kind: "error", message: "Restore is not available on this platform." };
  }

  logBilling("restore.start", {});
  try {
    const customerInfo = await Purchases.restorePurchases();
    const active = Object.keys(customerInfo.entitlements.active);
    const premium = hasPremiumEntitlement(customerInfo);
    logBilling("restore.done", {
      activeEntitlements: active,
      entitlementId: getPremiumEntitlementId(),
      hasPremium: premium,
    });
    if (premium) {
      return { kind: "success", customerInfo };
    }
    return { kind: "none" };
  } catch (error) {
    logBilling("restore.error", {
      message: error instanceof Error ? error.message : String(error),
      code: (error as { code?: string }).code,
    });
    const message =
      error instanceof Error ? error.message : "Restore failed. Please try again.";
    return { kind: "error", message };
  }
}

/** Test-only reset for module configure state. */
export function resetPurchasesForTests(): void {
  configuredForClerkId = null;
  sdkLogLevelSet = false;
}
