import { defaultThemeConfig } from "../theme/palette-catalog";
import {
  DEFAULT_FEED_SECTIONS,
  PUBLIC_CONTENT_MODULES,
  OPTIONAL_PUBLIC_MODULES,
} from "./public-config";

export const defaultTenant = {
  slug: "demo-media",
  name: "Demo Media",
  enabledModules: [...PUBLIC_CONTENT_MODULES, ...OPTIONAL_PUBLIC_MODULES],
  themeConfig: defaultThemeConfig,
  feedSections: DEFAULT_FEED_SECTIONS,
};
