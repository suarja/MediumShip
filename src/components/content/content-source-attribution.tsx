import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  type ContentSource,
  resolveContentSource,
} from "../../features/content/source";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type ContentSourceAttributionProps = {
  source?: ContentSource;
  canonicalUrl?: string;
  /** When true, adds a short note that only an extract is shown in-app. */
  showExtractNote?: boolean;
};

/**
 * Attribution block for externally ingested discovery content (Wikipedia today).
 * Modular by `source` so future providers can reuse the same surface.
 */
export function ContentSourceAttribution({
  source: sourceProp,
  canonicalUrl,
  showExtractNote = false,
}: ContentSourceAttributionProps) {
  const { t } = useTranslation("contentSource");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const source = resolveContentSource({ source: sourceProp });

  if (source === "cms") {
    return null;
  }

  const sourceLabel = t(`sources.${source}`);
  const canOpen = Boolean(canonicalUrl?.trim());

  return (
    <View
      testID="content-source-attribution"
      style={[
        styles.wrap,
        {
          gap: theme.spacing.sm * scaleSpace,
          padding: theme.spacing.md * scaleSpace,
          borderRadius: theme.radii.md,
          backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.12 : 0.06),
          borderColor: withAlpha(theme.colors.accent, theme.isDark ? 0.28 : 0.16),
        },
      ]}
    >
      <Text
        style={[
          styles.badge,
          { color: theme.colors.accent, fontSize: 12 * scaleFont },
        ]}
      >
        {sourceLabel}
      </Text>

      {showExtractNote ? (
        <Text
          style={[
            styles.note,
            { color: theme.colors.textMuted, fontSize: 14 * scaleFont, lineHeight: 20 * scaleFont },
          ]}
        >
          {t("extractNote")}
        </Text>
      ) : null}

      {canOpen ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            void Linking.openURL(canonicalUrl!);
          }}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text
            style={[
              styles.link,
              { color: theme.colors.accent, fontSize: 14 * scaleFont },
            ]}
          >
            {t("readOnSource", { source: sourceLabel })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  note: {
    fontFamily: fontFamilies.body,
  },
  link: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  pressed: {
    opacity: 0.85,
  },
});
