import type { ComponentProps } from "react";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type IconName = ComponentProps<typeof Ionicons>["name"];

type HeroChip = {
  iconName: IconName;
  label: string;
};

type ProfileHeroProps = {
  eyebrow: string;
  title: string;
  bio: string;
  meta: string;
  tenantName: string;
  avatarUrl?: string | null;
  bannerImageUrl?: string;
  heroChips: HeroChip[];
};

export function ProfileHero({
  eyebrow,
  title,
  bio,
  meta,
  tenantName,
  avatarUrl,
  bannerImageUrl,
  heroChips,
}: ProfileHeroProps) {
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const avatarSize = (isTablet ? 112 : 96) * scaleSpace;
  const bannerHeight = (isTablet ? 260 : 212) * scaleSpace;
  const initial = title.trim().charAt(0).toUpperCase() || tenantName.trim().charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.shell,
        {
          borderRadius: theme.radii.xl,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <View
        style={[
          styles.banner,
          {
            height: bannerHeight,
            backgroundColor: theme.colors.heading,
          },
        ]}
      >
        {bannerImageUrl ? (
          <ImageBackground source={{ uri: bannerImageUrl }} style={styles.bannerImage}>
            <View
              style={[
                styles.bannerOverlay,
                { backgroundColor: withAlpha(theme.colors.heading, theme.isDark ? 0.2 : 0.36) },
              ]}
            />
          </ImageBackground>
        ) : (
          <View
            style={[
              styles.bannerFallback,
              { backgroundColor: theme.isDark ? theme.colors.canvasAccent : theme.colors.heading },
            ]}
          />
        )}

        <View
          style={[
            styles.bannerGlowLarge,
            { backgroundColor: withAlpha(theme.colors.accent, 0.26) },
          ]}
        />
        <View
          style={[
            styles.bannerGlowSmall,
            { backgroundColor: withAlpha(theme.colors.premium, 0.22) },
          ]}
        />

        <Link href="/settings" asChild>
          <Pressable
            accessibilityRole="link"
            style={({ pressed }) => [
              styles.settingsButton,
              {
                borderRadius: theme.radii.pill,
                borderColor: withAlpha(theme.colors.canvas, 0.14),
                backgroundColor: withAlpha(theme.colors.canvas, 0.12),
              },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons color={theme.colors.canvas} name="settings-outline" size={18 * scaleFont} />
          </Pressable>
        </Link>
      </View>

      <View
        style={[
          styles.body,
          {
            gap: theme.spacing.md * scaleSpace,
            paddingLeft: theme.spacing.lg * scaleSpace,
            paddingRight: theme.spacing.lg * scaleSpace,
            paddingBottom: theme.spacing.lg * scaleSpace,
          },
        ]}
      >
        <View style={[styles.identityRow, { gap: theme.spacing.md * scaleSpace }]}>
          <View
            style={[
              styles.avatarFrame,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                marginTop: -avatarSize * 0.46,
                borderColor: theme.colors.surface,
                backgroundColor: theme.colors.canvasAccent,
              },
            ]}
          >
            {avatarUrl ? (
              <Image accessibilityLabel={`${title} avatar`} source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <Text
                style={[
                  styles.avatarInitial,
                  { color: theme.colors.heading, fontSize: 32 * scaleFont },
                ]}
              >
                {initial}
              </Text>
            )}
          </View>

          <View style={[styles.copy, { gap: 6 * scaleSpace }]}>
            <Text
              style={[
                styles.eyebrow,
                { color: theme.colors.accent, fontSize: 11 * scaleFont },
              ]}
            >
              {eyebrow}
            </Text>
            <Text
              style={[
                styles.title,
                { color: theme.colors.heading, fontSize: 32 * scaleFont },
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.bio,
                { color: theme.colors.text, fontSize: 15 * scaleFont },
              ]}
            >
              {bio}
            </Text>
            <Text
              style={[
                styles.meta,
                { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
              ]}
            >
              {meta}
            </Text>
          </View>
        </View>

        <View style={[styles.heroChipRow, { gap: 10 * scaleSpace }]}>
          {heroChips.map((chip) => (
            <View
              key={`${chip.iconName}-${chip.label}`}
              style={[
                styles.heroChip,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.surfaceMuted,
                  paddingHorizontal: 14 * scaleSpace,
                  paddingVertical: 10 * scaleSpace,
                },
              ]}
            >
              <Ionicons color={theme.colors.accent} name={chip.iconName} size={15 * scaleFont} />
              <Text
                numberOfLines={1}
                style={[
                  styles.heroChipLabel,
                  { color: theme.colors.heading, fontSize: 13 * scaleFont },
                ]}
              >
                {chip.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  banner: {
    position: "relative",
    overflow: "hidden",
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
  },
  bannerFallback: {
    ...StyleSheet.absoluteFill,
  },
  bannerGlowLarge: {
    position: "absolute",
    left: -70,
    bottom: -100,
    width: 260,
    height: 260,
    borderRadius: 999,
  },
  bannerGlowSmall: {
    position: "absolute",
    right: -30,
    top: -10,
    width: 160,
    height: 160,
    borderRadius: 999,
  },
  settingsButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: {},
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarFrame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 4,
    flexShrink: 0,
  },
  avatar: {
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
    paddingTop: 10,
  },
  eyebrow: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.displayBold,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  bio: {
    fontFamily: fontFamilies.body,
    lineHeight: 22,
  },
  meta: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroChipLabel: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  pressed: {
    opacity: 0.86,
  },
});
