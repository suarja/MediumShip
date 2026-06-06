import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type LibraryPersonalListRowProps = {
  onPress: () => void;
  title?: string;
  meta?: string;
  accessibilityLabel?: string;
  previewCoverUrls?: string[];
};

type StackLayerKey = "back" | "mid" | "front";

const STACK_LAYER_ORDER: StackLayerKey[] = ["back", "mid", "front"];

const COVER_INDEX_BY_LAYER: Record<StackLayerKey, number> = {
  front: 0,
  mid: 1,
  back: 2,
};

const PLACEHOLDER_TONES = {
  back: "muted",
  mid: "premium",
  front: "accent",
} as const;

export function LibraryPersonalListRow({
  onPress,
  title,
  meta,
  accessibilityLabel,
  previewCoverUrls = [],
}: LibraryPersonalListRowProps) {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const stackSize = 44 * scaleSpace;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title ?? t("library:screen.listsPreviewTitle")}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          gap: 11 * scaleSpace,
          borderRadius: theme.radii.md,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 11 * scaleSpace,
          paddingVertical: 9 * scaleSpace,
        },
        pressed && styles.pressed,
      ]}
    >
      <ListCoverStack
        previewCoverUrls={previewCoverUrls}
        stackSize={stackSize}
      />

      <View style={styles.copy}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.heading,
              fontSize: 13.5 * scaleFont,
            },
          ]}
        >
          {title ?? t("library:screen.listsPreviewTitle")}
        </Text>
        <Text
          style={[
            styles.meta,
            {
              color: theme.colors.textMuted,
              fontSize: 9.5 * scaleFont,
            },
          ]}
        >
          {meta ?? t("library:screen.listsPreviewMeta")}
        </Text>
      </View>

      <Text
        style={[
          styles.chevron,
          {
            color: theme.colors.textMuted,
            fontSize: 14 * scaleFont,
          },
        ]}
      >
        ›
      </Text>
    </Pressable>
  );
}

function ListCoverStack({
  previewCoverUrls,
  stackSize,
}: {
  previewCoverUrls: string[];
  stackSize: number;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.stack, { width: stackSize, height: stackSize }]}>
      {STACK_LAYER_ORDER.map((layer) => {
        const coverUrl = previewCoverUrls[COVER_INDEX_BY_LAYER[layer]];
        const tone = PLACEHOLDER_TONES[layer];
        const toneColor =
          tone === "muted"
            ? theme.colors.textMuted
            : tone === "premium"
              ? theme.colors.premium
              : theme.colors.accent;
        const layerStyle =
          layer === "back"
            ? styles.stackLayerBack
            : layer === "mid"
              ? styles.stackLayerMid
              : styles.stackLayerFront;

        return (
          <View
            key={layer}
            style={[
              styles.stackLayer,
              layerStyle,
              {
                borderRadius: theme.radii.sm,
                overflow: "hidden",
                backgroundColor: withAlpha(
                  toneColor,
                  coverUrl
                    ? theme.isDark
                      ? 0.2
                      : 0.12
                    : theme.isDark
                      ? tone === "muted"
                        ? 0.35
                        : tone === "premium"
                          ? 0.55
                          : 0.72
                      : tone === "muted"
                        ? 0.22
                        : tone === "premium"
                          ? 0.42
                          : 0.58,
                ),
              },
            ]}
          >
            {coverUrl ? (
              <Image
                accessibilityIgnoresInvertColors
                source={{ uri: coverUrl }}
                style={styles.stackImage}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.88,
  },
  stack: {
    position: "relative",
    flexShrink: 0,
  },
  stackLayer: {
    position: "absolute",
  },
  stackImage: {
    width: "100%",
    height: "100%",
  },
  stackLayerBack: {
    top: 0,
    right: 6,
    bottom: 6,
    left: 0,
  },
  stackLayerMid: {
    top: 4,
    right: 3,
    bottom: 3,
    left: 3,
  },
  stackLayerFront: {
    top: 8,
    right: 0,
    bottom: 0,
    left: 6,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamilies.display,
    lineHeight: 16,
  },
  meta: {
    fontFamily: fontFamilies.body,
    marginTop: 2,
  },
  chevron: {
    fontFamily: fontFamilies.body,
    marginLeft: 4,
  },
});
