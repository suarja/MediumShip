import { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Link } from "expo-router";

import { DegradedBanner } from "./degraded-banner";
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
}>;

/**
 * Shared chrome for the public article/episode/video detail routes: a back
 * link plus the loading and not-found states, so each route file only owns the
 * content-specific body.
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
  children,
}: ContentDetailShellProps) {
  const { theme } = useAppTheme();
  const { scaleSpace, scaleFont, contentMaxWidth } = useResponsive();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.canvas }]}>
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
        <DegradedBanner state={networkState} />
        <Link href="/home" asChild>
          <Pressable
            accessibilityRole="link"
            style={{
              paddingVertical: 4,
            }}
          >
            <Text
              style={[
                styles.back,
                { color: theme.colors.accent, fontSize: 15 * scaleFont },
              ]}
            >
              {backLabel}
            </Text>
          </Pressable>
        </Link>

        {state === "loading" ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={[styles.muted, { color: theme.colors.textMuted }]}>
              {loadingLabel}
            </Text>
          </View>
        ) : state === "offline" ? (
          <View style={styles.center}>
            <Text style={[styles.notFoundTitle, { color: theme.colors.heading }]}>
              {offlineTitle}
            </Text>
            <Text style={[styles.muted, { color: theme.colors.textMuted }]}>
              {offlineBody}
            </Text>
          </View>
        ) : state === "notFound" ? (
          <View style={styles.center}>
            <Text style={[styles.notFoundTitle, { color: theme.colors.heading }]}>
              {notFoundTitle}
            </Text>
            <Text style={[styles.muted, { color: theme.colors.textMuted }]}>
              {notFoundBody}
            </Text>
          </View>
        ) : (
          children
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: "center" },
  content: { flex: 1, width: "100%", gap: 16 },
  back: { fontFamily: fontFamilies.bodySemiBold, fontSize: 15, paddingVertical: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundTitle: { fontFamily: fontFamilies.display, fontSize: 20, textAlign: "center" },
  muted: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 22, textAlign: "center" },
});
