import { StyleSheet, Text, View } from "react-native";

import type { ContentCardModel } from "../../features/content/types";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import { FeedRow } from "./feed-row";

/**
 * Editorial list card used by Discover and other vertical feeds. Wraps {@link FeedRow}
 * with an optional discovery reason kicker above the category line.
 */
export function ContentCard({
  item,
  kicker,
  meta,
  reasonLabel,
  divider = true,
}: {
  item: ContentCardModel;
  kicker: string;
  meta: string;
  reasonLabel?: string;
  divider?: boolean;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  return (
    <View style={[styles.card, { gap: theme.spacing.xs * scaleSpace }]}>
      {reasonLabel ? (
        <Text
          testID={`content-card-reason-${item.id}`}
          numberOfLines={1}
          style={[
            styles.reason,
            {
              color: theme.colors.accent,
              fontSize: 9 * scaleFont,
              paddingHorizontal: theme.spacing.lg * scaleSpace,
            },
          ]}
        >
          {reasonLabel}
        </Text>
      ) : null}
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

const styles = StyleSheet.create({
  card: {},
  reason: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
