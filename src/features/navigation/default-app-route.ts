import type { NavTabKey } from "../../../convex/featureCatalog";

export function getDefaultAppRoute(
  effectiveNavigation: readonly NavTabKey[],
): `/${NavTabKey}` {
  const firstTab: NavTabKey = effectiveNavigation[0] ?? "home";
  return `/${firstTab}`;
}

export function shouldRedirectTabBoot(args: {
  pathname: string;
  effectiveNavigation: readonly NavTabKey[];
  allTabRouteNames: readonly NavTabKey[];
}): boolean {
  const { pathname, effectiveNavigation, allTabRouteNames } = args;
  const defaultRoute = getDefaultAppRoute(effectiveNavigation);
  return allTabRouteNames.some((route) => pathname === `/${route}`) && pathname !== defaultRoute;
}
