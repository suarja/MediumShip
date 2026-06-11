import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { HapticsService } from "../../features/haptics/haptics";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";
import type { Id } from "../../../convex/_generated/dataModel";

export type AnalysisHistoryItem = {
  _id: Id<"tasteAnalysis">;
  dayKey: string;
  tasteText: string;
  createdAt: number;
  seenAt?: number;
  previewTitle?: string;
};

type AnalysisHistoryRowProps = {
  item: AnalysisHistoryItem;
  onPress: (id: Id<"tasteAnalysis">) => void;
  divider?: boolean;
};

export function AnalysisHistoryRow({
  item,
  onPress,
  divider = true,
}: AnalysisHistoryRowProps) {
  const { t, i18n } = useTranslation("insights");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

  const dayLabel = new Date(item.createdAt).toLocaleDateString(i18n.language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Pressable
      accessibilityRole="button"
      testID={`analysis-history-row-${item._id}`}
      onPress={() => {
        void HapticsService.light();
        onPress(item._id);
      }}
      style={({ pressed }) => [
        styles.row,
        {
          gap: theme.spacing.xs * scaleSpace,
          paddingTop: divider ? theme.spacing.md * scaleSpace : 0,
          borderTopWidth: divider ? StyleSheet.hairlineWidth : 0,
          borderTopColor: theme.colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.day,
          { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
        ]}
      >
        {t("history.rowLabel", { day: dayLabel })}
      </Text>
      <Text
        numberOfLines={2}
        style={[
          styles.excerpt,
          { color: theme.colors.heading, fontSize: 15 * scaleFont },
        ]}
      >
        {item.previewTitle ?? item.tasteText}
      </Text>
      {item.seenAt === undefined ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.accentSoft,
              borderRadius: theme.radii.pill,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeLabel,
              { color: theme.colors.accent, fontSize: 12 * scaleFont },
            ]}
          >
            NEW
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
  },
  day: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  excerpt: {
    fontFamily: fontFamilies.body,
    lineHeight: 21,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  badgeLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
  },
});
