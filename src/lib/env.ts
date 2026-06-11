import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_CONVEX_URL: z.string().url(),
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  EXPO_PUBLIC_CONVEX_SITE_URL: z.string().url().optional(),
  EXPO_PUBLIC_EMBED_REFERER_URL: z.string().url().optional(),
  EXPO_PUBLIC_REVENUECAT_IOS_KEY: z.string().optional(),
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: z.string().optional(),
  /** RevenueCat Test Store key — used in __DEV__ when set (see RC Test Store docs). */
  EXPO_PUBLIC_REVENUECAT_TEST_STORE_KEY: z.string().optional(),
  /** RevenueCat entitlement identifier (e.g. "Knowly Pro"). */
  EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID: z.string().optional(),
});

export const env = envSchema.parse({
  EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  EXPO_PUBLIC_CONVEX_SITE_URL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL,
  EXPO_PUBLIC_EMBED_REFERER_URL: process.env.EXPO_PUBLIC_EMBED_REFERER_URL,
  EXPO_PUBLIC_REVENUECAT_IOS_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY:
    process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  EXPO_PUBLIC_REVENUECAT_TEST_STORE_KEY:
    process.env.EXPO_PUBLIC_REVENUECAT_TEST_STORE_KEY,
  EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID:
    process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID,
});
