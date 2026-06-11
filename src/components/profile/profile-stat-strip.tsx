import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type IconName = ComponentProps<typeof Ionicons>["name"];

type ProfileStatStripProps = {
  savedCount: number;
  offlineCount: number;
  historyCount: number;
  showSaved?: boolean;
  showOffline?: boolean;
  showHistory?: boolean;
  labels: {
    saved: string;
    offline: string;
    history: string;
  };
  onPressSaved?: () => void;
  onPressOffline?: () => void;
  onPressHistory?: () => void;
};

/**
 * Mockup `p2__stats`: three compact tiles (Saved / Offline / History). The
 * history value is a passed-in placeholder until resume/history is wired.
 */
export function ProfileStatStrip({
  savedCount,
  offlineCount,
  historyCount,
  showSaved = true,
  showOffline = true,
  showHistory = true,
  labels,
  onPressSaved,
  onPressOffline,
  onPressHistory,
}: ProfileStatStripProps) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  const stats: {
    key: string;
    icon: IconName;
    value: number;
    label: string;
    tone: string;
    onPress?: () => void;
  }[] = [];

  if (showSaved) {
    stats.push({
      key: "saved",
      icon: savedCount > 0 ? "bookmark" : "bookmark-outline",
      value: savedCount,
      label: labels.saved,
      tone: theme.colors.accent,
      onPress: onPressSaved,
    });
  }

  if (showOffline) {
    stats.push({
      key: "offline",
      icon: offlineCount > 0 ? "download" : "download-outline",
      value: offlineCount,
      label: labels.offline,
      tone: theme.colors.premium,
      onPress: onPressOffline,
    });
  }

  if (showHistory) {
    stats.push({
      key: "history",
      icon: "time-outline",
      value: historyCount,
      label: labels.history,
      tone: theme.colors.textMuted,
      onPress: onPressHistory,
    });
  }

  return (
    <View style={[styles.strip, { gap: theme.spacing.sm * scaleSpace }]}>
      {stats.map((stat) => {
        const tileStyle = {
          borderRadius: theme.radii.sm,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.sm * scaleSpace,
          gap: 2 * scaleSpace,
        };
        const inner = (
          <>
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
                { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
              ]}
            >
              {stat.label}
            </Text>
          </>
        );

        if (stat.onPress) {
          return (
            <Pressable
              key={stat.key}
              accessibilityRole="button"
              accessibilityLabel={stat.label}
              onPress={stat.onPress}
              style={({ pressed }) => [
                styles.tile,
                tileStyle,
                pressed && styles.tilePressed,
              ]}
            >
              {inner}
            </Pressable>
          );
        }

        return (
          <View key={stat.key} style={[styles.tile, tileStyle]}>
            {inner}
          </View>
        );
      })}
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
  tilePressed: {
    opacity: 0.7,
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
