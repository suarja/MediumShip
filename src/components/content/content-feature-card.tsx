import type { ReactNode } from "react";
import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { KIND_GLYPH, PREMIUM_ON_FILL } from "../../features/content/card-presentation";
import type { ContentCardModel } from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * Social-feed style discovery card: a media band over a surface body with an
 * optional inline action row. Instagram/Facebook reference — prominent artwork,
 * comfortable title stack, room for like / save / overflow controls.
 */
export function ContentFeatureCard({
  item,
  kicker,
  meta,
  divider = true,
  actions,
}: {
  item: ContentCardModel;
  kicker: string;
  meta: string;
  divider?: boolean;
  actions?: ReactNode;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const accentTone = item.isPremium ? theme.colors.premium : theme.colors.accent;
  const mediaHeight = 168 * scaleSpace;

  return (
    <View
      testID="content-card-feature"
      style={[
        styles.card,
        {
          marginTop: divider ? theme.spacing.md * scaleSpace : 0,
          paddingTop: divider ? theme.spacing.md * scaleSpace : 0,
          borderTopWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.surface,
          {
            borderRadius: theme.radii.lg,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            shadowColor: theme.colors.heading,
          },
        ]}
      >
        <Link href={item.href as never} asChild>
          <Pressable
            accessibilityRole="link"
            style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
          >
            <View style={[styles.media, { height: mediaHeight }]}>
              {item.coverImageUrl ? (
                <Image
                  accessibilityLabel={`${item.title} cover`}
                  source={{ uri: item.coverImageUrl }}
                  style={styles.cover}
                />
              ) : (
                <>
                  <View
                    style={[
                      styles.glow,
                      {
                        backgroundColor: accentTone,
                        opacity: theme.isDark ? 0.28 : 0.18,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.watermark,
                      { color: theme.colors.heading, fontSize: 56 * scaleFont },
                    ]}
                  >
                    {KIND_GLYPH[item.kind]}
                  </Text>
                </>
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
                styles.body,
                {
                  paddingHorizontal: theme.spacing.md * scaleSpace,
                  paddingTop: theme.spacing.md * scaleSpace,
                  paddingBottom: actions ? 0 : theme.spacing.md * scaleSpace,
                  gap: theme.spacing.xs * scaleSpace,
                },
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
                numberOfLines={3}
                style={[
                  styles.title,
                  {
                    color: theme.colors.heading,
                    fontSize: 20 * scaleFont,
                    lineHeight: 24 * scaleFont,
                  },
                ]}
              >
                {item.title}
              </Text>
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
          </Pressable>
        </Link>

        {actions ? (
          <View
            testID="content-card-actions"
            style={[
              styles.actions,
              {
                borderTopColor: withAlpha(theme.colors.border, 0.8),
                paddingHorizontal: theme.spacing.sm * scaleSpace,
                paddingVertical: theme.spacing.sm * scaleSpace,
                gap: theme.spacing.xs * scaleSpace,
              },
            ]}
          >
            {actions}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  surface: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  pressable: {},
  pressed: { opacity: 0.94 },
  media: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  cover: { width: "100%", height: "100%" },
  glow: {
    position: "absolute",
    right: -40,
    top: -50,
    width: 180,
    height: 180,
    borderRadius: 999,
  },
  watermark: {
    position: "absolute",
    right: 16,
    bottom: 8,
    opacity: 0.14,
    fontWeight: "700",
  },
  premiumBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumStar: { fontSize: 10, fontWeight: "700" },
  body: {},
  kicker: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
  meta: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
