import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type IconName = ComponentProps<typeof Ionicons>["name"];

type ProfileStatStripProps = {
  savedCount: number;
  offlineCount: number;
  historyCount: number;
  labels: {
    saved: string;
    offline: string;
    history: string;
  };
};

/**
 * Mockup `p2__stats`: three compact tiles (Saved / Offline / History). The
 * history value is a passed-in placeholder until resume/history is wired.
 */
export function ProfileStatStrip({
  savedCount,
  offlineCount,
  historyCount,
  labels,
}: ProfileStatStripProps) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  const stats: { key: string; icon: IconName; value: number; label: string; tone: string }[] = [
    {
      key: "saved",
      icon: savedCount > 0 ? "bookmark" : "bookmark-outline",
      value: savedCount,
      label: labels.saved,
      tone: theme.colors.accent,
    },
    {
      key: "offline",
      icon: offlineCount > 0 ? "download" : "download-outline",
      value: offlineCount,
      label: labels.offline,
      tone: theme.colors.premium,
    },
    {
      key: "history",
      icon: "time-outline",
      value: historyCount,
      label: labels.history,
      tone: theme.colors.textMuted,
    },
  ];

  return (
    <View style={[styles.strip, { gap: theme.spacing.sm * scaleSpace }]}>
      {stats.map((stat) => (
        <View
          key={stat.key}
          style={[
            styles.tile,
            {
              borderRadius: theme.radii.sm,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              padding: theme.spacing.sm * scaleSpace,
              gap: 2 * scaleSpace,
            },
          ]}
        >
          <Ionicons color={stat.tone} name={stat.icon} size={13 * scaleFont} />
          <Text
            style={[
              styles.value,
              { color: theme.colors.heading, fontSize: 20 * scaleFont },
            ]}
          >
            {stat.value}
          </Text>
          <Text
            style={[
              styles.label,
              { color: theme.colors.textMuted, fontSize: 9 * scaleFont },
            ]}
          >
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
  },
  tile: {
    flex: 1,
    minWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
  },
  value: {
    fontFamily: fontFamilies.displayBold,
    letterSpacing: -0.3,
  },
  label: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
