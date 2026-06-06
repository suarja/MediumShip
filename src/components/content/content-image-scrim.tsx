import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { withAlpha } from "../../features/theme/contrast";
import { useAppTheme } from "../../features/theme/theme-provider";

type ContentImageScrimProps = {
  strength?: "default" | "strong";
};

type ScrimStop = {
  top: number;
  mid: number;
  bottom: number;
};

function getScrimStops(strength: "default" | "strong", isDark: boolean): ScrimStop {
  if (strength === "strong") {
    return isDark
      ? { top: 0.05, mid: 0.38, bottom: 0.88 }
      : { top: 0.15, mid: 0.42, bottom: 0.82 };
  }

  return isDark
    ? { top: 0, mid: 0.26, bottom: 0.72 }
    : { top: 0, mid: 0.2, bottom: 0.62 };
}

/**
 * Bottom-weighted scrim for editorial cards with copy on photography.
 * Matches mockup `linear-gradient(180deg, heading@light, heading@strong)`.
 */
export function ContentImageScrim({ strength = "default" }: ContentImageScrimProps) {
  const { theme } = useAppTheme();
  const stops = getScrimStops(strength, theme.isDark);
  const heading = theme.colors.heading;

  return (
    <View
      pointerEvents="none"
      style={styles.scrimWrap}
      testID="content-image-scrim"
      {...({ "data-strength": strength } as Record<string, string>)}
    >
      <LinearGradient
        colors={[
          withAlpha(heading, stops.top),
          withAlpha(heading, stops.mid),
          withAlpha(heading, stops.bottom),
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrimWrap: {
    ...StyleSheet.absoluteFill,
  },
});
