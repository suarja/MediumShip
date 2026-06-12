import {
  buildDefaultFeatureConfigs,
  buildDefaultNavOrder,
} from "../../../convex/featureCatalog";
import { defaultThemeConfig } from "../theme/palette-catalog";
import {
  CAPABILITIES,
  DEFAULT_FEED_SECTIONS,
  OPTIONAL_PUBLIC_MODULES,
  PUBLIC_CONTENT_MODULES,
  SURFACE_MODULES,
  TAB_BAR_MODULES,
} from "./public-config";

export const defaultTenant = {
  slug: "demo-media",
  name: "Demo Media",
  brandLogoUrl: undefined,
  appIconUrl: undefined,
  communityUrl: undefined as string | undefined,
  onboardingCollectionSlug: "pourquoi-ce-fil" as string | undefined,
  enabledModules: [
    ...PUBLIC_CONTENT_MODULES,
    ...OPTIONAL_PUBLIC_MODULES,
    ...TAB_BAR_MODULES,
    ...SURFACE_MODULES,
    ...CAPABILITIES,
  ],
  themeConfig: defaultThemeConfig,
  featureConfigs: buildDefaultFeatureConfigs(),
  navOrder: buildDefaultNavOrder(),
  feedSections: DEFAULT_FEED_SECTIONS,
};
