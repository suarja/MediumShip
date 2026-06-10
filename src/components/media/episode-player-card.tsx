import { Image, StyleSheet, Text, View } from "react-native";

import { KIND_GLYPH } from "../../features/content/card-presentation";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { MediaHeroPlayBando } from "./media-hero-play-bando";

type EpisodePlayerCardProps = {
  coverImageUrl?: string;
  onPlay: () => void;
  playLabel: string;
  showPlay?: boolean;
};

/**
 * Episode detail hero — same layout pattern as hosted video: cover tile with the
 * play affordance in the bottom bando, not a separate full-width CTA below.
 */
export function EpisodePlayerCard({
  coverImageUrl,
  onPlay,
  playLabel,
  showPlay = true,
}: EpisodePlayerCardProps) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.media,
          { backgroundColor: theme.colors.accentSoft },
        ]}
      >
        {coverImageUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="cover"
            source={{ uri: coverImageUrl }}
            style={styles.coverImage}
          />
        ) : (
          <Text
            style={[
              styles.fallbackGlyph,
              { color: theme.colors.accent, fontSize: 72 * scaleFont },
            ]}
          >
            {KIND_GLYPH.episode}
          </Text>
        )}
      </View>

      {showPlay ? (
        <MediaHeroPlayBando
          accessibilityLabel={playLabel}
          onPress={onPlay}
          testID="episode-play-button"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  media: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  fallbackGlyph: {
    fontFamily: fontFamilies.display,
    opacity: 0.72,
  },
});
