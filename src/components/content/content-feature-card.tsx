import type { ReactNode } from "react";
import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { KIND_GLYPH, PREMIUM_ON_FILL } from "../../features/content/card-presentation";
import type { ContentCardModel } from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * Compact discovery card — continuous feed rhythm (no dividers, no boxed chrome):
 * a small square thumb beside kicker / title / summary / meta, with a light
 * icon-only action row tucked underneath. Instagram/Facebook scroll reference.
 */
export function ContentFeatureCard({
  item,
  kicker,
  meta,
  actions,
}: {
  item: ContentCardModel;
  kicker: string;
  meta: string;
  /** @deprecated Feature cards never draw inter-item dividers. */
  divider?: boolean;
  actions?: ReactNode;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const accentTone = item.isPremium ? theme.colors.premium : theme.colors.accent;
  const thumb = 72 * scaleSpace;

  return (
    <View
      testID="content-card-feature"
      style={[
        styles.card,
        {
          gap: theme.spacing.xs * scaleSpace,
          paddingVertical: theme.spacing.sm * scaleSpace,
        },
      ]}
    >
      <Link href={item.href as never} asChild>
        <Pressable
          accessibilityRole="link"
          style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
        >
          <View style={[styles.row, { gap: theme.spacing.md * scaleSpace }]}>
            <View
              style={[
                styles.thumb,
                {
                  width: thumb,
                  height: thumb,
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
                <Text
                  style={[
                    styles.glyph,
                    { color: accentTone, fontSize: 24 * scaleFont },
                  ]}
                >
                  {KIND_GLYPH[item.kind]}
                </Text>
              )}
              {item.isPremium ? (
                <View
                  style={[styles.premiumBadge, { backgroundColor: theme.colors.premium }]}
                >
                  <Text style={[styles.premiumStar, { color: PREMIUM_ON_FILL }]}>★</Text>
                </View>
              ) : null}
            </View>

            <View
              style={[
                styles.copy,
                { gap: 3 * scaleSpace, paddingTop: 1 * scaleSpace },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.kicker,
                  { color: accentTone, fontSize: 10 * scaleFont },
                ]}
              >
                {kicker}
              </Text>
              <Text
                numberOfLines={2}
                style={[
                  styles.title,
                  {
                    color: theme.colors.heading,
                    fontSize: 17 * scaleFont,
                    lineHeight: 21 * scaleFont,
                  },
                ]}
              >
                {item.title}
              </Text>
              {item.summary ? (
                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={[
                    styles.summary,
                    {
                      color: theme.colors.textMuted,
                      fontSize: 13 * scaleFont,
                      lineHeight: 18 * scaleFont,
                    },
                  ]}
                >
                  {item.summary}
                </Text>
              ) : null}
              {meta ? (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.meta,
                    { color: theme.colors.textMuted, fontSize: 11 * scaleFont },
                  ]}
                >
                  {meta}
                </Text>
              ) : null}
            </View>
          </View>
        </Pressable>
      </Link>

      {actions ? (
        <View
          testID="content-card-actions"
          style={[
            styles.actions,
            {
              gap: theme.spacing.xs * scaleSpace,
              paddingLeft: thumb + theme.spacing.md * scaleSpace,
            },
          ]}
        >
          {actions}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  pressable: {},
  pressed: { opacity: 0.88 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  thumb: {
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
  copy: { flex: 1, minWidth: 0 },
  kicker: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
  summary: {
    fontFamily: fontFamilies.body,
  },
  meta: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
});
