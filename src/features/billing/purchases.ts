import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";

import { env } from "../../lib/env";

const isNativePurchasesAvailable = Platform.OS === "ios" || Platform.OS === "android";

let configuredForClerkId: string | null = null;

function apiKeyForPlatform(): string | null {
  if (Platform.OS === "ios") {
    return env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || null;
  }
  if (Platform.OS === "android") {
    return env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || null;
  }
  return null;
}

export function isPurchasesSupported(): boolean {
  return isNativePurchasesAvailable && Boolean(apiKeyForPlatform());
}

export async function configurePurchases(clerkId: string): Promise<void> {
  if (!isNativePurchasesAvailable) {
    return;
  }

  const apiKey = apiKeyForPlatform();
  if (!apiKey) {
    return;
  }

  if (configuredForClerkId === clerkId) {
    return;
  }

  if (configuredForClerkId === null) {
    Purchases.configure({ apiKey, appUserID: clerkId });
    configuredForClerkId = clerkId;
    return;
  }

  await Purchases.logIn(clerkId);
  configuredForClerkId = clerkId;
}

export async function getPremiumOffering(): Promise<PurchasesOffering | null> {
  if (!isPurchasesSupported()) {
    return null;
  }

  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export function selectPremiumPackage(
  offering: PurchasesOffering | null,
): PurchasesPackage | null {
  if (!offering) {
    return null;
  }

  return (
    offering.monthly ??
    offering.availablePackages.find((pkg) => pkg.packageType === "MONTHLY") ??
    offering.availablePackages[0] ??
    null
  );
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

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (customerInfo.entitlements.active.premium) {
      return { kind: "success", customerInfo };
    }
    return { kind: "already", customerInfo };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { kind: "cancelled" };
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

  try {
    const customerInfo = await Purchases.restorePurchases();
    if (customerInfo.entitlements.active.premium) {
      return { kind: "success", customerInfo };
    }
    return { kind: "none" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Restore failed. Please try again.";
    return { kind: "error", message };
  }
}

/** Test-only reset for module configure state. */
export function resetPurchasesForTests(): void {
  configuredForClerkId = null;
}
