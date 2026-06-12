import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import {
  resolveEffectiveFeatureConfigs,
  resolveEffectiveNavigation,
  type FeatureKey,
  type NavTabKey,
  type TenantFeatureConfig,
} from "../../../convex/featureCatalog";
import { defaultTenant } from "../tenant/default-tenant";
import {
  type EnabledModule,
  type FeedSectionConfig,
  normalizeEnabledModules,
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
  communityUrl?: string;
  onboardingCollectionSlug?: string;
  theme: AppTheme;
  themeConfig: ThemeConfig;
  tenantSlug: string;
  tenantName: string;
  enabledModules: EnabledModule[];
  featureConfigs: Record<FeatureKey, TenantFeatureConfig>;
  effectiveNavigation: NavTabKey[];
  navOrder: string[];
  feedSections: FeedSectionConfig[];
  isLoading: boolean;
};

const fallbackValue: ThemeContextValue = {
  appIconUrl: defaultTenant.appIconUrl,
  brandLogoUrl: defaultTenant.brandLogoUrl,
  communityUrl: defaultTenant.communityUrl,
  onboardingCollectionSlug: defaultTenant.onboardingCollectionSlug,
  theme: resolveTheme(defaultThemeConfig),
  themeConfig: defaultThemeConfig,
  tenantSlug: defaultTenant.slug,
  tenantName: defaultTenant.name,
  enabledModules: defaultTenant.enabledModules,
  featureConfigs: resolveEffectiveFeatureConfigs({
    enabledModules: defaultTenant.enabledModules,
    navOrder: defaultTenant.navOrder,
  }),
  effectiveNavigation: resolveEffectiveNavigation(
    resolveEffectiveFeatureConfigs({
      enabledModules: defaultTenant.enabledModules,
      navOrder: defaultTenant.navOrder,
    }),
    defaultTenant.navOrder,
  ),
  navOrder: defaultTenant.navOrder,
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
    const navOrder = tenant?.navOrder ?? defaultTenant.navOrder;
    const featureConfigs = resolveEffectiveFeatureConfigs({
      featureConfigs: tenant?.featureConfigs,
      enabledModules,
      navOrder,
    });
    const effectiveNavigation = resolveEffectiveNavigation(featureConfigs, navOrder);
    const feedSections = tenant?.feedSections ?? defaultTenant.feedSections;

    return {
      appIconUrl: tenant?.appIconUrl ?? defaultTenant.appIconUrl,
      brandLogoUrl: tenant?.brandLogoUrl ?? defaultTenant.brandLogoUrl,
      communityUrl: tenant?.communityUrl ?? defaultTenant.communityUrl,
      onboardingCollectionSlug:
        tenant?.onboardingCollectionSlug ?? defaultTenant.onboardingCollectionSlug,
      theme: resolveTheme(themeConfig),
      themeConfig,
      tenantSlug: tenant?.slug ?? defaultTenant.slug,
      tenantName: tenant?.name ?? defaultTenant.name,
      enabledModules,
      featureConfigs,
      effectiveNavigation,
      navOrder,
      feedSections,
      isLoading: tenant === undefined,
    };
  }, [tenant]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
