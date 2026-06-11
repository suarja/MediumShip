// Public env for the MediumShip landing. The demo reads the guest-first public
// feed, so only the Convex URL is required — no Clerk publishable key.
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_URL (or EXPO_PUBLIC_CONVEX_URL) for apps/www.",
  );
}

export const env = {
  convexUrl,
  /** Tenant whose published feed powers the live demo screen. */
  demoTenantSlug: process.env.NEXT_PUBLIC_DEMO_TENANT_SLUG ?? "demo-media",
  /** Deployed CMS URL for the nav link; falls back to a no-op anchor. */
  cmsUrl: process.env.NEXT_PUBLIC_CMS_URL ?? "#",
};
