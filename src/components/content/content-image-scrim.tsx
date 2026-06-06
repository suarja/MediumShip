import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { withAlpha } from "../../features/theme/contrast";
import { useAppTheme } from "../../features/theme/theme-provider";

type ContentImageScrimProps = {
  edge?: "bottom" | "top";
  strength?: "default" | "strong" | "subtle";
};

function getScrimAlphas(
  edge: "bottom" | "top",
  strength: "default" | "strong" | "subtle",
  isDark: boolean,
): [number, number, number] {
  if (strength === "subtle") {
    const peak = isDark ? 0.26 : 0.22;
    const mid = isDark ? 0.12 : 0.1;
    return edge === "bottom" ? [0, mid, peak] : [peak, mid, 0];
  }

  if (strength === "strong") {
    const peak = isDark ? 0.88 : 0.82;
    const mid = isDark ? 0.38 : 0.42;
    const fade = isDark ? 0.05 : 0.15;
    return edge === "bottom" ? [fade, mid, peak] : [peak, mid, fade];
  }

  const peak = isDark ? 0.72 : 0.62;
  const mid = isDark ? 0.26 : 0.2;
  return edge === "bottom" ? [0, mid, peak] : [peak, mid, 0];
}

/**
 * Theme-aware gradient scrim for copy or chrome on photography.
 * Bottom edge matches mockup `linear-gradient(180deg, heading@light, heading@strong)`.
 */
export function ContentImageScrim({
  edge = "bottom",
  strength = "default",
}: ContentImageScrimProps) {
  const { theme } = useAppTheme();
  const [start, mid, end] = getScrimAlphas(edge, strength, theme.isDark);
  const heading = theme.colors.heading;

  return (
    <View
      pointerEvents="none"
      style={styles.scrimWrap}
      testID="content-image-scrim"
      {...({
        "data-edge": edge,
        "data-strength": strength,
      } as Record<string, string>)}
    >
      <LinearGradient
        colors={[withAlpha(heading, start), withAlpha(heading, mid), withAlpha(heading, end)]}
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
