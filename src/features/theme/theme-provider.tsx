import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import {
  AppTheme,
  defaultThemeConfig,
  isThemePaletteName,
  resolveTheme,
  ThemeConfig,
} from "./palette-catalog";

type ThemeContextValue = {
  theme: AppTheme;
  themeConfig: ThemeConfig;
  tenantName: string;
  isLoading: boolean;
};

const fallbackValue: ThemeContextValue = {
  theme: resolveTheme(defaultThemeConfig),
  themeConfig: defaultThemeConfig,
  tenantName: "MediumShip",
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

    return {
      theme: resolveTheme(themeConfig),
      themeConfig,
      tenantName: tenant?.name ?? "MediumShip",
      isLoading: tenant === undefined,
    };
  }, [tenant]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
