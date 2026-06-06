import type { ReactNode } from "react";
import { View } from "react-native";

import type { ContentCardModel } from "../../features/content/types";
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
}: {
  item: ContentCardModel;
  kicker: string;
  meta: string;
  divider?: boolean;
  variant?: ContentCardVariant;
  /** Opt-in control row — only rendered when provided (feature variant). */
  actions?: ReactNode;
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
    <View testID="content-card-compact">
      <FeedRow
        item={item}
        kicker={kicker}
        meta={meta}
        divider={divider}
        showOverflowActions={false}
      />
    </View>
  );
}
