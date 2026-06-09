import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { HapticsService } from "../../features/haptics/haptics";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type LibraryOfflineLockedCardProps = {
  onPress: () => void;
};

export function LibraryOfflineLockedCard({ onPress }: LibraryOfflineLockedCardProps) {
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
          {t("library:screen.offlineTitle")}
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
          <Ionicons color={theme.colors.accent} name="download-outline" size={14 * scaleFont} />
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
        {t("library:screen.offlineBody")}
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamilies.display,
    lineHeight: 18,
  },
  icon: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  body: {
    fontFamily: fontFamilies.body,
    lineHeight: 15,
  },
});
