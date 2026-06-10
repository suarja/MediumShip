import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import {
  KIND_GLYPH,
  kindAccent,
} from "../../features/content/card-presentation";
import type { ContentKind } from "../../features/content/types";
import { formatHistoryRowMeta } from "../../features/history/format-history-meta";
import { HapticsService } from "../../features/haptics/haptics";
import { usePushWithReturn } from "../../features/navigation/app-navigation";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import type { Id } from "../../../convex/_generated/dataModel";

export type HistoryRowItem = {
  contentId: Id<"contents">;
  kind: ContentKind;
  title: string;
  heroImageUrl?: string;
  openedAt: number;
  progressRatio?: number;
};

type HistoryRowProps = {
  item: HistoryRowItem;
  divider?: boolean;
};

export function HistoryRow({ item, divider = true }: HistoryRowProps) {
  const { t, i18n } = useTranslation("library");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const pushWithReturn = usePushWithReturn();
  const tile = 60 * scaleSpace;
  const kAccent = kindAccent(item.kind, theme);
  const kicker = t(`kinds.${item.kind}`);
  const meta = formatHistoryRowMeta(item, t, i18n.language);
  const progressPercent =
    item.progressRatio !== undefined
      ? `${Math.min(100, Math.max(0, item.progressRatio * 100))}%`
      : null;

  const handlePress = () => {
    void HapticsService.light();
    const destination =
      item.progressRatio !== undefined
        ? `/player/${item.contentId}`
        : `/${item.kind}/${item.contentId}`;
    pushWithReturn(destination);
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [
        styles.row,
        {
          gap: theme.spacing.sm * scaleSpace,
          paddingTop: divider ? theme.spacing.md * scaleSpace : 0,
          borderTopWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderTopColor: theme.colors.border,
        },
        pressed && styles.pressed,
      ]}
      testID={`history-row-${item.contentId}`}
    >
      <View style={[styles.rowInner, { gap: theme.spacing.md * scaleSpace }]}>
        <View
          style={[
            styles.tile,
            {
              width: tile,
              height: tile,
              borderRadius: theme.radii.sm,
              backgroundColor: kAccent.accentSoft,
            },
          ]}
        >
          {item.heroImageUrl ? (
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="cover"
              source={{ uri: item.heroImageUrl }}
              style={styles.thumbnail}
            />
          ) : (
            <Text
              style={[
                styles.glyph,
                { color: kAccent.accent, fontSize: 22 * scaleFont },
              ]}
            >
              {KIND_GLYPH[item.kind]}
            </Text>
          )}
        </View>

        <View style={styles.copy}>
          <Text
            numberOfLines={1}
            style={[
              styles.kicker,
              { color: kAccent.accent, fontSize: 10 * scaleFont },
            ]}
          >
            {kicker}
          </Text>
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              {
                color: theme.colors.heading,
                fontSize: 17 * scaleFont,
                lineHeight: 21 * scaleFont,
              },
            ]}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.meta,
              { color: theme.colors.textMuted, fontSize: 11 * scaleFont },
            ]}
          >
            {meta}
          </Text>
          {progressPercent ? (
            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.colors.border },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: progressPercent as ViewStyle["width"],
                    backgroundColor: kAccent.accent,
                  },
                ]}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingBottom: 4,
  },
  pressed: {
    opacity: 0.92,
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  glyph: {
    fontFamily: fontFamilies.display,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  kicker: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.display,
  },
  meta: {
    fontFamily: fontFamilies.body,
    marginTop: 2,
  },
  progressBar: {
    height: 3,
    borderRadius: 999,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
});
