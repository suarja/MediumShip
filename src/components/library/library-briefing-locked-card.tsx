import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { HapticsService } from "../../features/haptics/haptics";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type LibraryBriefingLockedCardProps = {
  onPress: () => void;
};

export function LibraryBriefingLockedCard({ onPress }: LibraryBriefingLockedCardProps) {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void HapticsService.medium();
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        {
          borderRadius: theme.radii.lg,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.head}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.heading,
              fontSize: 14 * scaleFont,
            },
          ]}
        >
          {t("library:screen.briefingTitle")}
        </Text>
        <View
          style={[
            styles.icon,
            {
              borderRadius: theme.radii.sm,
              backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.22 : 0.12),
            },
          ]}
        >
          <Ionicons color={theme.colors.accent} name="newspaper-outline" size={14 * scaleFont} />
        </View>
      </View>
      <Text
        style={[
          styles.body,
          {
            color: theme.colors.textMuted,
            fontSize: 10.5 * scaleFont,
          },
        ]}
      >
        {t("library:screen.briefingBody")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 2,
  },
  pressed: {
    opacity: 0.88,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontFamily: fontFamilies.display,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  icon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  body: {
    fontFamily: fontFamilies.body,
    lineHeight: 15,
  },
});
