import { ScrollView, StyleSheet, Text, Pressable } from "react-native";

import type { ContentKind } from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

export type FeedFilter = ContentKind | "all";

export type FeedFilterChip = {
  key: FeedFilter;
  label: string;
};

/**
 * Horizontally scrollable format filter. The active chip inverts to the ink
 * fill from the mockup; the rest read as quiet outlined pills. Filtering is
 * applied client-side by the home screen, so this stays presentational.
 */
export function FeedFilterChips({
  chips,
  active,
  onSelect,
}: {
  chips: FeedFilterChip[];
  active: FeedFilter;
  onSelect: (key: FeedFilter) => void;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing.xs * 1.5 * scaleSpace }}
    >
      {chips.map((chip) => {
        const selected = chip.key === active;
        return (
          <Pressable
            key={chip.key}
            accessibilityRole="button"
            accessibilityState={selected ? { selected: true } : {}}
            onPress={() => onSelect(chip.key)}
            style={({ pressed }) => [
              styles.chip,
              {
                borderRadius: theme.radii.pill,
                paddingHorizontal: theme.spacing.md * scaleSpace,
                paddingVertical: theme.spacing.xs * 1.5 * scaleSpace,
                borderColor: selected ? theme.colors.heading : theme.colors.border,
                backgroundColor: selected ? theme.colors.heading : "transparent",
              },
              pressed && !selected && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: selected ? theme.colors.canvas : theme.colors.textMuted,
                  fontSize: 10 * scaleFont,
                },
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.6 },
  label: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});
