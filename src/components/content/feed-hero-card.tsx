import { Link } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { KIND_GLYPH, PREMIUM_ON_FILL } from "../../features/content/card-presentation";
import { HapticsService } from "../../features/haptics/haptics";
import type { ContentCardModel } from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * The lead "À la une" item, rendered as the full-bleed dark editorial hero from
 * the mockup: a media band (cover image or an atmospheric accent-glow fallback)
 * over an inverted ink surface carrying the kicker, italic-serif title, and a
 * format chip + meta. Colours invert correctly on the dark `midnight` palette.
 */
export function FeedHeroCard({
  item,
  kicker,
  meta,
}: {
  item: ContentCardModel;
  kicker: string;
  meta: string;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  // On light palettes the hero is the dark ink block with light text; on a dark
  // palette we lift it off the canvas with the muted surface and dark text.
  const heroBg = theme.isDark ? theme.colors.canvasAccent : theme.colors.heading;
  const onHero = theme.isDark ? theme.colors.heading : theme.colors.canvas;
  const accentTone = item.isPremium ? theme.colors.premium : theme.colors.accent;
  const onAccentTone = item.isPremium ? PREMIUM_ON_FILL : theme.colors.accentContrast;
  const mediaHeight = 150 * scaleSpace;

  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        onPress={() => void HapticsService.light()}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        <View
          style={[
            styles.card,
            {
              borderRadius: theme.radii.xl,
              backgroundColor: heroBg,
              shadowColor: theme.colors.heading,
            },
          ]}
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
                  { backgroundColor: accentTone, opacity: theme.isDark ? 0.3 : 0.22 },
                ]}
              />
              <Text style={[styles.watermark, { color: onHero, fontSize: 72 * scaleFont }]}>
                {KIND_GLYPH[item.kind]}
              </Text>
            </>
          )}

          {item.isPremium ? (
            <View style={[styles.premiumTag, { backgroundColor: theme.colors.premium }]}>
              <Text style={[styles.premiumTagText, { color: PREMIUM_ON_FILL }]}>
                ★ Premium
              </Text>
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.body,
            { padding: theme.spacing.lg * scaleSpace, gap: theme.spacing.sm * scaleSpace },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[styles.kicker, { color: accentTone, fontSize: 11 * scaleFont }]}
          >
            {kicker}
          </Text>
          <Text
            numberOfLines={3}
            style={[
              styles.title,
              { color: onHero, fontSize: 25 * scaleFont, lineHeight: 29 * scaleFont },
            ]}
          >
            {item.title}
          </Text>

          {meta ? (
            <View style={[styles.metaRow, { gap: theme.spacing.sm * scaleSpace }]}>
              <View style={[styles.play, { backgroundColor: accentTone }]}>
                <Text style={[styles.playGlyph, { color: onAccentTone }]}>
                  {KIND_GLYPH[item.kind]}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[styles.meta, { color: onHero, fontSize: 10 * scaleFont }]}
              >
                {meta}
              </Text>
            </View>
          ) : null}
        </View>
       </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressable: {},
  card: {
    overflow: "hidden",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6,
  },
  pressed: { opacity: 0.94 },
  media: { width: "100%", position: "relative", overflow: "hidden" },
  cover: { width: "100%", height: "100%" },
  glow: {
    position: "absolute",
    right: -50,
    top: -60,
    width: 220,
    height: 220,
    borderRadius: 999,
  },
  watermark: {
    position: "absolute",
    right: 18,
    bottom: 6,
    opacity: 0.16,
    fontWeight: "700",
  },
  premiumTag: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  premiumTagText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  body: {},
  kicker: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  title: { fontFamily: fontFamilies.displayBoldItalic, letterSpacing: -0.3 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  play: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  playGlyph: { fontSize: 10, fontWeight: "700" },
  meta: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.72,
    flexShrink: 1,
  },
});
