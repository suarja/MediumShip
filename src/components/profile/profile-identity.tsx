import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type ProfileIdentityProps = {
  title: string;
  name: string;
  status: string;
  since: string;
  avatarUrl?: string | null;
};

/**
 * Mockup `p2__top` + `p2__id`: a simple inline top bar (title centered, settings
 * gear on the right) above the identity row (avatar, name, status, since line).
 * No banner — this replaces the retired profile hero.
 */
export function ProfileIdentity({
  title,
  name,
  status,
  since,
  avatarUrl,
}: ProfileIdentityProps) {
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const avatarSize = (isTablet ? 60 : 52) * scaleSpace;
  const initial = name.trim().charAt(0).toUpperCase() || title.trim().charAt(0).toUpperCase();

  return (
    <View style={{ gap: theme.spacing.md * scaleSpace }}>
      <View
        style={[
          styles.topBar,
          { marginHorizontal: -(theme.spacing.lg * scaleSpace) },
        ]}
      >
        <View style={styles.topBarSide} />
        <Text
          style={[
            styles.topBarTitle,
            {
              color: theme.colors.heading,
              fontSize: 18 * scaleFont,
            },
          ]}
        >
          {title}
        </Text>
        <Link href="/settings" asChild>
          <Pressable
            testID="profile-settings-button"
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.settingsButton,
              {
                borderRadius: theme.radii.pill,
                borderColor: theme.colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              color={theme.colors.heading}
              name="settings-outline"
              size={18 * scaleFont}
            />
          </Pressable>
        </Link>
      </View>

      <View style={[styles.identityRow, { gap: theme.spacing.md * scaleSpace }]}>
        <View
          style={[
            styles.avatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              backgroundColor: theme.colors.canvasAccent,
            },
          ]}
        >
          {avatarUrl ? (
            <Image
              accessibilityLabel={`${name} avatar`}
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Text
              style={[
                styles.avatarInitial,
                { color: theme.colors.heading, fontSize: avatarSize * 0.42 },
              ]}
            >
              {initial}
            </Text>
          )}
        </View>

        <View style={styles.copy}>
          <Text
            style={[
              styles.name,
              {
                color: theme.colors.heading,
                fontSize: (isTablet ? 23 : 19) * scaleFont,
              },
            ]}
          >
            {name}
          </Text>
          <Text
            style={[
              styles.status,
              {
                color: theme.colors.premium,
                fontSize: 9 * scaleFont,
              },
            ]}
          >
            {status}
          </Text>
          <Text
            style={[
              styles.since,
              {
                color: theme.colors.textMuted,
                fontSize: 11 * scaleFont,
              },
            ]}
          >
            {since}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topBarSide: {
    width: 34,
    height: 34,
  },
  topBarTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
  settingsButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontFamily: fontFamilies.displayBold,
    letterSpacing: -0.4,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontFamily: fontFamilies.displayBold,
    letterSpacing: -0.3,
  },
  status: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  since: {
    fontFamily: fontFamilies.body,
  },
  pressed: {
    opacity: 0.7,
  },
});
