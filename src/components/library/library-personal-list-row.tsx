import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
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
  itemCount?: number;
};

type StackLayerKey = "back" | "mid" | "front" | "single";

type StackLayerSpec = {
  key: StackLayerKey;
  coverUrl?: string;
  placeholderTone: "muted" | "premium" | "accent";
  style: ViewStyle;
};

export function LibraryPersonalListRow({
  onPress,
  title,
  meta,
  accessibilityLabel,
  previewCoverUrls = [],
  itemCount = 0,
}: LibraryPersonalListRowProps) {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const stackSize = 44 * scaleSpace;
  const hasItems = itemCount > 0;

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
        itemCount={hasItems ? itemCount : 0}
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
  itemCount,
  stackSize,
}: {
  previewCoverUrls: string[];
  itemCount: number;
  stackSize: number;
}) {
  const { theme } = useAppTheme();
  const layers = buildItemStackLayers(itemCount, previewCoverUrls);

  return (
    <View style={[styles.stack, { width: stackSize, height: stackSize }]}>
      {layers.map((layer) => {
        const toneColor =
          layer.placeholderTone === "muted"
            ? theme.colors.textMuted
            : layer.placeholderTone === "premium"
              ? theme.colors.premium
              : theme.colors.accent;

        return (
          <View
            key={layer.key}
            style={[
              styles.stackLayer,
              layer.style,
              {
                borderRadius: theme.radii.sm,
                overflow: "hidden",
                backgroundColor: withAlpha(
                  toneColor,
                  layer.coverUrl
                    ? theme.isDark
                      ? 0.2
                      : 0.12
                    : theme.isDark
                      ? layer.placeholderTone === "muted"
                        ? 0.35
                        : layer.placeholderTone === "premium"
                          ? 0.55
                          : 0.72
                      : layer.placeholderTone === "muted"
                        ? 0.22
                        : layer.placeholderTone === "premium"
                          ? 0.42
                          : 0.58,
                ),
              },
            ]}
          >
            {layer.coverUrl ? (
              <Image
                accessibilityIgnoresInvertColors
                source={{ uri: layer.coverUrl }}
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
  stackLayerSingle: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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

function buildItemStackLayers(
  itemCount: number,
  previewCoverUrls: string[],
): StackLayerSpec[] {
  const visibleCount = Math.min(itemCount, 3);

  if (visibleCount <= 0) {
    return [
      { key: "back", placeholderTone: "muted", style: styles.stackLayerBack },
      { key: "mid", placeholderTone: "premium", style: styles.stackLayerMid },
      { key: "front", placeholderTone: "accent", style: styles.stackLayerFront },
    ];
  }

  if (visibleCount === 1) {
    return [
      {
        key: "single",
        coverUrl: previewCoverUrls[0],
        placeholderTone: "accent",
        style: styles.stackLayerSingle,
      },
    ];
  }

  if (visibleCount === 2) {
    return [
      {
        key: "back",
        coverUrl: previewCoverUrls[1],
        placeholderTone: "muted",
        style: styles.stackLayerBack,
      },
      {
        key: "front",
        coverUrl: previewCoverUrls[0],
        placeholderTone: "accent",
        style: styles.stackLayerFront,
      },
    ];
  }

  return [
    {
      key: "back",
      coverUrl: previewCoverUrls[2],
      placeholderTone: "muted",
      style: styles.stackLayerBack,
    },
    {
      key: "mid",
      coverUrl: previewCoverUrls[1],
      placeholderTone: "premium",
      style: styles.stackLayerMid,
    },
    {
      key: "front",
      coverUrl: previewCoverUrls[0],
      placeholderTone: "accent",
      style: styles.stackLayerFront,
    },
  ];
}
