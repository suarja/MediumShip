import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { KIND_GLYPH, PREMIUM_ON_FILL } from "../../features/content/card-presentation";
import type { ContentCardModel } from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * Dense editorial list row from the mockup: a square media tile (cover image or
 * tinted glyph fallback) beside a kicker / serif title / meta column. A hairline
 * top divider separates stacked rows; the lead row passes `divider={false}`.
 */
export function FeedRow({
  item,
  kicker,
  meta,
  divider = true,
}: {
  item: ContentCardModel;
  kicker: string;
  meta: string;
  divider?: boolean;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const tile = 60 * scaleSpace;
  const accentTone = item.isPremium ? theme.colors.premium : theme.colors.accent;

  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.row,
          {
            gap: theme.spacing.md * scaleSpace,
            paddingTop: divider ? theme.spacing.md * scaleSpace : 0,
            borderTopWidth: divider ? StyleSheet.hairlineWidth : 0,
            borderTopColor: theme.colors.border,
          },
          pressed && styles.pressed,
        ]}
      >
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
          {item.coverImageUrl ? (
            <Image
              accessibilityLabel={`${item.title} thumbnail`}
              source={{ uri: item.coverImageUrl }}
              style={styles.thumbnail}
            />
          ) : (
            <Text style={[styles.glyph, { color: accentTone, fontSize: 22 * scaleFont }]}>
              {KIND_GLYPH[item.kind]}
            </Text>
          )}
          {item.isPremium ? (
            <View style={[styles.premiumBadge, { backgroundColor: theme.colors.premium }]}>
              <Text style={[styles.premiumStar, { color: PREMIUM_ON_FILL }]}>★</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.meta}>
          <Text
            numberOfLines={1}
            style={[styles.kicker, { color: accentTone, fontSize: 10 * scaleFont }]}
          >
            {kicker}
          </Text>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              { color: theme.colors.heading, fontSize: 17 * scaleFont, lineHeight: 21 * scaleFont },
            ]}
          >
            {item.title}
          </Text>
          {meta ? (
            <Text
              numberOfLines={1}
              style={[styles.metaLabel, { color: theme.colors.textMuted, fontSize: 11 * scaleFont }]}
            >
              {meta}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  pressed: { opacity: 0.7 },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  thumbnail: { width: "100%", height: "100%" },
  glyph: { fontWeight: "700" },
  premiumBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumStar: { fontSize: 8, fontWeight: "700" },
  meta: { flex: 1, gap: 3, minWidth: 0 },
  kicker: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  title: { fontFamily: fontFamilies.display, letterSpacing: -0.2 },
  metaLabel: { fontFamily: fontFamilies.mono, letterSpacing: 0.4 },
});
