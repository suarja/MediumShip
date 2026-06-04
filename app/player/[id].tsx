import { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useQuery } from "convex/react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { VideoView } from "expo-video";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { MemberGateCard } from "../../src/components/auth/member-gate-card";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import { DetailHeader } from "../../src/components/content/detail-header";
import { DetailHero } from "../../src/components/content/detail-hero";
import {
  PauseGlyph,
  PlayGlyph,
  ReplayGlyph,
  SkipGlyph,
} from "../../src/components/media/player-icons";
import { getContentCoverImageUrl } from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
import { formatMediaClock } from "../../src/features/media/format-media-clock";
import { usePersistentMediaPlayer } from "../../src/features/media/persistent-media-player";
import { getScrubTimeFromPress } from "../../src/features/media/scrubbing";
import { useNetworkStatus } from "../../src/features/network/use-network-status";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t: tEpisode } = useTranslation("episode");
  const { t: tVideo } = useTranslation("video");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const { state: networkState } = useNetworkStatus();
  const {
    activeSession,
    currentTimeSeconds,
    durationSeconds,
    hasFinished,
    isPlaying,
    playEpisode,
    playHostedVideo,
    seekBy,
    seekTo,
    togglePlayback,
    videoPlayer,
  } = usePersistentMediaPlayer();
  const hostedVideoRef = useRef<VideoView>(null);
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);

  const content = useQuery(
    api.content.queries.getPublishedById,
    id ? { id: id as never } : "skip",
  ) as ContentDoc | null | undefined;
  const coverImageUrl = content ? getContentCoverImageUrl(content) : undefined;

  useEffect(() => {
    if (!content) {
      return;
    }

    if (content.isPremium) {
      router.replace(
        (content.kind === "video"
          ? `/video/${content._id}`
          : `/episode/${content._id}`) as never,
      );
      return;
    }

    if (content.kind === "episode" && content.audioUrl) {
      const isSameSession =
        activeSession?.kind === "episode" &&
        activeSession.contentId === content._id &&
        activeSession.audioUrl === content.audioUrl;

      if (!isSameSession) {
        void playEpisode({
          contentId: content._id,
          title: content.title,
          audioUrl: content.audioUrl,
          artworkUrl: coverImageUrl,
          durationSeconds: content.durationSeconds,
        });
      }

      return;
    }

    if (content.kind === "video" && content.videoSource?.kind === "hosted") {
      const isSameSession =
        activeSession?.kind === "hostedVideo" &&
        activeSession.contentId === content._id &&
        activeSession.playbackUrl === content.videoSource.playbackUrl;

      if (!isSameSession) {
        void playHostedVideo({
          contentId: content._id,
          title: content.title,
          playbackUrl: content.videoSource.playbackUrl,
          artworkUrl: coverImageUrl,
          durationSeconds: content.durationSeconds,
        });
      }
    }
  }, [activeSession, content, coverImageUrl, playEpisode, playHostedVideo, router]);

  const state =
    content &&
    (content.kind === "episode"
      ? Boolean(content.audioUrl)
      : content.kind === "video"
        ? content.videoSource?.kind === "hosted"
        : false)
      ? "ready"
      : content === undefined && networkState === "offline"
        ? "offline"
        : content === undefined
          ? "loading"
          : "notFound";

  if (state !== "ready" || !content) {
    return (
      <ContentDetailShell
        state={state}
        networkState={networkState}
        backLabel={content?.kind === "video" ? tVideo("back") : tEpisode("back")}
        loadingLabel={content?.kind === "video" ? tVideo("loading") : tEpisode("loading")}
        offlineTitle={
          content?.kind === "video"
            ? tVideo("offlineTitle")
            : tEpisode("offlineTitle")
        }
        offlineBody={
          content?.kind === "video" ? tVideo("offlineBody") : tEpisode("offlineBody")
        }
        notFoundTitle={
          content?.kind === "video"
            ? tVideo("notFoundTitle")
            : tEpisode("notFoundTitle")
        }
        notFoundBody={
          content?.kind === "video"
            ? tVideo("notFoundBody")
            : tEpisode("notFoundBody")
        }
      />
    );
  }

  if (content.isPremium) {
    return (
      <ContentDetailShell
        state="ready"
        networkState={networkState}
        backLabel={content.kind === "video" ? tVideo("back") : tEpisode("back")}
        loadingLabel={content.kind === "video" ? tVideo("loading") : tEpisode("loading")}
        offlineTitle={
          content.kind === "video" ? tVideo("offlineTitle") : tEpisode("offlineTitle")
        }
        offlineBody={
          content.kind === "video" ? tVideo("offlineBody") : tEpisode("offlineBody")
        }
        notFoundTitle={
          content.kind === "video" ? tVideo("notFoundTitle") : tEpisode("notFoundTitle")
        }
        notFoundBody={
          content.kind === "video" ? tVideo("notFoundBody") : tEpisode("notFoundBody")
        }
        hero={
          <DetailHero
            key={content._id}
            coverImageUrl={coverImageUrl}
            mediaKey={content._id}
            watermarkGlyph={content.kind === "video" ? "▶" : "▷"}
            height={content.kind === "video" ? 200 * scaleSpace : 210 * scaleSpace}
            playGlyph={content.kind === "video" ? "▶" : undefined}
            premiumLabel={
              content.kind === "video"
                ? tVideo("premiumTag")
                : tEpisode("premiumTag")
            }
          />
        }
      >
        <DetailHeader
          kicker={
            content.category ||
            (content.kind === "video" ? tVideo("kicker") : tEpisode("kicker"))
          }
          title={content.title}
          meta={
            content.kind === "episode"
              ? content.durationSeconds
                ? tEpisode("duration", {
                    minutes: Math.round(content.durationSeconds / 60),
                  })
                : undefined
              : tVideo("providerLabel", { provider: tVideo("hostedProvider") })
          }
          lede={content.summary}
          premium
        />
        <MemberGateCard
          title={
            content.kind === "video"
              ? tVideo("premiumTitle")
              : tEpisode("premiumTitle")
          }
          description={
            content.kind === "video"
              ? tVideo("premiumBody")
              : tEpisode("premiumBody")
          }
          ctaLabel={
            content.kind === "video" ? tVideo("premiumCta") : tEpisode("premiumCta")
          }
        />
      </ContentDetailShell>
    );
  }

  const title = content.title;
  const subtitle =
    content.kind === "episode"
      ? `${content.category || tEpisode("kicker")} · ${tEpisode("playerLabel")}`
      : tVideo("providerLabel", { provider: tVideo("hostedProvider") });
  const playLabel = hasFinished
    ? tEpisode("replay")
    : isPlaying
      ? tEpisode("pause")
      : tEpisode("play");
  const displayedCurrentTime =
    scrubPreviewTime === null ? currentTimeSeconds : scrubPreviewTime;
  const displayedProgressRatio =
    durationSeconds > 0 ? Math.min(displayedCurrentTime / durationSeconds, 1) : 0;

  // The player is a fixed dark surface (heading background); the contrasting
  // foreground is the palette's canvas color, which moves opposite to heading
  // across every palette (including midnight).
  const fg = theme.colors.canvas;

  const getScrubTime = (locationX: number) => {
    if (durationSeconds <= 0) {
      return 0;
    }

    return getScrubTimeFromPress(locationX, progressTrackWidth, durationSeconds);
  };

  const commitScrub = async (locationX: number) => {
    const nextTime = getScrubTime(locationX);
    setScrubPreviewTime(nextTime);
    await seekTo(nextTime);
    setScrubPreviewTime(null);
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safe, { backgroundColor: theme.colors.heading }]}
    >
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View
        style={[
          styles.topBar,
          { paddingHorizontal: theme.spacing.lg * scaleSpace },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.topAction}
        >
          <Text style={[styles.topActionText, { color: fg }]}>↓</Text>
        </Pressable>
        <Text
          style={[
            styles.topLabel,
            { fontSize: 10 * scaleFont, color: withAlpha(fg, 0.56) },
          ]}
        >
          {content.kind === "episode" ? "LECTURE EN COURS" : "VIDEO EN COURS"}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.topAction}
        >
          <Text style={[styles.topActionText, { color: fg }]}>×</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.body,
          {
            paddingHorizontal: theme.spacing.xl * scaleSpace,
            paddingBottom: theme.spacing.xl * scaleSpace,
          },
        ]}
      >
        {content.kind === "episode" ? (
          <>
            <View
              style={[
                styles.audioArtwork,
                {
                  borderRadius: 18,
                  backgroundColor: theme.colors.canvasAccent,
                  borderColor: withAlpha(fg, 0.12),
                },
              ]}
              testID="player-screen-audio"
            >
              {coverImageUrl ? (
                <Image source={{ uri: coverImageUrl }} style={styles.coverImage} />
              ) : (
                <View
                  style={[
                    styles.audioArtworkFallback,
                    { backgroundColor: theme.colors.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.audioArtworkFallbackGlyph,
                      { color: theme.colors.accentContrast },
                    ]}
                  >
                    ▷
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.audioHeader}>
              <Text
                style={[
                  styles.subtitle,
                  { fontSize: 10 * scaleFont, color: withAlpha(fg, 0.56) },
                ]}
              >
                {subtitle}
              </Text>
              <Text
                style={[
                  styles.title,
                  styles.audioTitle,
                  { fontSize: 27 * scaleFont, color: fg },
                ]}
              >
                {title}
              </Text>
            </View>
          </>
        ) : (
          <View
            style={[
              styles.videoSurface,
              {
                borderRadius: 18,
                borderColor: withAlpha(fg, 0.12),
              },
            ]}
            testID="player-screen-video"
          >
            {videoPlayer ? (
              <VideoView
                allowsPictureInPicture
                contentFit="cover"
                nativeControls
                player={videoPlayer}
                ref={hostedVideoRef}
                style={styles.videoView}
              />
            ) : null}
          </View>
        )}

        {content.kind === "video" ? (
          <>
            <Text
              style={[
                styles.subtitle,
                { fontSize: 10 * scaleFont, color: withAlpha(fg, 0.56) },
              ]}
            >
              {subtitle}
            </Text>
            <Text
              style={[
                styles.title,
                { fontSize: 27 * scaleFont, color: fg },
              ]}
            >
              {title}
            </Text>
          </>
        ) : null}
        <Text
          style={[
            styles.summary,
            { fontSize: 13 * scaleFont, color: withAlpha(fg, 0.62) },
          ]}
        >
          {content.summary}
        </Text>

        <View style={styles.progressWrap}>
          <View
            onLayout={(event) => {
              setProgressTrackWidth(event.nativeEvent.layout.width);
            }}
            onResponderGrant={(event) => {
              setScrubPreviewTime(getScrubTime(event.nativeEvent.locationX));
            }}
            onResponderMove={(event) => {
              setScrubPreviewTime(getScrubTime(event.nativeEvent.locationX));
            }}
            onResponderRelease={(event) => {
              void commitScrub(event.nativeEvent.locationX);
            }}
            onResponderTerminate={() => {
              setScrubPreviewTime(null);
            }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            style={[styles.progressTrack, { backgroundColor: withAlpha(fg, 0.12) }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    durationSeconds > 0
                      ? `${displayedProgressRatio * 100}%`
                      : "0%",
                  backgroundColor: theme.colors.accent,
                },
              ]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, { color: withAlpha(fg, 0.52) }]}>
              {formatMediaClock(displayedCurrentTime)}
            </Text>
            <Text style={[styles.timeText, { color: withAlpha(fg, 0.52) }]}>
              {formatMediaClock(durationSeconds)}
            </Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            accessibilityLabel={tEpisode("skipBack")}
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => void seekBy(-15)}
            style={({ pressed }) => [styles.secondaryControl, pressed && styles.controlPressed]}
          >
            <SkipGlyph color={withAlpha(fg, 0.82)} direction="back" seconds={15} size={30} />
          </Pressable>
          <Pressable
            accessibilityLabel={playLabel}
            accessibilityRole="button"
            onPress={() => void togglePlayback()}
            style={({ pressed }) => [
              styles.primaryControl,
              { backgroundColor: fg },
              pressed && styles.controlPressed,
            ]}
          >
            {hasFinished ? (
              <ReplayGlyph color={theme.colors.heading} size={26} />
            ) : isPlaying ? (
              <PauseGlyph color={theme.colors.heading} size={26} />
            ) : (
              <PlayGlyph color={theme.colors.heading} size={26} />
            )}
          </Pressable>
          <Pressable
            accessibilityLabel={tEpisode("skipForward")}
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => void seekBy(30)}
            style={({ pressed }) => [styles.secondaryControl, pressed && styles.controlPressed]}
          >
            <SkipGlyph color={withAlpha(fg, 0.82)} direction="forward" seconds={30} size={30} />
          </Pressable>
        </View>

        {content.kind === "video" && videoPlayer ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void hostedVideoRef.current?.startPictureInPicture()}
            style={[
              styles.videoAction,
              {
                borderColor: withAlpha(fg, 0.14),
                borderRadius: 12,
              },
            ]}
          >
            <Text style={[styles.videoActionText, { color: fg }]}>
              {tVideo("enterPictureInPicture")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    paddingTop: 4,
  },
  topAction: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  topActionText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 22,
    lineHeight: 24,
  },
  topLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  body: {
    flex: 1,
    gap: 12,
  },
  audioArtwork: {
    aspectRatio: 1,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    marginTop: 4,
    overflow: "hidden",
    width: "100%",
  },
  audioArtworkFallback: {
    alignItems: "center",
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  audioArtworkFallbackGlyph: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 42,
  },
  coverImage: {
    height: "100%",
    width: "100%",
  },
  audioHeader: {
    gap: 6,
    marginTop: 6,
    alignItems: "center",
  },
  videoSurface: {
    aspectRatio: 16 / 9,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    overflow: "hidden",
    width: "100%",
  },
  videoView: {
    height: "100%",
    width: "100%",
  },
  subtitle: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1.4,
    marginTop: 4,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.displayBold,
    lineHeight: 31,
  },
  audioTitle: {
    textAlign: "center",
  },
  summary: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  progressWrap: {
    gap: 8,
    marginTop: 6,
  },
  progressTrack: {
    borderRadius: 3,
    height: 6,
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: 3,
    height: "100%",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
  },
  controls: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  secondaryControl: {
    alignItems: "center",
    borderRadius: 10,
    justifyContent: "center",
    minWidth: 56,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  primaryControl: {
    alignItems: "center",
    justifyContent: "center",
    height: 76,
    width: 76,
    borderRadius: 38,
  },
  controlPressed: {
    opacity: 0.7,
  },
  videoAction: {
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 46,
    paddingHorizontal: 18,
  },
  videoActionText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
  },
});
