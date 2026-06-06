import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type LibraryPersonalListRowProps = {
  onPress: () => void;
  title?: string;
  meta?: string;
  accessibilityLabel?: string;
};

export function LibraryPersonalListRow({
  onPress,
  title,
  meta,
  accessibilityLabel,
}: LibraryPersonalListRowProps) {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const stackSize = 44 * scaleSpace;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title ?? t("library:screen.listsPreviewTitle")}
      onPress={onPress}
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
      <View style={[styles.stack, { width: stackSize, height: stackSize }]}>
        <View
          style={[
            styles.stackLayer,
            styles.stackLayerBack,
            {
              borderRadius: theme.radii.sm,
              backgroundColor: withAlpha(theme.colors.textMuted, theme.isDark ? 0.35 : 0.22),
            },
          ]}
        />
        <View
          style={[
            styles.stackLayer,
            styles.stackLayerMid,
            {
              borderRadius: theme.radii.sm,
              backgroundColor: withAlpha(theme.colors.premium, theme.isDark ? 0.55 : 0.42),
            },
          ]}
        />
        <View
          style={[
            styles.stackLayer,
            styles.stackLayerFront,
            {
              borderRadius: theme.radii.sm,
              backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.72 : 0.58),
            },
          ]}
        />
      </View>

      <View style={styles.copy}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.heading,
              fontSize: 13.5 * scaleFont,
            },
          ]}
        >
          {title ?? t("library:screen.listsPreviewTitle")}
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
          {meta ?? t("library:screen.listsPreviewMeta")}
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
  stack: {
    position: "relative",
    flexShrink: 0,
  },
  stackLayer: {
    position: "absolute",
  },
  stackLayerBack: {
    top: 0,
    right: 6,
    bottom: 6,
    left: 0,
  },
  stackLayerMid: {
    top: 4,
    right: 3,
    bottom: 3,
    left: 3,
  },
  stackLayerFront: {
    top: 8,
    right: 0,
    bottom: 0,
    left: 6,
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
