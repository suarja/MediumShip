import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * Compact editorial masthead from the Civica mockup: an italic-serif wordmark
 * with an accent dot on the left, and a single settings affordance on the
 * right. The dark hero card below carries the editorial weight, so this stays
 * deliberately light. Tenant name and all colours come from the resolved theme.
 */
export function BrandHeader() {
  const { brandLogoUrl, theme, tenantName } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const iconSize = 34 * scaleSpace;
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [brandLogoUrl]);

  const showBrandLogo = Boolean(brandLogoUrl) && !logoFailed;

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

      <Link href={"/settings" as never} asChild>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconButton,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: theme.radii.pill,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.icon, { color: theme.colors.heading, fontSize: 15 * scaleFont }]}>
            ⚙
          </Text>
        </Pressable>
      </Link>
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
  logoImage: { width: 132, height: 28 },
  dot: { width: 6, height: 6, borderRadius: 999, marginLeft: 3, marginBottom: 6 },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: { opacity: 0.7 },
  icon: { fontWeight: "700" },
});
