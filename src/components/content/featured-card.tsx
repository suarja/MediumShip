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
 * Full-bleed editorial hero for the lead feed item. Painted with the palette's
 * brand `accent` + `accentContrast` pair (contrast-guarded across every theme,
 * including dark ones) and marked with a large corner glyph for the format, so
 * it reads as an intentional hero rather than an empty media band.
 */
export function FeaturedCard({ item }: { item: ContentCardModel }) {
  const { theme } = useAppTheme();
  const { scaleSpace, scaleFont } = useResponsive();
  const ink = theme.colors.accentContrast;
  const pad = theme.spacing.xl * scaleSpace;

  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.card,
          {
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.accent,
            padding: pad,
            gap: theme.spacing.sm * scaleSpace,
          },
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[styles.glyph, { color: ink, fontSize: 120 * scaleFont }]}
          accessible={false}
        >
          {KIND_GLYPH[item.kind]}
        </Text>

        <Text style={[styles.kicker, { color: ink, fontSize: 11 * scaleFont }]}>
          {item.isPremium ? `${item.kindLabel} · Premium` : item.kindLabel}
        </Text>
        <Text
          numberOfLines={3}
          style={[
            styles.title,
            { color: ink, fontSize: 26 * scaleFont, lineHeight: 31 * scaleFont },
          ]}
        >
          {item.title}
        </Text>
        <Text
          numberOfLines={2}
          style={[styles.summary, { color: ink, fontSize: 15 * scaleFont, lineHeight: 21 * scaleFont }]}
        >
          {item.summary}
        </Text>
        {item.metaLabel ? (
          <Text style={[styles.meta, { color: ink, fontSize: 11 * scaleFont }]}>
            {item.metaLabel}
          </Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { overflow: "hidden" },
  pressed: { opacity: 0.92 },
  glyph: {
    position: "absolute",
    top: -18,
    right: 6,
    opacity: 0.16,
    fontWeight: "700",
  },
  kicker: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  title: { fontFamily: fontFamilies.display },
  summary: { opacity: 0.95 },
  meta: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.4,
    opacity: 0.85,
    marginTop: 2,
  },
});
