import { StyleSheet, View } from "react-native";

import type { ContentCardModel } from "../../features/content/types";
import { FeedRow } from "./feed-row";

/** Editorial list card — thin wrapper around {@link FeedRow} for vertical feeds. */
export function ContentCard({
  item,
  kicker,
  meta,
  divider = true,
}: {
  item: ContentCardModel;
  kicker: string;
  meta: string;
  divider?: boolean;
}) {
  return (
    <View style={styles.card}>
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
});
