import type { AccessLevel } from "../../../convex/featureCatalog";
import { canAccessFeatureLevel, type FeatureAccessContext } from "./feature-access";

export type AccessBadgeLevel = "member" | "premium";

export type AccessBadgeResult = {
  show: boolean;
  level?: AccessBadgeLevel;
};

/**
 * Decides whether an access badge (Membre / Premium) should render for the
 * current viewer. Badges appear only when the content or feature is locked —
 * never on raw `access === "premium"` alone.
 */
export function resolveAccessBadge(args: {
  access: AccessLevel;
  isAuthenticated: boolean;
  isPro: boolean;
}): AccessBadgeResult {
  const context: FeatureAccessContext = {
    isAuthenticated: args.isAuthenticated,
    isPro: args.isPro,
  };

  if (args.access === "free") {
    return { show: false };
  }

  if (args.access === "member") {
    if (!args.isAuthenticated) {
      return { show: true, level: "member" };
    }
    return { show: false };
  }

  if (!canAccessFeatureLevel("premium", context)) {
    return { show: true, level: "premium" };
  }

  return { show: false };
}

/** Maps CMS content's `isPremium` flag to the shared badge rule. */
export function resolveContentAccessBadge(args: {
  isPremium: boolean;
  isAuthenticated: boolean;
  isPro: boolean;
}): AccessBadgeResult {
  return resolveAccessBadge({
    access: args.isPremium ? "premium" : "free",
    isAuthenticated: args.isAuthenticated,
    isPro: args.isPro,
  });
}
