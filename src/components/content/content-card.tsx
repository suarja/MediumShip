import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  ContentCardModel,
  ContentKind,
} from "../../features/content/types";
import { useAppTheme } from "../../features/theme/theme-provider";

// Single glyph per editorial format, echoing the podapp mockups where each row
// leads with a tinted media tile. Until real cover art is seeded we lean on a
// typographic mark so the feed still reads as multi-format at a glance.
const KIND_GLYPH: Record<ContentKind, string> = {
  article: "✎",
  episode: "▷",
  video: "▶",
};

export function ContentCard({ item }: { item: ContentCardModel }) {
  const { theme } = useAppTheme();

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
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.tile,
            { borderRadius: theme.radii.md, backgroundColor: tileColor },
          ]}
        >
          <Text style={[styles.glyph, { color: theme.colors.accent }]}>
            {KIND_GLYPH[item.kind]}
          </Text>
          {item.isPremium ? (
            <View
              style={[styles.premiumBadge, { backgroundColor: theme.colors.accent }]}
            >
              <Text style={styles.premiumStar}>★</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={[styles.kicker, { color: theme.colors.accent }]}>
            {item.kindLabel}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.title, { color: theme.colors.heading }]}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.summary, { color: theme.colors.text }]}
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
  card: {
    flexDirection: "row",
    gap: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: { opacity: 0.85 },
  tile: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  glyph: { fontSize: 26, fontWeight: "700" },
  premiumBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumStar: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  body: { flex: 1, gap: 4, justifyContent: "center" },
  kicker: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: { fontSize: 17, fontWeight: "700", lineHeight: 22 },
  summary: { fontSize: 14, lineHeight: 19 },
  meta: { fontSize: 12, marginTop: 2 },
});
