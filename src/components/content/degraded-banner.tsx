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

  return (
    <View
      style={[
        styles.banner,
        {
          borderRadius: theme.radii.sm,
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
      <Text style={[styles.text, { color: theme.colors.text, fontSize: 12 * scaleFont }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    letterSpacing: 0.3,
    flexShrink: 1,
  },
});
