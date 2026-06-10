import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { useResponsive } from "../../features/responsive/use-responsive";
import { useAppTheme } from "../../features/theme/theme-provider";

type MediaHeroPlayBandoProps = {
  accessibilityLabel: string;
  onPress: () => void;
  testID?: string;
};

/** Compact play affordance band under a detail hero, shared by episode and video. */
export function MediaHeroPlayBando({
  accessibilityLabel,
  onPress,
  testID,
}: MediaHeroPlayBandoProps) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const bandoBg = theme.isDark ? theme.colors.canvasAccent : theme.colors.heading;
  const playIconSize = 22 * scaleFont;

  return (
    <View
      style={[
        styles.bando,
        {
          backgroundColor: bandoBg,
          paddingHorizontal: theme.spacing.md * scaleSpace,
          paddingVertical: 10 * scaleSpace,
        },
      ]}
    >
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.playIconButton,
          {
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radii.pill,
          },
          pressed && styles.pressed,
        ]}
        testID={testID}
      >
        <Ionicons
          color={theme.colors.accentContrast}
          name="play"
          size={playIconSize}
          style={styles.playIconGlyph}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bando: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  playIconButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  playIconGlyph: {
    marginLeft: 2,
  },
  pressed: {
    opacity: 0.84,
  },
});
