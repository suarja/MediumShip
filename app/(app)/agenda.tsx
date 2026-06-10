import { useGoBack, usePushWithReturn } from "../../src/features/navigation/app-navigation";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import type { AppEvent, EventFilter } from "../../src/features/events/types";
import { useEvents } from "../../src/features/events/use-events";
import { HapticsService } from "../../src/features/haptics/haptics";
import { FeatureAccessGate } from "../../src/components/navigation/feature-access-gate";
import { useResponsive } from "../../src/features/responsive/use-responsive";
import { withAlpha } from "../../src/features/theme/contrast";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";
import { useAccessBadge } from "../../src/features/tenant/use-access-badge";
import type { AccessBadgeLevel } from "../../src/features/tenant/access-badge";

const ACCESS_BADGE: Record<AccessBadgeLevel, string> = {
  member: "MEMBRES",
  premium: "PREMIUM",
};

const MODE_TAG: Record<string, string> = {
  online: "EN LIGNE",
  offline: "LOCAL",
  hybrid: "HYBRIDE",
};

function formatEventDate(iso: string): { day: string; month: string } {
  try {
    const d = new Date(iso);
    return {
      day: String(d.getDate()).padStart(2, "0"),
      month: d.toLocaleString("fr-FR", { month: "short" }).toUpperCase(),
    };
  } catch {
    return { day: "--", month: "---" };
  }
}

export default function AgendaScreen() {
  const { t } = useTranslation("explore");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();
  const goBack = useGoBack("/explore");
  const pushWithReturn = usePushWithReturn();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<EventFilter>("upcoming");
  const { events } = useEvents(filter);

  const FILTER_OPTIONS: { key: EventFilter; label: string }[] = [
    { key: "upcoming", label: "À venir" },
    { key: "online", label: "En ligne" },
    { key: "local", label: "Local" },
  ];

  return (
    <FeatureAccessGate featureKey="agenda">
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
            goBack();
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
        >
          Agenda
        </Text>
        <View style={styles.topBarSide} />
      </View>

      <View style={[styles.filterRow, { gap: theme.spacing.xs * scaleSpace, marginBottom: theme.spacing.md * scaleSpace }]}>
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => {
                void HapticsService.selection();
                setFilter(opt.key);
              }}
              style={[
                styles.filterChip,
                {
                  borderRadius: theme.radii.pill,
                  borderColor: active ? theme.colors.accent : theme.colors.border,
                  backgroundColor: active
                    ? withAlpha(theme.colors.accent, 0.1)
                    : "transparent",
                  paddingHorizontal: 12 * scaleSpace,
                  paddingVertical: 6 * scaleSpace,
                },
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.filterLabel,
                  {
                    color: active ? theme.colors.accent : theme.colors.textMuted,
                    fontSize: 12 * scaleFont,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.list,
          {
            gap: 0,
            paddingBottom: tabBarSpace + persistentPlayerSpace + insets.bottom,
            ...(isTablet ? { maxWidth: 640, alignSelf: "center" as const, width: "100%" as const } : {}),
          },
        ]}
        renderItem={({ item, index }) => (
          <EventRow
            event={item}
            divider={index !== 0}
            onPress={() => {
              void HapticsService.light();
              pushWithReturn(`/event/${item._id}`);
            }}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyLabel, { color: theme.colors.textMuted, fontSize: 14 * scaleFont }]}>
              Aucun événement pour ce filtre.
            </Text>
          </View>
        }
      />
    </Screen>
    </FeatureAccessGate>
  );
}

function EventRow({
  event,
  divider,
  onPress,
}: {
  event: AppEvent;
  divider: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const { day, month } = formatEventDate(event.startsAt);
  const accessBadge = useAccessBadge(event.access);
  const accessColor =
    accessBadge.level === "premium"
      ? theme.colors.premium
      : accessBadge.level === "member"
        ? theme.colors.accent
        : theme.colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.eventRow,
        {
          gap: theme.spacing.md * scaleSpace,
          paddingVertical: 14 * scaleSpace,
          borderTopWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderTopColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.dateBadge,
          {
            borderRadius: theme.radii.sm,
            backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.18 : 0.08),
            width: 48,
            height: 52,
          },
        ]}
      >
        <Text style={[styles.dateDay, { color: theme.colors.accent, fontSize: 18 * scaleFont }]}>
          {day}
        </Text>
        <Text style={[styles.dateMonth, { color: theme.colors.accent, fontSize: 9 * scaleFont }]}>
          {month}
        </Text>
      </View>

      <View style={styles.eventMeta}>
        <Text
          style={[styles.eventTitle, { color: theme.colors.heading, fontSize: 15 * scaleFont }]}
          numberOfLines={2}
        >
          {event.title}
        </Text>
        <Text
          style={[styles.eventSub, { color: theme.colors.textMuted, fontSize: 12 * scaleFont }]}
          numberOfLines={1}
        >
          {event.locationLabel}
        </Text>
        <View style={[styles.tagRow, { gap: 6 * scaleSpace, marginTop: 4 * scaleSpace }]}>
          <Text
            style={[
              styles.tag,
              {
                color: theme.colors.textMuted,
                borderColor: withAlpha(theme.colors.textMuted, 0.3),
                fontSize: 9 * scaleFont,
                paddingHorizontal: 6 * scaleSpace,
                paddingVertical: 2 * scaleSpace,
                borderRadius: theme.radii.pill,
                borderWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            {MODE_TAG[event.mode] ?? event.mode.toUpperCase()}
          </Text>
          {accessBadge.show && accessBadge.level ? (
            <Text
              style={[
                styles.tag,
                {
                  color: accessColor,
                  borderColor: withAlpha(accessColor, 0.3),
                  fontSize: 9 * scaleFont,
                  paddingHorizontal: 6 * scaleSpace,
                  paddingVertical: 2 * scaleSpace,
                  borderRadius: theme.radii.pill,
                  borderWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              {ACCESS_BADGE[accessBadge.level]}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
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
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.6,
  },
  list: {},
  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dateBadge: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dateDay: {
    fontFamily: fontFamilies.display,
    fontWeight: "700",
    lineHeight: 22,
  },
  dateMonth: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  eventMeta: {
    flex: 1,
  },
  eventTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
  eventSub: {
    fontFamily: fontFamilies.body,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  emptyWrap: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyLabel: {
    fontFamily: fontFamilies.body,
  },
  pressed: {
    opacity: 0.84,
  },
});
