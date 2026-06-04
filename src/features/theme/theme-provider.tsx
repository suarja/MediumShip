import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { defaultTenant } from "../tenant/default-tenant";
import {
  type EnabledModule,
  type FeedSectionConfig,
  normalizeEnabledModules,
  normalizeFeedSections,
} from "../tenant/public-config";
import {
  AppTheme,
  defaultThemeConfig,
  isThemePaletteName,
  resolveTheme,
  ThemeConfig,
} from "./palette-catalog";

type ThemeContextValue = {
  appIconUrl?: string;
  brandLogoUrl?: string;
  theme: AppTheme;
  themeConfig: ThemeConfig;
  tenantSlug: string;
  tenantName: string;
  enabledModules: EnabledModule[];
  feedSections: FeedSectionConfig[];
  isLoading: boolean;
};

const fallbackValue: ThemeContextValue = {
  appIconUrl: defaultTenant.appIconUrl,
  brandLogoUrl: defaultTenant.brandLogoUrl,
  theme: resolveTheme(defaultThemeConfig),
  themeConfig: defaultThemeConfig,
  tenantSlug: defaultTenant.slug,
  tenantName: defaultTenant.name,
  enabledModules: defaultTenant.enabledModules,
  feedSections: defaultTenant.feedSections,
  isLoading: false,
};

const ThemeContext = createContext<ThemeContextValue>(fallbackValue);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const tenant = useQuery(api.tenants.queries.getDefaultTenant, {});

  const value = useMemo<ThemeContextValue>(() => {
    const themeConfig: ThemeConfig =
      tenant?.themeConfig && isThemePaletteName(tenant.themeConfig.paletteName)
        ? { paletteName: tenant.themeConfig.paletteName }
        : defaultThemeConfig;
    const enabledModules = normalizeEnabledModules(
      tenant?.enabledModules ?? defaultTenant.enabledModules,
    );
    const feedSections = normalizeFeedSections(tenant?.feedSections, enabledModules);

    return {
      appIconUrl: tenant?.appIconUrl ?? defaultTenant.appIconUrl,
      brandLogoUrl: tenant?.brandLogoUrl ?? defaultTenant.brandLogoUrl,
      theme: resolveTheme(themeConfig),
      themeConfig,
      tenantSlug: tenant?.slug ?? defaultTenant.slug,
      tenantName: tenant?.name ?? defaultTenant.name,
      enabledModules,
      feedSections,
      isLoading: tenant === undefined,
    };
  }, [tenant]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
