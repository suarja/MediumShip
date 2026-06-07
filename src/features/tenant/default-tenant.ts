import { buildDefaultFeatureConfigs } from "../../../convex/featureCatalog";
import { defaultThemeConfig } from "../theme/palette-catalog";
import {
  CAPABILITIES,
  DEFAULT_FEED_SECTIONS,
  PUBLIC_CONTENT_MODULES,
  OPTIONAL_PUBLIC_MODULES,
  NAVIGATION_MODULES,
} from "./public-config";

export const defaultTenant = {
  slug: "demo-media",
  name: "Demo Media",
  brandLogoUrl: undefined,
  appIconUrl: undefined,
  enabledModules: [
    ...PUBLIC_CONTENT_MODULES,
    ...OPTIONAL_PUBLIC_MODULES,
    ...NAVIGATION_MODULES,
    ...CAPABILITIES,
  ],
  themeConfig: defaultThemeConfig,
  featureConfigs: buildDefaultFeatureConfigs(),
  feedSections: DEFAULT_FEED_SECTIONS,
};
