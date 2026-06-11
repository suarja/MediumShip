import { StyleSheet, Text, View } from "react-native";

import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type Props = {
  eyebrow?: string;
  title?: string;
};

/** Faded article/episode context behind the paywall dim (mockup `sheet-bg`). */
export function PaywallContextPeek({ eyebrow, title }: Props) {
  const { theme } = useAppTheme();

  if (!title) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
        },
      ]}
    >
      <View
        style={[
          styles.hero,
          {
            borderRadius: theme.radii.lg,
            backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.35 : 0.85),
          },
        ]}
      />
      <View style={[styles.body, { gap: theme.spacing.xs }]}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>{eyebrow}</Text>
        ) : null}
        <Text
          numberOfLines={2}
          style={[styles.title, { color: withAlpha(theme.colors.canvas, 0.92) }]}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "flex-end",
    maxHeight: "42%",
  },
  hero: {
    height: 120,
    marginBottom: 12,
  },
  body: {
    paddingHorizontal: 4,
  },
  eyebrow: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
});
