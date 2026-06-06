import { StyleSheet, Text, View } from "react-native";

import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

export type GateTone = "free" | "member" | "premium";

type GateBadgeProps = {
  tone: GateTone;
  label: string;
};

export function GateBadge({ tone, label }: GateBadgeProps) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const color = tone === "premium" ? theme.colors.premium : theme.colors.accent;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: withAlpha(color, 0.16) },
      ]}
    >
      <Text
        style={[
          styles.badgeLabel,
          { color, fontSize: 8 * scaleFont },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
