import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import type { ContentCardModel } from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { useAppTheme } from "../../features/theme/theme-provider";
import { FeedRow } from "./feed-row";

/** Editorial list card — thin wrapper around {@link FeedRow} for vertical feeds. */
export function ContentCard({
  item,
  kicker,
  meta,
  divider = true,
  onSkip,
  onLike,
  skipAccessibilityLabel,
  likeAccessibilityLabel,
}: {
  item: ContentCardModel;
  kicker: string;
  meta: string;
  divider?: boolean;
  onSkip?: () => void;
  onLike?: () => void;
  skipAccessibilityLabel?: string;
  likeAccessibilityLabel?: string;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const showAffordances = Boolean(onSkip || onLike);
  const actionSize = 34 * scaleSpace;

  return (
    <View style={[styles.card, showAffordances && styles.cardWithActions]}>
      <View style={styles.main}>
        <FeedRow
          item={item}
          kicker={kicker}
          meta={meta}
          divider={divider}
          showOverflowActions={false}
        />
      </View>

      {showAffordances ? (
        <View
          style={[
            styles.actions,
            {
              gap: theme.spacing.xs * scaleSpace,
              paddingTop: divider ? theme.spacing.md * scaleSpace : 0,
            },
          ]}
        >
          {onSkip ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={skipAccessibilityLabel}
              testID="discover-skip-button"
              onPress={onSkip}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  width: actionSize,
                  height: actionSize,
                  borderRadius: theme.radii.pill,
                  borderColor: theme.colors.border,
                  backgroundColor: withAlpha(theme.colors.heading, 0.04),
                },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                color={theme.colors.textMuted}
                name="close"
                size={16 * scaleFont}
              />
            </Pressable>
          ) : null}

          {onLike ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={likeAccessibilityLabel}
              testID="discover-like-button"
              onPress={onLike}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  width: actionSize,
                  height: actionSize,
                  borderRadius: theme.radii.pill,
                  borderColor: withAlpha(theme.colors.accent, 0.24),
                  backgroundColor: theme.colors.accentSoft,
                },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                color={theme.colors.accent}
                name="heart-outline"
                size={16 * scaleFont}
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  cardWithActions: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.72,
  },
});
