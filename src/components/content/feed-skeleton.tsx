import { StyleSheet, View } from "react-native";

import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { useAppTheme } from "../../features/theme/theme-provider";

type FeedSkeletonProps = {
  /** Number of placeholder rows to render. */
  rows?: number;
  testID?: string;
};

/**
 * Shared loading placeholder for feed surfaces (Home, Discover). Rendered
 * immediately while content resolves, instead of a text "loading" card, so the
 * first paint already mirrors the list shape.
 */
export function FeedSkeleton({ rows = 4, testID = "feed-skeleton" }: FeedSkeletonProps) {
  const { theme } = useAppTheme();
  const { scaleSpace } = useResponsive();

  return (
    <View testID={testID} style={[styles.stack, { gap: theme.spacing.md * scaleSpace }]}>
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          style={[
            styles.row,
            {
              gap: theme.spacing.md * scaleSpace,
              paddingTop: index > 0 ? theme.spacing.md * scaleSpace : 0,
              borderTopWidth: index > 0 ? StyleSheet.hairlineWidth : 0,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.tile,
              {
                borderRadius: theme.radii.sm,
                backgroundColor: withAlpha(theme.colors.heading, 0.08),
              },
            ]}
          />
          <View style={[styles.copy, { gap: theme.spacing.xs * scaleSpace }]}>
            <View
              style={[
                styles.line,
                { width: "28%", backgroundColor: withAlpha(theme.colors.accent, 0.18) },
              ]}
            />
            <View
              style={[
                styles.line,
                { width: "88%", backgroundColor: withAlpha(theme.colors.heading, 0.1) },
              ]}
            />
            <View
              style={[
                styles.line,
                { width: "42%", backgroundColor: withAlpha(theme.colors.heading, 0.06) },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {},
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  tile: {
    width: 60,
    height: 60,
  },
  copy: {
    flex: 1,
  },
  line: {
    height: 10,
    borderRadius: 4,
  },
});
