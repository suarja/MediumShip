import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useQuery } from "convex/react";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import * as WebBrowser from "expo-web-browser";
import { VideoView } from "expo-video";
import { useTranslation } from "react-i18next";

import { api } from "../../convex/_generated/api";
import { ContentDetailShell } from "../../src/components/content/content-detail-shell";
import { DetailHeader } from "../../src/components/content/detail-header";
import { DetailHero } from "../../src/components/content/detail-hero";
import { PremiumPaywall } from "../../src/components/content/premium-paywall";
import {
  PauseGlyph,
  PlayGlyph,
  ReplayGlyph,
  SkipGlyph,
} from "../../src/components/media/player-icons";
import {
  getContentCoverImageUrl,
  getYoutubeLaunchUrl,
  getYoutubeVideoId,
} from "../../src/features/content/selectors";
import type { ContentDoc } from "../../src/features/content/types";
import { useDownloads } from "../../src/features/downloads/use-downloads";
import { resolvePremiumGate } from "../../src/features/membership/premium-gate";
import { useIsMember } from "../../src/features/membership/use-is-member";
import { HapticsService } from "../../src/features/haptics/haptics";
import { formatMediaClock } from "../../src/features/media/format-media-clock";
import { usePersistentMediaPlayer } from "../../src/features/media/persistent-media-player";
import { YoutubePlayerSlot } from "../../src/features/media/youtube-player-layout-context";
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
    closePlayer,
    currentTimeSeconds,
    durationSeconds,
    hasFinished,
    isPlaying,
    playEpisode,
    playHostedVideo,
    playYoutubeVideo,
    seekBy,
    seekTo,
    togglePlayback,
    videoPlayer,
  } = usePersistentMediaPlayer();
  const hostedVideoRef = useRef<VideoView>(null);
  const [progressTrackWidth, setProgressTrackWidth] = useState(0);
  const [scrubPreviewTime, setScrubPreviewTime] = useState<number | null>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // Set when the user explicitly closes (×): clearing the session would
  // otherwise re-trigger the autoplay effect below and resume playback while we
  // navigate away.
  const isClosingRef = useRef(false);

  const { isMember } = useIsMember();

  const content = useQuery(
    api.content.queries.getPublishedById,
    id ? { id: id as never } : "skip",
  ) as ContentDoc | null | undefined;
  const { downloadedItem } = useDownloads({ contentId: id, enabled: isMember });
  const resolvedContent = content ?? downloadedItem?.content ?? null;
  const coverImageUrl =
    downloadedItem?.localCoverImagePath ??
    (resolvedContent ? getContentCoverImageUrl(resolvedContent) : undefined);
  const isLocked = resolvedContent
    ? resolvePremiumGate({ isPremium: resolvedContent.isPremium, isMember }) === "locked"
    : false;

  useEffect(() => {
    if (!resolvedContent || isClosingRef.current) {
      return;
    }

    // Members play premium media in-place; non-members are bounced to the detail
    // screen, which renders the themed paywall.
    if (isLocked) {
      router.replace(
        (resolvedContent.kind === "video"
          ? `/video/${resolvedContent._id}`
          : `/episode/${resolvedContent._id}`) as never,
      );
      return;
    }

    if (resolvedContent.kind === "episode") {
      const audioUrl = downloadedItem?.localMediaPath ?? resolvedContent.audioUrl;

      if (!audioUrl) {
        return;
      }

      // Compare by content only: once a session is live for this content we
      // must NOT relaunch it (which would reset the position to 0) just because
      // the URL representation differs — e.g. returning to the player resolves a
      // local downloaded path while the session launched from the remote one.
      const isSameSession =
        activeSession?.kind === "episode" &&
        activeSession.contentId === resolvedContent._id;

      if (!isSameSession) {
        void playEpisode({
          contentId: resolvedContent._id,
          title: resolvedContent.title,
          audioUrl,
          artworkUrl: coverImageUrl,
          durationSeconds: resolvedContent.durationSeconds,
        });
      }

      return;
    }

    if (resolvedContent.kind === "video") {
      if (resolvedContent.videoSource?.kind === "youtube") {
        const youtubeVideoId = getYoutubeVideoId(resolvedContent.videoSource);
        if (!youtubeVideoId) {
          return;
        }

        const isSameSession =
          activeSession?.kind === "youtube" &&
          activeSession.contentId === resolvedContent._id;

        if (!isSameSession) {
          void playYoutubeVideo({
            contentId: resolvedContent._id,
            title: resolvedContent.title,
            youtubeVideoId,
            artworkUrl: coverImageUrl,
            durationSeconds: resolvedContent.durationSeconds,
          });
        }

        return;
      }

      const playbackUrl =
        downloadedItem?.localMediaPath ??
        (resolvedContent.videoSource?.kind === "hosted"
          ? resolvedContent.videoSource.playbackUrl
          : null);

      if (!playbackUrl) {
        return;
      }

      // Compare by content only (see the episode branch): returning to the
      // player must not relaunch the video and reset it to 0 just because a
      // downloaded local path now differs from the URL the session launched with.
      const isSameSession =
        activeSession?.kind === "hostedVideo" &&
        activeSession.contentId === resolvedContent._id;

      if (!isSameSession) {
        void playHostedVideo({
          contentId: resolvedContent._id,
          title: resolvedContent.title,
          playbackUrl,
          artworkUrl: coverImageUrl,
          durationSeconds: resolvedContent.durationSeconds,
        });
      }
    }
  }, [
    activeSession,
    coverImageUrl,
    downloadedItem?.localMediaPath,
    isLocked,
    playEpisode,
    playHostedVideo,
    playYoutubeVideo,
    resolvedContent,
    router,
  ]);

  const isYoutubeVideo =
    resolvedContent?.kind === "video" &&
    resolvedContent.videoSource?.kind === "youtube";
  const isHostedVideo =
    resolvedContent?.kind === "video" &&
    (resolvedContent.videoSource?.kind === "hosted" || Boolean(downloadedItem?.localMediaPath));
  // Fullscreen is driven purely by the screen's own dimensions: while on the
  // player screen orientation is unlocked, so a physical rotation rotates the
  // screen and flips this — landscape => fullscreen video, portrait => normal.
  // This makes "rotate back to portrait exits fullscreen" reliable, unlike the
  // native fullscreen modal which would not report the reverse rotation.
  const isLandscapeVideo = isHostedVideo && windowWidth > windowHeight;

  // PiP is started/cancelled by the provider based on the active route, and the
  // provider also re-asserts the play state after cancelling, so returning here
  // both drops PiP and keeps a playing video playing.

  // Keep the app portrait everywhere, but unlock rotation while the player is
  // focused so the device can drive the fullscreen flip above. Portrait is
  // re-locked on leave.
  useFocusEffect(
    useCallback(() => {
      if (!isHostedVideo) {
        return;
      }

      void ScreenOrientation.unlockAsync().catch(() => {});
      return () => {
        void ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        ).catch(() => {});
      };
    }, [isHostedVideo]),
  );

  const state =
    resolvedContent &&
    (resolvedContent.kind === "episode"
      ? Boolean(downloadedItem?.localMediaPath || resolvedContent.audioUrl)
      : resolvedContent.kind === "video"
        ? Boolean(
            downloadedItem?.localMediaPath ||
              resolvedContent.videoSource?.kind === "hosted" ||
              resolvedContent.videoSource?.kind === "youtube",
          )
        : false)
      ? "ready"
      : content === undefined && networkState === "offline"
        ? "offline"
      : content === undefined
          ? "loading"
          : "notFound";

  if (state !== "ready" || !resolvedContent) {
    return (
      <ContentDetailShell
        state={state}
        networkState={networkState}
        backLabel={resolvedContent?.kind === "video" ? tVideo("back") : tEpisode("back")}
        loadingLabel={resolvedContent?.kind === "video" ? tVideo("loading") : tEpisode("loading")}
        offlineTitle={
          resolvedContent?.kind === "video"
            ? tVideo("offlineTitle")
            : tEpisode("offlineTitle")
        }
        offlineBody={
          resolvedContent?.kind === "video" ? tVideo("offlineBody") : tEpisode("offlineBody")
        }
        notFoundTitle={
          resolvedContent?.kind === "video"
            ? tVideo("notFoundTitle")
            : tEpisode("notFoundTitle")
        }
        notFoundBody={
          resolvedContent?.kind === "video"
            ? tVideo("notFoundBody")
            : tEpisode("notFoundBody")
        }
      />
    );
  }

  if (isLocked) {
    return (
      <ContentDetailShell
        state="ready"
        networkState={networkState}
        backLabel={resolvedContent.kind === "video" ? tVideo("back") : tEpisode("back")}
        loadingLabel={resolvedContent.kind === "video" ? tVideo("loading") : tEpisode("loading")}
        offlineTitle={
          resolvedContent.kind === "video" ? tVideo("offlineTitle") : tEpisode("offlineTitle")
        }
        offlineBody={
          resolvedContent.kind === "video" ? tVideo("offlineBody") : tEpisode("offlineBody")
        }
        notFoundTitle={
          resolvedContent.kind === "video" ? tVideo("notFoundTitle") : tEpisode("notFoundTitle")
        }
        notFoundBody={
          resolvedContent.kind === "video" ? tVideo("notFoundBody") : tEpisode("notFoundBody")
        }
        hero={
          <DetailHero
            key={resolvedContent._id}
            coverImageUrl={coverImageUrl}
            mediaKey={resolvedContent._id}
            watermarkGlyph={resolvedContent.kind === "video" ? "▶" : "▷"}
            height={resolvedContent.kind === "video" ? 200 * scaleSpace : 210 * scaleSpace}
            playGlyph={resolvedContent.kind === "video" ? "▶" : undefined}
            premiumLabel={
              resolvedContent.kind === "video"
                ? tVideo("premiumTag")
                : tEpisode("premiumTag")
            }
          />
        }
      >
        <DetailHeader
          kicker={
            resolvedContent.category ||
            (resolvedContent.kind === "video" ? tVideo("kicker") : tEpisode("kicker"))
          }
          title={resolvedContent.title}
          meta={
            resolvedContent.kind === "episode"
              ? resolvedContent.durationSeconds
                ? tEpisode("duration", {
                    minutes: Math.round(resolvedContent.durationSeconds / 60),
                  })
                : undefined
              : tVideo("providerLabel", { provider: tVideo("hostedProvider") })
          }
          lede={resolvedContent.summary}
          premium
        />
        <PremiumPaywall
          title={
            resolvedContent.kind === "video"
              ? tVideo("premiumTitle")
              : tEpisode("premiumTitle")
          }
          description={
            resolvedContent.kind === "video"
              ? tVideo("premiumBody")
              : tEpisode("premiumBody")
          }
          ctaLabel={
            resolvedContent.kind === "video" ? tVideo("premiumCta") : tEpisode("premiumCta")
          }
        />
      </ContentDetailShell>
    );
  }

  const title = resolvedContent.title;
  const subtitle =
    resolvedContent.kind === "episode"
      ? `${resolvedContent.category || tEpisode("kicker")} · ${tEpisode("playerLabel")}`
      : isYoutubeVideo
        ? tVideo("providerLabel", { provider: tVideo("youtubeProvider") })
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

  // Landscape rotation => full-bleed video with its native controls. Rotating
  // back to portrait drops out of this branch automatically (dimensions flip).
  if (isLandscapeVideo) {
    return (
      <View
        style={[styles.fullscreen, { backgroundColor: theme.colors.heading }]}
        testID="player-screen-fullscreen"
      >
        <Stack.Screen options={{ gestureEnabled: false }} />
        {videoPlayer ? (
          <VideoView
            allowsPictureInPicture
            contentFit="contain"
            nativeControls
            player={videoPlayer}
            ref={hostedVideoRef}
            startsPictureInPictureAutomatically
            style={StyleSheet.absoluteFill}
          />
        ) : null}
      </View>
    );
  }

  const getScrubTime = (locationX: number) => {
    if (durationSeconds <= 0) {
      return 0;
    }

    return getScrubTimeFromPress(locationX, progressTrackWidth, durationSeconds);
  };

  const commitScrub = async (locationX: number) => {
    const nextTime = getScrubTime(locationX);
    void HapticsService.selection();
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
          onPress={() => {
            void HapticsService.selection();
            router.back();
          }}
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
          {resolvedContent.kind === "episode" ? "LECTURE EN COURS" : "VIDEO EN COURS"}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void HapticsService.light();
            // Close (×) ends the session — no Picture-in-Picture. (↓ minimises:
            // it just navigates back, so a playing video floats into PiP.) The
            // closing flag stops the autoplay effect from resuming playback when
            // the session is cleared while this screen is still mounted.
            isClosingRef.current = true;
            closePlayer();
            router.back();
          }}
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
        {resolvedContent.kind === "episode" ? (
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
        ) : isYoutubeVideo ? (
          <YoutubePlayerSlot
            style={[
              styles.videoSurface,
              {
                borderRadius: 18,
                borderColor: withAlpha(fg, 0.12),
              },
            ]}
            testID="player-screen-youtube"
          />
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
                startsPictureInPictureAutomatically
                style={styles.videoView}
              />
            ) : null}
          </View>
        )}

        {resolvedContent.kind === "video" ? (
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
          {resolvedContent.summary}
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
            onPress={() => {
              void HapticsService.selection();
              void seekBy(-15);
            }}
            style={({ pressed }) => [styles.secondaryControl, pressed && styles.controlPressed]}
          >
            <SkipGlyph color={withAlpha(fg, 0.82)} direction="back" seconds={15} size={30} />
          </Pressable>
          <Pressable
            accessibilityLabel={playLabel}
            accessibilityRole="button"
            onPress={() => {
              void HapticsService.medium();
              void togglePlayback();
            }}
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
            onPress={() => {
              void HapticsService.selection();
              void seekBy(30);
            }}
            style={({ pressed }) => [styles.secondaryControl, pressed && styles.controlPressed]}
          >
            <SkipGlyph color={withAlpha(fg, 0.82)} direction="forward" seconds={30} size={30} />
          </Pressable>
        </View>

        {resolvedContent.kind === "video" && isHostedVideo && videoPlayer ? (
          <Text
            style={[styles.rotateHint, { color: withAlpha(fg, 0.5) }]}
          >
            {tVideo("rotateForFullscreen")}
          </Text>
        ) : null}

        {isYoutubeVideo ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void HapticsService.light();
                const launchUrl =
                  resolvedContent.videoSource?.kind === "youtube"
                    ? getYoutubeLaunchUrl(resolvedContent.videoSource)
                    : undefined;
                if (launchUrl) {
                  void WebBrowser.openBrowserAsync(launchUrl);
                }
              }}
              style={({ pressed }) => [
                styles.externalLink,
                {
                  backgroundColor: withAlpha(fg, 0.08),
                  borderRadius: theme.radii.pill,
                },
                pressed && styles.controlPressed,
              ]}
            >
              <Text
                style={[
                  styles.externalLinkText,
                  { color: fg, fontSize: 13 * scaleFont },
                ]}
              >
                {tVideo("openExternal")}
              </Text>
            </Pressable>
            <Text style={[styles.rotateHint, { color: withAlpha(fg, 0.5) }]}>
              {tVideo("youtubeBackgroundNote")}
            </Text>
          </>
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
  fullscreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rotateHint: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: 8,
    textAlign: "center",
  },
  externalLink: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  externalLinkText: {
    fontFamily: fontFamilies.bodySemiBold,
  },
});
