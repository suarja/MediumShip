import type { ComponentProps, ReactNode } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type IconName = ComponentProps<typeof Ionicons>["name"];
type GateTone = "free" | "member" | "premium";

type ProfileLibraryRowsProps = {
  isMember: boolean;
  savedCount: number;
  downloadCount: number;
  onSignOut: () => void;
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
  onSignOut,
}: ProfileLibraryRowsProps) {
  const { t } = useTranslation("profile");
  const { theme } = useAppTheme();
  const { scaleSpace } = useResponsive();
  const router = useRouter();

  return (
    <View style={{ gap: theme.spacing.lg * scaleSpace }}>
      <Section kicker={t("sections.myLibrary")}>
        <ProfileRow
          first
          icon="bookmark-outline"
          title={t("rows.saved.title")}
          gate="free"
          gateLabel={t("badges.free")}
          subtitle={t("rows.saved.sub", { count: savedCount })}
          onPress={() => router.push("/library")}
        />
        <ProfileRow
          icon="download-outline"
          title={t("rows.downloads.title")}
          gate="premium"
          gateLabel={t("badges.premium")}
          subtitle={
            isMember
              ? t("rows.downloads.subMember", { count: downloadCount })
              : t("rows.downloads.sub")
          }
          onPress={() => router.push("/library")}
        />
        <ProfileRow
          icon="list-outline"
          title={t("rows.lists.title")}
          gate="premium"
          gateLabel={t("badges.premium")}
          subtitle={t("rows.lists.sub")}
          onPress={() => router.push("/library")}
        />
        <ProfileRow
          icon="time-outline"
          title={t("rows.history.title")}
          gate="member"
          gateLabel={t("badges.member")}
          subtitle={t("rows.history.sub")}
          onPress={() => router.push("/library")}
        />
      </Section>

      <Section kicker={t("sections.account")}>
        {isMember ? (
          <ProfileRow
            first
            icon="star"
            title={t("rows.subscription.title")}
            subtitle={t("rows.subscription.sub")}
          />
        ) : (
          <ProfileRow
            first
            icon="star-outline"
            title={t("rows.goPremium.title")}
            subtitle={t("rows.goPremium.sub")}
            onPress={() => router.push("/premium")}
          />
        )}
        <ProfileRow
          icon="log-out-outline"
          title={t("rows.signOut.title")}
          subtitle={t("rows.signOut.sub")}
          onPress={onSignOut}
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
            fontSize: 10 * scaleFont,
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
        <Ionicons color={theme.colors.accent} name={icon} size={14 * scaleFont} />
      </View>

      <View style={styles.rowMeta}>
        <View style={[styles.rowTitleRow, { gap: 6 * scaleSpace }]}>
          <Text
            style={[
              styles.rowTitle,
              { color: theme.colors.heading, fontSize: 14 * scaleFont },
            ]}
          >
            {title}
          </Text>
          {gate && gateLabel ? <GateBadge tone={gate} label={gateLabel} /> : null}
        </View>
        <Text
          style={[
            styles.rowSub,
            { color: theme.colors.textMuted, fontSize: 10 * scaleFont },
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

function GateBadge({ tone, label }: { tone: GateTone; label: string }) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const color = tone === "premium" ? theme.colors.premium : theme.colors.accent;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: withAlpha(color, 0.16) },
      ]}
    >
      <Text
        style={[
          styles.badgeLabel,
          { color, fontSize: 8 * scaleFont },
        ]}
      >
        {label}
      </Text>
    </View>
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
    lineHeight: 18,
  },
  rowSub: {
    fontFamily: fontFamilies.body,
    marginTop: 1,
  },
  chevron: {
    fontFamily: fontFamilies.body,
    marginLeft: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
