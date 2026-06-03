import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ContentCardModel } from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * Full-bleed editorial hero for the lead feed item. Painted with the palette's
 * brand `accent` + `accentContrast` pair so it stays bold and readable across
 * every theme — including the dark `midnight` palette — instead of assuming a
 * fixed light/dark surface.
 */
export function FeaturedCard({ item }: { item: ContentCardModel }) {
  const { theme } = useAppTheme();
  const { scaleSpace, scaleFont } = useResponsive();
  const ink = theme.colors.accentContrast;

  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.card,
          {
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.accent,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.media, { height: 132 * scaleSpace }]}>
          <View style={styles.mediaGlow} />
        </View>

        <View style={[styles.body, { padding: 18 * scaleSpace }]}>
          <Text style={[styles.kicker, { color: ink, fontSize: 10 * scaleFont }]}>
            {item.isPremium ? `${item.kindLabel} · Premium` : item.kindLabel}
          </Text>
          <Text
            numberOfLines={3}
            style={[styles.title, { color: ink, fontSize: 24 * scaleFont }]}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.summary, { color: ink, fontSize: 14 * scaleFont }]}
          >
            {item.summary}
          </Text>
          {item.metaLabel ? (
            <Text style={[styles.meta, { color: ink, fontSize: 11 * scaleFont }]}>
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
  media: { justifyContent: "center", alignItems: "flex-end" },
  mediaGlow: {
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    marginRight: -70,
    marginTop: -50,
  },
  body: { gap: 6 },
  kicker: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    opacity: 0.9,
  },
  title: { fontFamily: fontFamilies.display, lineHeight: 30 },
  summary: { lineHeight: 20, opacity: 0.92 },
  meta: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.4,
    opacity: 0.8,
    marginTop: 2,
  },
});
