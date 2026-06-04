import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type ProfileStatCardsProps = {
  savedCount: number;
  downloadCount: number;
  isSignedIn: boolean;
  isMember: boolean;
  isSynced: boolean;
  labels: {
    saved: string;
    savedHint: string;
    downloaded: string;
    downloadedHint: string;
    access: string;
    memberHint: string;
    guestHint: string;
    sync: string;
    syncReady: string;
    syncPending: string;
  };
};

export function ProfileStatCards({
  savedCount,
  downloadCount,
  isSignedIn,
  isMember,
  isSynced,
  labels,
}: ProfileStatCardsProps) {
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();

  const cards = [
    {
      key: "saved",
      icon: savedCount > 0 ? "bookmark" : "bookmark-outline",
      value: savedCount.toString(),
      label: labels.saved,
      hint: labels.savedHint,
      tone: theme.colors.accent,
    },
    {
      key: "downloads",
      icon: downloadCount > 0 ? "download" : "download-outline",
      value: downloadCount.toString(),
      label: labels.downloaded,
      hint: labels.downloadedHint,
      tone: theme.colors.premium,
    },
    {
      key: "access",
      icon: isMember ? "sparkles" : "person-circle-outline",
      value: isSignedIn ? (isMember ? "Pro" : "Guest") : "Open",
      label: labels.access,
      hint: isMember ? labels.memberHint : labels.guestHint,
      tone: isMember ? theme.colors.premium : theme.colors.accent,
    },
    {
      key: "sync",
      icon: isSynced ? "sync-circle" : "cloud-offline-outline",
      value: isSynced ? "Live" : "Local",
      label: labels.sync,
      hint: isSynced ? labels.syncReady : labels.syncPending,
      tone: isSynced ? theme.colors.accent : theme.colors.textMuted,
    },
  ];

  return (
    <View style={[styles.grid, { gap: theme.spacing.sm * scaleSpace }]}>
      {cards.map((card) => (
        <View
          key={card.key}
          style={[
            styles.card,
            {
              flexBasis: isTablet ? "24%" : "48%",
              borderRadius: theme.radii.xl,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              gap: theme.spacing.sm * scaleSpace,
              padding: theme.spacing.md * scaleSpace,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: withAlpha(card.tone, 0.12),
              },
            ]}
          >
            <Ionicons color={card.tone} name={card.icon as never} size={20 * scaleFont} />
          </View>
          <View style={[styles.copy, { gap: 2 * scaleSpace }]}>
            <Text
              style={[
                styles.value,
                { color: theme.colors.heading, fontSize: 22 * scaleFont },
              ]}
            >
              {card.value}
            </Text>
            <Text
              style={[
                styles.label,
                { color: theme.colors.heading, fontSize: 13 * scaleFont },
              ]}
            >
              {card.label}
            </Text>
            <Text
              style={[
                styles.hint,
                { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
              ]}
            >
              {card.hint}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {},
  value: {
    fontFamily: fontFamilies.displayBold,
    letterSpacing: -0.3,
  },
  label: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  hint: {
    fontFamily: fontFamilies.body,
    lineHeight: 17,
  },
});
