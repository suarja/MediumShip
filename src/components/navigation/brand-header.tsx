import { Image, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * Compact editorial masthead from the Civica mockup: an italic-serif wordmark
 * with an accent dot on the left, and the app icon on the right. The dark hero
 * card below carries the editorial weight, so this stays deliberately light.
 * Tenant branding and all colours come from the resolved theme.
 */
export function BrandHeader() {
  const { appIconUrl, brandLogoUrl, theme, tenantName } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const iconSize = 34 * scaleSpace;
  const [logoFailed, setLogoFailed] = useState(false);
  const [appIconFailed, setAppIconFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [brandLogoUrl]);

  useEffect(() => {
    setAppIconFailed(false);
  }, [appIconUrl]);

  const showBrandLogo = Boolean(brandLogoUrl) && !logoFailed;
  const showAppIcon = Boolean(appIconUrl) && !appIconFailed;

  return (
    <View style={[styles.row, { marginBottom: theme.spacing.lg * scaleSpace }]}>
      <View style={styles.brand}>
        {showBrandLogo ? (
          <Image
            accessibilityLabel={`${tenantName} logo`}
            onError={() => setLogoFailed(true)}
            resizeMode="contain"
            source={{ uri: brandLogoUrl }}
            style={styles.logoImage}
          />
        ) : (
          <>
            <Text
              numberOfLines={1}
              style={[styles.logo, { color: theme.colors.heading, fontSize: 22 * scaleFont }]}
            >
              {tenantName}
            </Text>
            <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
          </>
        )}
      </View>

      <View
        style={[
          styles.iconShell,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}
      >
        {showAppIcon ? (
          <Image
            accessibilityLabel={`${tenantName} app icon`}
            onError={() => setAppIconFailed(true)}
            source={{ uri: appIconUrl }}
            style={styles.appIcon}
          />
        ) : (
          <View style={styles.appIconFallback}>
            <Text style={[styles.appIconFallbackLabel, { color: theme.colors.heading }]}>
              {(tenantName.trim().charAt(0) || "M").toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "flex-end", flexShrink: 1 },
  logo: { fontFamily: fontFamilies.displayBoldItalic, letterSpacing: -0.3 },
  logoImage: { width: 132, height: 28, marginLeft: -12 },
  dot: { width: 6, height: 6, borderRadius: 999, marginLeft: 3, marginBottom: 6 },
  iconShell: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  appIcon: { width: "100%", height: "100%" },
  appIconFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  appIconFallbackLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    lineHeight: 16,
  },
});
