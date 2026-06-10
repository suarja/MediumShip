import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useMutation } from "convex/react";
import { useTranslation } from "react-i18next";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ContentCardFavoriteAction,
  ContentCardLikeAction,
  ContentCardOverflowAction,
} from "../content/content-card-actions";
import { ContentCard } from "../content/content-card";
import {
  cardDurationMeta,
  cardKicker,
} from "../../features/content/card-presentation";
import type { ContentCardModel } from "../../features/content/types";
import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type AnalysisPickCardProps = {
  index: number;
  item: ContentCardModel;
  rationale?: string;
  isLiked: boolean;
  tenantSlug: string;
};

export function AnalysisPickCard({
  index,
  item,
  rationale,
  isLiked: initialIsLiked,
  tenantSlug,
}: AnalysisPickCardProps) {
  const { t } = useTranslation(["discover", "home", "library"]);
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const { isSignedIn } = useClerkAuth();
  const recordInteraction = useMutation(api.discovery.interactions.recordInteraction);
  const [isLiked, setIsLiked] = useState(initialIsLiked);

  const handleLike = useCallback(() => {
    if (!isSignedIn) {
      return;
    }

    setIsLiked((current) => !current);
    void recordInteraction({
      tenantSlug,
      contentId: item.id as Id<"contents">,
      type: "like",
    });
  }, [isSignedIn, item.id, recordInteraction, tenantSlug]);

  const slotLabel = String(index + 1).padStart(2, "0");

  return (
    <View
      testID={`analysis-pick-${item.id}`}
      style={[
        styles.shell,
        {
          gap: theme.spacing.md * scaleSpace,
          padding: theme.spacing.lg * scaleSpace,
          borderRadius: theme.radii.lg,
          borderColor: theme.colors.border,
          backgroundColor: withAlpha(theme.colors.surface, theme.isDark ? 0.55 : 1),
        },
      ]}
    >
      {rationale?.trim() ? (
        <View style={{ gap: theme.spacing.xs * scaleSpace }}>
          <Text
            style={[
              styles.slot,
              { color: theme.colors.accent, fontSize: 11 * scaleFont },
            ]}
          >
            {slotLabel}
          </Text>
          <Text
            style={[
              styles.rationale,
              {
                color: theme.colors.text,
                fontSize: 15 * scaleFont,
                lineHeight: 23 * scaleFont,
              },
            ]}
          >
            {rationale}
          </Text>
        </View>
      ) : null}

      <ContentCard
        variant="feature"
        item={item}
        kicker={cardKicker(item, (key) => t(`home:${key}`))}
        meta={cardDurationMeta(item, (key, opts) => t(`home:${key}`, opts))}
        divider={false}
        actions={
          isSignedIn ? (
            <>
              <ContentCardLikeAction
                isLiked={isLiked}
                onPress={handleLike}
                accessibilityLabel={t("discover:actions.like")}
              />
              <ContentCardFavoriteAction
                contentId={item.id as Id<"contents">}
                accessibilityLabel={t("library:bookmark.saveCta")}
                savedAccessibilityLabel={t("library:bookmark.savedCta")}
              />
              <ContentCardOverflowAction
                contentId={item.id as Id<"contents">}
                focus="discovery"
                accessibilityLabel={t("discover:actions.more")}
              />
            </>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  slot: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1.2,
  },
  rationale: {
    fontFamily: fontFamilies.body,
  },
});
