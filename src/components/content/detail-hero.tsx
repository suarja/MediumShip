import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { PREMIUM_ON_FILL } from "../../features/content/card-presentation";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * Full-bleed detail cover from the mockups: either the content's cover image or
 * an atmospheric accent-glow fallback with a faint format watermark. Optional
 * overlays (premium tag, duration pill, centred play glyph) cover the
 * article / episode / video variants. Inverts correctly on the dark palette.
 */
export function DetailHero({
  coverImageUrl,
  watermarkGlyph,
  height,
  premiumLabel,
  durationLabel,
  playGlyph,
  mediaKey,
}: {
  coverImageUrl?: string;
  watermarkGlyph: string;
  height: number;
  premiumLabel?: string;
  durationLabel?: string;
  playGlyph?: string;
  mediaKey?: string;
}) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const [imageFailed, setImageFailed] = useState(false);

  const heroBg = theme.isDark ? theme.colors.canvasAccent : theme.colors.heading;
  const onHero = theme.isDark ? theme.colors.heading : theme.colors.canvas;
  const canRenderImage = Boolean(coverImageUrl) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [coverImageUrl, mediaKey]);

  return (
    <View style={[styles.hero, { height, backgroundColor: heroBg }]}>
      {canRenderImage ? (
        <Image
          accessibilityLabel="cover"
          key={mediaKey ? `${mediaKey}:${coverImageUrl}` : coverImageUrl}
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={{ uri: coverImageUrl, cache: "reload" }}
          style={styles.cover}
        />
      ) : (
        <>
          <View
            style={[
              styles.glow,
              { backgroundColor: theme.colors.accent, opacity: theme.isDark ? 0.3 : 0.22 },
            ]}
          />
          <Text style={[styles.watermark, { color: onHero, fontSize: 96 * scaleFont }]}>
            {watermarkGlyph}
          </Text>
        </>
      )}

      {playGlyph ? (
        <View style={styles.playWrap} pointerEvents="none">
          <View style={styles.play}>
            <Text style={styles.playGlyph}>{playGlyph}</Text>
          </View>
        </View>
      ) : null}

      {premiumLabel ? (
        <View style={[styles.premium, { backgroundColor: theme.colors.premium }]}>
          <Text style={[styles.premiumText, { color: PREMIUM_ON_FILL }]}>★ {premiumLabel}</Text>
        </View>
      ) : null}

      {durationLabel ? (
        <View style={styles.duration}>
          <Text style={styles.durationText}>{durationLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", position: "relative", overflow: "hidden" },
  cover: { width: "100%", height: "100%" },
  glow: {
    position: "absolute",
    right: -60,
    top: -70,
    width: 260,
    height: 260,
    borderRadius: 999,
  },
  watermark: {
    position: "absolute",
    right: 20,
    bottom: 8,
    opacity: 0.16,
    fontWeight: "700",
  },
  playWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  play: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "rgba(244, 241, 232, 0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  playGlyph: { color: "#14110E", fontSize: 20, marginLeft: 3 },
  premium: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  premiumText: {
    fontFamily: fontFamilies.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  duration: {
    position: "absolute",
    right: 12,
    bottom: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  durationText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "#FFFFFF",
  },
});
