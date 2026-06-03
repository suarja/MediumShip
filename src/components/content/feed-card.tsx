import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  ContentCardModel,
  ContentKind,
} from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

// Format glyph per editorial kind (no cover art in the model yet).
const KIND_GLYPH: Record<ContentKind, string> = {
  article: "✎",
  episode: "▷",
  video: "▶",
};

/**
 * The single feed card used for every item — both the lead `featured` hero and
 * the standard rows share this exact layout, so their horizontal padding and
 * left alignment can never drift apart. The only differences are an accent lead
 * rule and a larger title on the featured variant.
 */
export function FeedCard({
  item,
  featured = false,
}: {
  item: ContentCardModel;
  featured?: boolean;
}) {
  const { theme } = useAppTheme();
  const { scaleSpace, scaleFont } = useResponsive();
  const tile = 40 * scaleSpace;
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
            shadowColor: theme.colors.heading,
          },
          pressed && styles.pressed,
        ]}
      >
        {featured ? (
          <View style={[styles.rule, { backgroundColor: accentTone }]} />
        ) : null}

        <View
          style={[
            styles.body,
            {
              paddingHorizontal: theme.spacing.lg * scaleSpace,
              paddingVertical: theme.spacing.sm * scaleSpace,
              gap: theme.spacing.sm * scaleSpace,
            },
          ]}
        >
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
            numberOfLines={featured ? 3 : 2}
            style={[
              styles.title,
              {
                color: theme.colors.heading,
                fontFamily: featured ? fontFamilies.displayBold : fontFamilies.display,
                fontSize: (featured ? 26 : 19) * scaleFont,
                lineHeight: (featured ? 31 : 24) * scaleFont,
              },
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
  card: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  pressed: { opacity: 0.9 },
  rule: { height: 4, width: "100%" },
  body: {},
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
  title: {},
  summary: { fontFamily: fontFamilies.body },
  meta: { fontFamily: fontFamilies.mono, letterSpacing: 0.4, marginTop: 2 },
});
