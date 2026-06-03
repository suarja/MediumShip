import { StyleSheet, Text, View } from "react-native";

import { useTranslation } from "react-i18next";

import type { NetworkState } from "../../features/network/use-network-status";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

export function DegradedBanner({ state }: { state: NetworkState }) {
  const { t } = useTranslation("network");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();

  if (state === "online") {
    return null;
  }

  const label =
    state === "offline"
      ? t("offline")
      : state === "backendDegraded"
        ? t("backendDegraded")
        : t("authDegraded");
  const tone =
    state === "offline"
      ? {
          backgroundColor: theme.colors.dangerSoft,
          borderColor: theme.colors.danger,
          dotColor: theme.colors.danger,
          textColor: theme.colors.heading,
        }
      : state === "backendDegraded"
        ? {
            backgroundColor: theme.colors.premiumSoft,
            borderColor: theme.colors.premium,
            dotColor: theme.colors.premium,
            textColor: theme.colors.heading,
          }
        : {
            backgroundColor: theme.colors.accentSoft,
            borderColor: theme.colors.accent,
            dotColor: theme.colors.accent,
            textColor: theme.colors.heading,
          };

  return (
    <View
      style={[
        styles.banner,
        {
          borderRadius: theme.radii.md,
          backgroundColor: tone.backgroundColor,
          borderColor: tone.borderColor,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tone.dotColor }]} />
      <Text style={[styles.text, { color: tone.textColor, fontSize: 13 * scaleFont }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 12,
    borderWidth: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  text: {
    fontFamily: fontFamilies.mono,
    fontSize: 13,
    letterSpacing: 0.3,
    flexShrink: 1,
    lineHeight: 18,
  },
});
