import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import type { ContentCardModel } from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { useAppTheme } from "../../features/theme/theme-provider";
import { ContentFeatureCard } from "./content-feature-card";
import { FeedRow } from "./feed-row";

export type ContentCardVariant = "compact" | "feature";

/**
 * Composable editorial card. `variant="compact"` is the dense list row used on
 * Accueil, explore, category, and list surfaces. `variant="feature"` is the
 * media-forward discovery card with opt-in action slots.
 */
export function ContentCard({
  item,
  kicker,
  meta,
  divider = true,
  variant = "compact",
  actions,
  onSkip,
  onLike,
  isLiked = false,
  skipAccessibilityLabel,
  likeAccessibilityLabel,
}: {
  item: ContentCardModel;
  kicker: string;
  meta: string;
  divider?: boolean;
  variant?: ContentCardVariant;
  /** Opt-in control row — only rendered when provided. */
  actions?: ReactNode;
  /** @deprecated Compact-only legacy affordances; Discover uses `actions` instead. */
  onSkip?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  skipAccessibilityLabel?: string;
  likeAccessibilityLabel?: string;
}) {
  if (variant === "feature") {
    return (
      <ContentFeatureCard
        item={item}
        kicker={kicker}
        meta={meta}
        divider={divider}
        actions={actions}
      />
    );
  }

  return (
    <View
      testID="content-card-compact"
      style={[styles.card, Boolean(onSkip || onLike) && styles.cardWithActions]}
    >
      <View style={styles.main}>
        <FeedRow
          item={item}
          kicker={kicker}
          meta={meta}
          divider={divider}
          showOverflowActions={false}
        />
      </View>

      {onSkip || onLike ? (
        <CompactLegacyActions
          onSkip={onSkip}
          onLike={onLike}
          isLiked={isLiked}
          skipAccessibilityLabel={skipAccessibilityLabel}
          likeAccessibilityLabel={likeAccessibilityLabel}
          divider={divider}
        />
      ) : null}
    </View>
  );
}

function CompactLegacyActions({
  onSkip,
  onLike,
  isLiked,
  skipAccessibilityLabel,
  likeAccessibilityLabel,
  divider,
}: {
  onSkip?: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  skipAccessibilityLabel?: string;
  likeAccessibilityLabel?: string;
  divider: boolean;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const actionSize = 34 * scaleSpace;

  return (
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
              borderColor: withAlpha(theme.colors.accent, isLiked ? 0.5 : 0.24),
              backgroundColor: isLiked
                ? withAlpha(theme.colors.accent, 0.18)
                : theme.colors.accentSoft,
            },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            color={theme.colors.accent}
            name={isLiked ? "heart" : "heart-outline"}
            size={16 * scaleFont}
          />
        </Pressable>
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
