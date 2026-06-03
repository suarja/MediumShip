import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  ContentCardModel,
  ContentKind,
} from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

const KIND_GLYPH: Record<ContentKind, string> = {
  article: "✎",
  episode: "▷",
  video: "▶",
};

/**
 * Editorial hero for the lead feed item. Built on the readable `surface` +
 * `heading` token pair (high contrast in every palette) so the title clearly
 * stands out, with an accent-tinted media band + format glyph on top to keep
 * the hero feel — instead of low-contrast text on a full accent fill.
 */
export function FeaturedCard({ item }: { item: ContentCardModel }) {
  const { theme } = useAppTheme();
  const { scaleSpace, scaleFont } = useResponsive();
  const accentTone = item.isPremium ? theme.colors.premium : theme.colors.accent;

  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.card,
          {
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.media,
            { height: 120 * scaleSpace, backgroundColor: theme.colors.accentSoft },
          ]}
        >
          <Text
            style={[styles.glyph, { color: accentTone, fontSize: 56 * scaleFont }]}
            accessible={false}
          >
            {KIND_GLYPH[item.kind]}
          </Text>
          {item.isPremium ? (
            <View style={[styles.premiumBadge, { backgroundColor: theme.colors.premium }]}>
              <Text style={styles.premiumStar}>★</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.body, { padding: theme.spacing.lg * scaleSpace }]}>
          <Text style={[styles.kicker, { color: accentTone, fontSize: 11 * scaleFont }]}>
            {item.isPremium ? `${item.kindLabel} · Premium` : item.kindLabel}
          </Text>
          <Text
            numberOfLines={3}
            style={[
              styles.title,
              { color: theme.colors.heading, fontSize: 26 * scaleFont, lineHeight: 31 * scaleFont },
            ]}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.summary, { color: theme.colors.text, fontSize: 15 * scaleFont, lineHeight: 21 * scaleFont }]}
          >
            {item.summary}
          </Text>
          {item.metaLabel ? (
            <Text style={[styles.meta, { color: theme.colors.textMuted, fontSize: 11 * scaleFont }]}>
              {item.metaLabel}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden", borderWidth: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.9 },
  media: { justifyContent: "center", alignItems: "center" },
  glyph: { fontWeight: "700", opacity: 0.85 },
  premiumBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumStar: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  body: { gap: 5 },
  kicker: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  title: { fontFamily: fontFamilies.display, fontWeight: "700" },
  summary: {},
  meta: { fontFamily: fontFamilies.mono, letterSpacing: 0.4, marginTop: 2 },
});
