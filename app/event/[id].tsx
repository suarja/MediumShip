import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { useEvent } from "../../src/features/events/use-events";
import { HapticsService } from "../../src/features/haptics/haptics";
import { usePaywallSheet } from "../../src/features/paywall/paywall-sheet-provider";
import { useIsMember } from "../../src/features/membership/use-is-member";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

const ACCESS_LABEL: Record<string, string> = {
  free: "Gratuit",
  member: "Membres",
  premium: "Premium",
};

const MODE_LABEL: Record<string, string> = {
  online: "En ligne",
  offline: "Local",
  hybrid: "Hybride",
};

function formatFullDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const insets = useSafeAreaInsets();
  const { event } = useEvent(id ?? "");
  const { openPaywall } = usePaywallSheet();
  const { isMember } = useIsMember();

  if (!event) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={[styles.hint, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}>
            Événement introuvable.
          </Text>
        </View>
      </Screen>
    );
  }

  const isPremiumGated = (event.access === "premium" || event.access === "member") && !isMember;
  const accessColor = event.access === "premium" ? theme.colors.premium : event.access === "member" ? theme.colors.accent : theme.colors.textMuted;

  const handleCta = () => {
    if (isPremiumGated) {
      void HapticsService.medium();
      openPaywall(event.access === "premium" ? "content" : "members");
      return;
    }
    const url = event.ctaUrl ?? event.communityUrl;
    if (url) {
      void HapticsService.medium();
      void WebBrowser.openBrowserAsync(url);
    }
  };

  return (
    <Screen>
      <View
        style={[
          styles.topBar,
          { marginHorizontal: -(theme.spacing.lg * scaleSpace) },
        ]}
      >
        <Pressable
          onPress={() => {
            void HapticsService.selection();
            router.back();
          }}
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <Text style={[styles.backLabel, { color: theme.colors.heading, fontSize: 22 * scaleFont }]}>
            ‹
          </Text>
        </Pressable>
        <Text
          style={[styles.topBarTitle, { color: theme.colors.heading, fontSize: 18 * scaleFont }]}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <View style={styles.topBarSide} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            gap: theme.spacing.md * scaleSpace,
            paddingBottom: tabBarSpace + persistentPlayerSpace + insets.bottom + 24,
            ...(isTablet ? { maxWidth: 640, alignSelf: "center" as const, width: "100%" as const } : {}),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.heroCover,
            { backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.16 : 0.07), borderRadius: theme.radii.lg },
          ]}
        >
          <Text style={[styles.heroCoverGlyph, { color: theme.colors.accent, fontSize: 28 * scaleFont }]}>
            ☷
          </Text>
        </View>

        <View style={[styles.metaBadgeRow, { gap: 8 * scaleSpace }]}>
          <View
            style={[
              styles.badge,
              {
                borderRadius: theme.radii.pill,
                borderColor: withAlpha(accessColor, 0.4),
                borderWidth: StyleSheet.hairlineWidth,
                paddingHorizontal: 10 * scaleSpace,
                paddingVertical: 4 * scaleSpace,
              },
            ]}
          >
            <Text style={[styles.badgeLabel, { color: accessColor, fontSize: 10 * scaleFont }]}>
              {ACCESS_LABEL[event.access]?.toUpperCase() ?? event.access.toUpperCase()}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                borderRadius: theme.radii.pill,
                borderColor: withAlpha(theme.colors.textMuted, 0.3),
                borderWidth: StyleSheet.hairlineWidth,
                paddingHorizontal: 10 * scaleSpace,
                paddingVertical: 4 * scaleSpace,
              },
            ]}
          >
            <Text style={[styles.badgeLabel, { color: theme.colors.textMuted, fontSize: 10 * scaleFont }]}>
              {MODE_LABEL[event.mode]?.toUpperCase() ?? event.mode.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.colors.heading, fontSize: 24 * scaleFont }]}>
          {event.title}
        </Text>

        <Text style={[styles.dateLine, { color: theme.colors.accent, fontSize: 13 * scaleFont }]}>
          {formatFullDate(event.startsAt)}
        </Text>

        <Text style={[styles.location, { color: theme.colors.textMuted, fontSize: 13 * scaleFont }]}>
          {event.locationLabel}
        </Text>

        {event.descriptionLong ? (
          <Text style={[styles.description, { color: theme.colors.text, fontSize: 15 * scaleFont }]}>
            {event.descriptionLong}
          </Text>
        ) : (
          <Text style={[styles.description, { color: theme.colors.textMuted, fontSize: 15 * scaleFont }]}>
            {event.summary}
          </Text>
        )}

        {(event.ctaLabel || event.ctaUrl || event.communityUrl) && (
          <Pressable
            onPress={handleCta}
            style={({ pressed }) => [
              styles.ctaBtn,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: isPremiumGated ? theme.colors.premium : theme.colors.accent,
                paddingVertical: 14 * scaleSpace,
              },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.ctaLabel,
                { color: theme.colors.accentContrast, fontSize: 15 * scaleFont },
              ]}
            >
              {isPremiumGated
                ? `★ ${event.ctaLabel ?? "Accès membres"}`
                : (event.ctaLabel ?? "Rejoindre")}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 34,
    alignItems: "flex-start",
  },
  backLabel: {
    fontFamily: fontFamilies.body,
    lineHeight: 28,
  },
  topBarTitle: {
    flex: 1,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  topBarSide: {
    width: 34,
  },
  content: {},
  heroCover: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroCoverGlyph: {
    fontFamily: fontFamilies.mono,
  },
  metaBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  badge: {},
  badgeLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.5,
  },
  dateLine: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  location: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  description: {
    fontFamily: fontFamilies.body,
    lineHeight: 22,
  },
  ctaBtn: {
    alignItems: "center",
    marginTop: 8,
  },
  ctaLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    textAlign: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontFamily: fontFamilies.body,
  },
  pressed: {
    opacity: 0.84,
  },
});
