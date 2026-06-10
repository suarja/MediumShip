import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { HapticsService } from "../../features/haptics/haptics";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type LibraryBriefingRowProps = {
  onPress: () => void;
  title: string;
  meta: string;
  accessibilityLabel?: string;
};

export function LibraryBriefingRow({
  onPress,
  title,
  meta,
  accessibilityLabel,
}: LibraryBriefingRowProps) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const iconSize = 44 * scaleSpace;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={() => {
        void HapticsService.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        {
          gap: 11 * scaleSpace,
          borderRadius: theme.radii.md,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 11 * scaleSpace,
          paddingVertical: 9 * scaleSpace,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: theme.radii.sm,
            backgroundColor: theme.colors.accentSoft,
          },
        ]}
      >
        <Ionicons color={theme.colors.accent} name="newspaper-outline" size={20 * scaleFont} />
      </View>

      <View style={styles.copy}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            {
              color: theme.colors.heading,
              fontSize: 13.5 * scaleFont,
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.meta,
            {
              color: theme.colors.textMuted,
              fontSize: 9.5 * scaleFont,
            },
          ]}
        >
          {meta}
        </Text>
      </View>

      <Text
        style={[
          styles.chevron,
          {
            color: theme.colors.textMuted,
            fontSize: 14 * scaleFont,
          },
        ]}
      >
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.88,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamilies.display,
    lineHeight: 16,
  },
  meta: {
    fontFamily: fontFamilies.body,
    marginTop: 2,
  },
  chevron: {
    fontFamily: fontFamilies.body,
    marginLeft: 4,
  },
});
