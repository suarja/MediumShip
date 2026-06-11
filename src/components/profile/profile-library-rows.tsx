import type { ComponentProps, ReactNode } from "react";
import { usePushWithReturn } from "../../features/navigation/app-navigation";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { GateBadge, type GateTone } from "../library/gate-badge";
import { openManageSubscriptions } from "../../features/billing/purchases";
import { HapticsService } from "../../features/haptics/haptics";
import { usePaywallSheet } from "../../features/paywall/paywall-sheet-provider";
import { useResponsive } from "../../features/responsive/use-responsive";
import { hasCapability } from "../../features/tenant/public-config";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type IconName = ComponentProps<typeof Ionicons>["name"];

type ProfileLibraryRowsProps = {
  isMember: boolean;
  savedCount: number;
  downloadCount: number;
  listsCount: number;
  briefingCount?: number;
  onSignOut: () => void;
  onGoPremium?: () => void;
  onOpenBriefingHistory?: () => void;
};

/**
 * Mockup `p2__sec` blocks: "My library" gated nav rows (into Library) and the
 * "Account" rows (upgrade/subscription + sign out). Lightweight navigation, not
 * content shelves.
 */
export function ProfileLibraryRows({
  isMember,
  savedCount,
  downloadCount,
  listsCount,
  briefingCount = 0,
  onSignOut,
  onGoPremium,
  onOpenBriefingHistory,
}: ProfileLibraryRowsProps) {
  const { t } = useTranslation("profile");
  const { theme, enabledModules } = useAppTheme();
  const { scaleSpace } = useResponsive();
  const pushWithReturn = usePushWithReturn();
  const { openPaywall } = usePaywallSheet();

  const canBookmark = hasCapability(enabledModules, "bookmarks");
  const canOffline = hasCapability(enabledModules, "offline");
  const canPersonalLists = hasCapability(enabledModules, "personalLists");
  const canProgressSync = hasCapability(enabledModules, "progressSync");
  const canBriefing = hasCapability(enabledModules, "premiumInsights");

  const openLists = () => {
    void HapticsService.light();
    pushWithReturn("/lists");
  };

  const openDownloads = () => {
    if (isMember) {
      void HapticsService.light();
      pushWithReturn("/downloads");
      return;
    }
    void HapticsService.medium();
    openPaywall("offline");
  };

  type LibraryRowConfig = {
    key: string;
    icon: IconName;
    title: string;
    subtitle: string;
    /** Premium upsell badge — only rendered when the user is not premium yet. */
    showPremiumBadge?: boolean;
    onPress: () => void;
  };

  const libraryRowConfigs: LibraryRowConfig[] = [];

  if (canBookmark) {
    libraryRowConfigs.push({
      key: "saved",
      icon: "bookmark-outline",
      title: t("rows.saved.title"),
      subtitle: t("rows.saved.sub", { count: savedCount }),
      onPress: () => {
        void HapticsService.light();
        pushWithReturn("/favorites");
      },
    });
  }

  if (canOffline) {
    libraryRowConfigs.push({
      key: "downloads",
      icon: "download-outline",
      title: t("rows.downloads.title"),
      subtitle: isMember
        ? t("rows.downloads.subMember", { count: downloadCount })
        : t("rows.downloads.sub"),
      showPremiumBadge: true,
      onPress: openDownloads,
    });
  }

  if (canPersonalLists) {
    libraryRowConfigs.push({
      key: "lists",
      icon: "list-outline",
      title: t("rows.lists.title"),
      subtitle:
        listsCount > 0
          ? t("rows.lists.subMember", { count: listsCount })
          : isMember
            ? t("rows.lists.subMemberEmpty")
            : t("rows.lists.sub"),
      showPremiumBadge: true,
      onPress: openLists,
    });
  }

  if (canProgressSync) {
    libraryRowConfigs.push({
      key: "history",
      icon: "time-outline",
      title: t("rows.history.title"),
      subtitle: t("rows.history.sub"),
      onPress: () => {
        void HapticsService.light();
        pushWithReturn("/history");
      },
    });
  }

  if (canBriefing && onOpenBriefingHistory) {
    libraryRowConfigs.push({
      key: "briefing",
      icon: "newspaper-outline",
      title: t("rows.briefing.title"),
      subtitle: isMember
        ? briefingCount > 0
          ? t("rows.briefing.subMember", { count: briefingCount })
          : t("rows.briefing.subMemberEmpty")
        : t("rows.briefing.sub"),
      showPremiumBadge: true,
      onPress: () => {
        if (isMember) {
          void HapticsService.light();
          onOpenBriefingHistory();
          return;
        }
        void HapticsService.medium();
        openPaywall("content");
      },
    });
  }

  return (
    <View style={{ gap: theme.spacing.lg * scaleSpace }}>
      {libraryRowConfigs.length > 0 ? (
        <Section kicker={t("sections.myLibrary")}>
          {libraryRowConfigs.map((row, index) => (
            <ProfileRow
              key={row.key}
              first={index === 0}
              icon={row.icon}
              title={row.title}
              subtitle={row.subtitle}
              gate={row.showPremiumBadge && !isMember ? "premium" : undefined}
              gateLabel={
                row.showPremiumBadge && !isMember ? t("badges.premium") : undefined
              }
              onPress={row.onPress}
            />
          ))}
        </Section>
      ) : null}

      <Section kicker={t("sections.account")}>
        {isMember ? (
          <ProfileRow
            first
            icon="star"
            title={t("rows.subscription.title")}
            subtitle={t("rows.subscription.sub")}
            onPress={() => {
              void HapticsService.medium();
              void openManageSubscriptions();
            }}
          />
        ) : (
          <ProfileRow
            first
            icon="star-outline"
            title={t("rows.goPremium.title")}
            subtitle={t("rows.goPremium.sub")}
            onPress={
              onGoPremium ??
              (() => {
                void HapticsService.medium();
                pushWithReturn("/premium");
              })
            }
          />
        )}
        <ProfileRow
          icon="log-out-outline"
          title={t("rows.signOut.title")}
          subtitle={t("rows.signOut.sub")}
          onPress={() => {
            void HapticsService.warning();
            onSignOut();
          }}
        />
      </Section>
    </View>
  );
}

function Section({ kicker, children }: { kicker: string; children: ReactNode }) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  return (
    <View>
      <Text
        style={[
          styles.kicker,
          {
            color: theme.colors.textMuted,
            fontSize: 11 * scaleFont,
            marginBottom: theme.spacing.xs * scaleSpace,
          },
        ]}
      >
        {kicker}
      </Text>
      <View>{children}</View>
    </View>
  );
}

function ProfileRow({
  icon,
  title,
  subtitle,
  gate,
  gateLabel,
  onPress,
  first = false,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  gate?: GateTone;
  gateLabel?: string;
  onPress?: () => void;
  first?: boolean;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const iconSize = 28 * scaleSpace;

  const content = (pressed: boolean) => (
    <View
      style={[
        styles.row,
        {
          gap: theme.spacing.sm * scaleSpace,
          paddingVertical: 10 * scaleSpace,
          borderTopWidth: first ? 0 : StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.rowIcon,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: theme.radii.sm * 0.5,
            backgroundColor: theme.colors.accentSoft,
          },
        ]}
      >
        <Ionicons color={theme.colors.accent} name={icon} size={16 * scaleFont} />
      </View>

      <View style={styles.rowMeta}>
        <View style={[styles.rowTitleRow, { gap: 6 * scaleSpace }]}>
          <Text
            style={[
              styles.rowTitle,
              { color: theme.colors.heading, fontSize: 15 * scaleFont },
            ]}
          >
            {title}
          </Text>
          {gate && gateLabel ? <GateBadge tone={gate} label={gateLabel} /> : null}
        </View>
        <Text
          style={[
            styles.rowSub,
            { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <Text
        style={[
          styles.chevron,
          { color: theme.colors.textMuted, fontSize: 16 * scaleFont },
        ]}
      >
        ›
      </Text>
    </View>
  );

  if (!onPress) {
    return content(false);
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  rowIcon: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowMeta: {
    flex: 1,
    minWidth: 0,
  },
  rowTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  rowTitle: {
    fontFamily: fontFamilies.display,
    lineHeight: 20,
  },
  rowSub: {
    fontFamily: fontFamilies.body,
    lineHeight: 16,
    marginTop: 2,
  },
  chevron: {
    fontFamily: fontFamilies.body,
    marginLeft: 4,
  },
});
