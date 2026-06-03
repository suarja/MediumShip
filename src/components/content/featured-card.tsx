import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ContentCardModel } from "../../features/content/types";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * Full-bleed editorial hero for the lead feed item, echoing the dark
 * `hero-card` in the Civica mockup: ink background, cream serif headline, and a
 * gold/accent kicker.
 */
export function FeaturedCard({ item }: { item: ContentCardModel }) {
  const { theme } = useAppTheme();
  const accentTone = item.isPremium ? theme.colors.premium : theme.colors.accent;

  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.card,
          {
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.heading,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.media, { backgroundColor: theme.colors.canvasAccent }]}>
          <View style={[styles.mediaGlow, { backgroundColor: accentTone }]} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.kicker, { color: accentTone }]}>
            {item.isPremium ? `${item.kindLabel} · Premium` : item.kindLabel}
          </Text>
          <Text
            numberOfLines={3}
            style={[styles.title, { color: theme.colors.surface }]}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.summary, { color: theme.colors.surfaceMuted }]}
          >
            {item.summary}
          </Text>
          {item.metaLabel ? (
            <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
              {item.metaLabel}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden" },
  pressed: { opacity: 0.92 },
  media: { height: 132, justifyContent: "center", alignItems: "flex-end" },
  mediaGlow: {
    width: 200,
    height: 200,
    borderRadius: 200,
    opacity: 0.32,
    marginRight: -70,
    marginTop: -40,
  },
  body: { gap: 6, padding: 18 },
  kicker: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  title: { fontFamily: fontFamilies.display, fontSize: 24, lineHeight: 29 },
  summary: { fontSize: 14, lineHeight: 20 },
  meta: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 2,
  },
});
