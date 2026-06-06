import { PropsWithChildren, ReactNode, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Link } from "expo-router";

import { StatusBannerStack } from "./status-banner-stack";
import { OVER_MEDIA } from "../../features/content/card-presentation";
import { usePersistentMediaPlayerSpace } from "../../features/media/persistent-media-player";
import type { NetworkState } from "../../features/network/use-network-status";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type ContentDetailState = "loading" | "offline" | "notFound" | "ready";

type ContentDetailShellProps = PropsWithChildren<{
  state: ContentDetailState;
  networkState: NetworkState;
  backLabel: string;
  loadingLabel: string;
  offlineTitle: string;
  offlineBody: string;
  notFoundTitle: string;
  notFoundBody: string;
  /**
   * Optional full-bleed media rendered edge-to-edge above the padded body, with
   * a floating circular back button overlaid. When omitted the shell falls back
   * to the simple padded layout with an inline textual back link.
   */
  hero?: ReactNode;
  /** Optional sticky bottom action bar pinned above the safe-area inset. */
  actions?: ReactNode;
}>;

/**
 * Shared chrome for the public article/episode/video detail routes: the back
 * affordance plus the loading / offline / not-found states, so each route file
 * only owns the content-specific body. In `ready` state a `hero` can be passed
 * to render the mockup's full-bleed cover with a floating back button.
 */
export function ContentDetailShell({
  state,
  networkState,
  backLabel,
  loadingLabel,
  offlineTitle,
  offlineBody,
  notFoundTitle,
  notFoundBody,
  hero,
  actions,
  children,
}: ContentDetailShellProps) {
  const { theme } = useAppTheme();
  const { scaleSpace, scaleFont, contentMaxWidth } = useResponsive();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  // Measure the sticky action bar so the scroll body reserves exactly its
  // height (it is an absolute overlay). A hardcoded inset used to clip the
  // body — e.g. hiding the premium member-access card behind a tall bar.
  const [actionsHeight, setActionsHeight] = useState(96);

  const heroLayout = state === "ready" && hero;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safe, { backgroundColor: theme.colors.canvas }]}
    >
      <StatusBannerStack networkState={networkState} />

      {heroLayout ? (
        <View style={[styles.heroColumn, { maxWidth: contentMaxWidth }]}>
          <ScrollView
            contentContainerStyle={{
              paddingBottom: actions
                ? actionsHeight + theme.spacing.md * scaleSpace + persistentPlayerSpace
                : theme.spacing.xxl * scaleSpace + persistentPlayerSpace,
            }}
            showsVerticalScrollIndicator={false}
          >
            {hero}
            <View
              style={{
                paddingHorizontal: theme.spacing.lg * scaleSpace,
                paddingTop: theme.spacing.lg * scaleSpace,
                gap: theme.spacing.md * scaleSpace,
              }}
            >
              {children}
            </View>
          </ScrollView>

          <Link href="/home" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={backLabel}
              hitSlop={10}
              style={StyleSheet.flatten([
                styles.floatingBack,
                { top: theme.spacing.sm * scaleSpace },
              ])}
            >
              <Text style={styles.floatingBackGlyph}>‹</Text>
            </Pressable>
          </Link>

          {actions ? (
            <View
              onLayout={(event) => setActionsHeight(event.nativeEvent.layout.height)}
              style={[
                styles.actionBar,
                {
                  paddingHorizontal: theme.spacing.lg * scaleSpace,
                  paddingTop: theme.spacing.sm * scaleSpace,
                  backgroundColor: theme.colors.canvas,
                  borderTopColor: theme.colors.border,
                },
              ]}
            >
              {actions}
            </View>
          ) : null}
        </View>
      ) : (
        <View
          style={[
            styles.content,
            {
              padding: theme.spacing.lg * scaleSpace,
              maxWidth: contentMaxWidth,
              alignSelf: "center",
            },
          ]}
        >
          <Link href="/home" asChild>
            <Pressable accessibilityRole="link" style={{ paddingVertical: 4 }}>
              <Text style={[styles.back, { color: theme.colors.accent, fontSize: 15 * scaleFont }]}>
                {backLabel}
              </Text>
            </Pressable>
          </Link>

          {state === "loading" ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.colors.accent} />
              <Text style={[styles.muted, { color: theme.colors.textMuted }]}>{loadingLabel}</Text>
            </View>
          ) : state === "offline" ? (
            <View style={styles.center}>
              <Text style={[styles.notFoundTitle, { color: theme.colors.heading }]}>
                {offlineTitle}
              </Text>
              <Text style={[styles.muted, { color: theme.colors.textMuted }]}>{offlineBody}</Text>
            </View>
          ) : state === "notFound" ? (
            <View style={styles.center}>
              <Text style={[styles.notFoundTitle, { color: theme.colors.heading }]}>
                {notFoundTitle}
              </Text>
              <Text style={[styles.muted, { color: theme.colors.textMuted }]}>{notFoundBody}</Text>
            </View>
          ) : (
            children
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: "center" },
  content: { flex: 1, width: "100%", gap: 16 },
  heroColumn: { flex: 1, width: "100%", alignSelf: "center", position: "relative" },
  back: { fontFamily: fontFamilies.bodySemiBold, fontSize: 15, paddingVertical: 4 },
  floatingBack: {
    position: "absolute",
    left: 12,
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: OVER_MEDIA.scrimSoft,
  },
  floatingBackGlyph: {
    color: OVER_MEDIA.onScrim,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "700",
    marginTop: -2,
  },
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundTitle: { fontFamily: fontFamilies.display, fontSize: 20, textAlign: "center" },
  muted: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 22, textAlign: "center" },
});
