import { StyleSheet, Text, View } from "react-native";

import { fontFamilies } from "../../features/theme/fonts";

type GlyphProps = {
  size?: number;
  color: string;
};

// Right-pointing triangle drawn with borders so it stays crisp at any size.
export function PlayGlyph({ size = 22, color }: GlyphProps) {
  return (
    <View
      style={{
        width: 0,
        height: 0,
        borderTopWidth: size * 0.5,
        borderBottomWidth: size * 0.5,
        borderLeftWidth: size * 0.82,
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
        borderLeftColor: color,
        marginLeft: size * 0.16,
      }}
    />
  );
}

// Two rounded bars.
export function PauseGlyph({ size = 22, color }: GlyphProps) {
  const barWidth = size * 0.3;
  return (
    <View style={[styles.row, { gap: size * 0.24 }]}>
      <View
        style={{
          width: barWidth,
          height: size,
          borderRadius: barWidth * 0.45,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          width: barWidth,
          height: size,
          borderRadius: barWidth * 0.45,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

// Circular replay arrow, used when playback has reached the end.
export function ReplayGlyph({ size = 22, color }: GlyphProps) {
  return (
    <Text
      style={{
        fontSize: size * 1.25,
        lineHeight: size * 1.32,
        color,
      }}
    >
      ↺
    </Text>
  );
}

type SkipGlyphProps = GlyphProps & {
  seconds: number;
  direction: "back" | "forward";
};

// Circular arrow with the seconds count overlaid, mirroring the iOS
// gobackward.15 / goforward.30 controls.
export function SkipGlyph({ seconds, direction, size = 30, color }: SkipGlyphProps) {
  return (
    <View style={[styles.skip, { width: size * 1.2, height: size * 1.2 }]}>
      <Text style={{ fontSize: size, lineHeight: size * 1.05, color }}>
        {direction === "back" ? "↺" : "↻"}
      </Text>
      <Text
        style={[
          styles.skipLabel,
          { fontSize: size * 0.36, color },
        ]}
      >
        {seconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  skip: {
    alignItems: "center",
    justifyContent: "center",
  },
  skipLabel: {
    position: "absolute",
    fontFamily: fontFamilies.bodySemiBold,
    textAlign: "center",
  },
});
