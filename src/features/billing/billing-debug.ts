/** Dev-only structured logs for RevenueCat / paywall debugging. */

export type BillingLogPayload = Record<string, unknown>;

function maskSecret(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value.length <= 10) return "***";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function maskRevenueCatKey(key: string | null | undefined): string | undefined {
  return maskSecret(key);
}

export function logBilling(event: string, payload: BillingLogPayload = {}): void {
  if (!__DEV__) return;
  console.log(`[billing] ${event}`, payload);
}
