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
 * Editorial hero for the lead feed item. Text-forward (big serif title on the
 * high-contrast surface/heading pair) with a thin accent lead rule and a small
 * format tile — deliberately no large empty media band, since there is no cover
 * art to show yet.
 */
export function FeaturedCard({ item }: { item: ContentCardModel }) {
  const { theme } = useAppTheme();
  const { scaleSpace, scaleFont } = useResponsive();
  const accentTone = item.isPremium ? theme.colors.premium : theme.colors.accent;
  const tile = 40 * scaleSpace;

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
        <View style={[styles.rule, { backgroundColor: accentTone }]} />

        <View style={[styles.body, { padding: theme.spacing.lg * scaleSpace }]}>
          <View style={[styles.header, { gap: 10 * scaleSpace }]}>
            <View
              style={[
                styles.tile,
                {
                  width: tile,
                  height: tile,
                  borderRadius: theme.radii.sm,
                  backgroundColor: theme.colors.accentSoft,
                },
              ]}
            >
              <Text style={[styles.glyph, { color: accentTone, fontSize: 18 * scaleFont }]}>
                {KIND_GLYPH[item.kind]}
              </Text>
              {item.isPremium ? (
                <View style={[styles.premiumBadge, { backgroundColor: theme.colors.premium }]}>
                  <Text style={styles.premiumStar}>★</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.kicker, { color: accentTone, fontSize: 11 * scaleFont }]}>
              {item.isPremium ? `${item.kindLabel} · Premium` : item.kindLabel}
            </Text>
          </View>

          <Text
            numberOfLines={3}
            style={[
              styles.title,
              { color: theme.colors.heading, fontSize: 27 * scaleFont, lineHeight: 32 * scaleFont },
            ]}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.summary, { color: theme.colors.text, fontSize: 15 * scaleFont, lineHeight: 22 * scaleFont }]}
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
  rule: { height: 4, width: "100%" },
  body: { gap: 8 },
  header: { flexDirection: "row", alignItems: "center" },
  tile: { alignItems: "center", justifyContent: "center" },
  glyph: { fontWeight: "700" },
  premiumBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumStar: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  kicker: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  title: { fontFamily: fontFamilies.displayBold },
  summary: { fontFamily: fontFamilies.body },
  meta: { fontFamily: fontFamilies.mono, letterSpacing: 0.4, marginTop: 2 },
});
