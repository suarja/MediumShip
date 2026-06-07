import type { NavTabKey } from "../../../convex/featureCatalog";

export function getDefaultAppRoute(
  effectiveNavigation: readonly NavTabKey[],
): `/${NavTabKey}` {
  const firstTab: NavTabKey = effectiveNavigation[0] ?? "home";
  return `/${firstTab}`;
}
