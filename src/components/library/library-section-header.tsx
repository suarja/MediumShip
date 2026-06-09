import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { HapticsService } from "../../features/haptics/haptics";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { GateBadge, type GateTone } from "./gate-badge";

type LibrarySectionHeaderProps = {
  title: string;
  gate?: GateTone;
  seeAllLabel?: string;
  onSeeAllPress?: () => void;
};

export function LibrarySectionHeader({
  title,
  gate,
  seeAllLabel,
  onSeeAllPress,
}: LibrarySectionHeaderProps) {
  const { t } = useTranslation("profile");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const gateLabel = gate ? t(`badges.${gate}`) : undefined;
  const showSeeAll = Boolean(seeAllLabel && onSeeAllPress);

  return (
    <View style={styles.header}>
      <View style={[styles.headerRow, { gap: theme.spacing.sm * scaleSpace }]}>
        <View style={[styles.titleRow, { gap: 6 * scaleSpace, flex: 1 }]}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.heading,
                fontSize: 17 * scaleFont,
              },
            ]}
          >
            {title}
          </Text>
          {gate && gateLabel ? <GateBadge tone={gate} label={gateLabel} /> : null}
        </View>

        {showSeeAll ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={seeAllLabel}
            onPress={() => {
              void HapticsService.light();
              onSeeAllPress?.();
            }}
            style={({ pressed }) => [
              styles.seeAllButton,
              { gap: 2 * scaleSpace },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.seeAllLabel,
                {
                  color: theme.colors.textMuted,
                  fontSize: 12 * scaleFont,
                },
              ]}
            >
              {seeAllLabel}
            </Text>
            <Text
              style={[
                styles.seeAllChevron,
                {
                  color: theme.colors.textMuted,
                  fontSize: 14 * scaleFont,
                },
              ]}
            >
              ›
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.25,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    paddingVertical: 2,
    paddingLeft: 8,
  },
  seeAllLabel: {
    fontFamily: fontFamilies.bodyMedium,
    letterSpacing: 0.1,
  },
  seeAllChevron: {
    fontFamily: fontFamilies.body,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.88,
  },
});
