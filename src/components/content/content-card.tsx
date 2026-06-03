import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  ContentCardModel,
  ContentKind,
} from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

// Single glyph per editorial format, echoing the Civica mockup rows where each
// item leads with a tinted media tile. Until real cover art is seeded we lean
// on a typographic mark so the feed still reads as multi-format at a glance.
const KIND_GLYPH: Record<ContentKind, string> = {
  article: "✎",
  episode: "▷",
  video: "▶",
};

export function ContentCard({ item }: { item: ContentCardModel }) {
  const { theme } = useAppTheme();
  const { scaleSpace, scaleFont } = useResponsive();
  const tileSize = 64 * scaleSpace;

  const tileColor =
    item.kind === "video"
      ? theme.colors.canvasAccent
      : item.kind === "episode"
        ? theme.colors.surfaceMuted
        : theme.colors.accentSoft;

  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.card,
          {
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            padding: 14 * scaleSpace,
            gap: 14 * scaleSpace,
          },
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.tile,
            {
              width: tileSize,
              height: tileSize,
              borderRadius: theme.radii.sm,
              backgroundColor: tileColor,
            },
          ]}
        >
          <Text style={[styles.glyph, { color: theme.colors.accent, fontSize: 24 * scaleFont }]}>
            {KIND_GLYPH[item.kind]}
          </Text>
          {item.isPremium ? (
            <View
              style={[
                styles.premiumBadge,
                { backgroundColor: theme.colors.premium },
              ]}
            >
              <Text style={styles.premiumStar}>★</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text
            style={[
              styles.kicker,
              {
                color: item.isPremium ? theme.colors.premium : theme.colors.accent,
                fontSize: 10 * scaleFont,
              },
            ]}
          >
            {item.kindLabel}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.title, { color: theme.colors.heading, fontSize: 18 * scaleFont }]}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.summary, { color: theme.colors.text, fontSize: 14 * scaleFont }]}
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
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: { opacity: 0.85 },
  tile: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { fontSize: 24, fontWeight: "700" },
  premiumBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumStar: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  body: { flex: 1, gap: 4, justifyContent: "center" },
  kicker: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 18,
    lineHeight: 23,
  },
  summary: { fontFamily: fontFamilies.body, fontSize: 14, lineHeight: 19 },
  meta: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 2,
  },
});
