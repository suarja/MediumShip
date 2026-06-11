import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { HapticsService } from "../../features/haptics/haptics";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type ScreenHeaderProps = {
  title: string;
  onBack: () => void;
  backLabel: string;
  /** Optional trailing slot (e.g. an action button). Defaults to a spacer that keeps the title centered. */
  right?: ReactNode;
};

/**
 * Shared top bar for detail/list routes (favorites, downloads, lists, history…):
 * a bold, comfortably tappable back chevron, a centered title, and an optional
 * trailing slot. Bleeds full-width via a negative margin so it aligns with the
 * `Screen` horizontal padding.
 */
export function ScreenHeader({ title, onBack, backLabel, right }: ScreenHeaderProps) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const side = 40 * scaleSpace;

  return (
    <View
      style={[
        styles.topBar,
        {
          marginHorizontal: -(theme.spacing.lg * scaleSpace),
          paddingHorizontal: theme.spacing.lg * scaleSpace,
        },
      ]}
    >
      <Pressable
        onPress={() => {
          void HapticsService.light();
          onBack();
        }}
        hitSlop={8}
        style={({ pressed }) => [
          styles.action,
          { width: side, height: side, marginLeft: -6 * scaleSpace },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
      >
        <Ionicons
          color={theme.colors.heading}
          name="chevron-back"
          size={26 * scaleFont}
        />
      </Pressable>

      <Text
        style={[styles.title, { color: theme.colors.heading, fontSize: 18 * scaleFont }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={[styles.side, { minWidth: side }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 12,
  },
  action: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
  title: {
    flex: 1,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  side: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
