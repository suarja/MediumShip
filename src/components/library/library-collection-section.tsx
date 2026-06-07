import type { ComponentProps } from "react";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type LibraryCollectionItem = {
  id: string;
  href: string;
  title: string;
  eyebrow: string;
  meta: string;
  imageUrl?: string;
  iconName: IconName;
  badgeLabel: string;
  tone?: "accent" | "premium";
};

type LibraryCollectionSectionProps = {
  title: string;
  subtitle: string;
  /** When true, section chrome is rendered by the parent screen header. */
  hideHeader?: boolean;
  /** Preview keeps the featured hero + capped rows; full lists every item as a row. */
  mode?: "preview" | "full";
  items: LibraryCollectionItem[];
  isLoading: boolean;
  loadingLabel: string;
  emptyTitle: string;
  emptyBody: string;
  emptyIconName: IconName;
  emptyCtaLabel?: string;
  emptyCtaHref?: string;
};

function LibraryCollectionRow({
  item,
  scaleFont,
  scaleSpace,
}: {
  item: LibraryCollectionItem;
  scaleFont: number;
  scaleSpace: number;
}) {
  const { theme } = useAppTheme();

  return (
    <Link href={item.href as never} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <View
          style={[
            styles.rowCard,
            {
              borderRadius: theme.radii.lg,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              gap: theme.spacing.md * scaleSpace,
              padding: theme.spacing.md * scaleSpace,
            },
          ]}
        >
          <View
            style={[
              styles.rowMedia,
              {
                width: 72 * scaleSpace,
                height: 72 * scaleSpace,
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.surfaceMuted,
              },
            ]}
          >
            {item.imageUrl ? (
              <Image
                accessibilityLabel={`${item.title} thumbnail`}
                source={{ uri: item.imageUrl }}
                style={styles.cover}
              />
            ) : (
              <View
                style={[
                  styles.fallbackMedia,
                  { backgroundColor: theme.colors.canvasAccent },
                ]}
              >
                <Ionicons
                  color={theme.colors.accent}
                  name={item.iconName}
                  size={20 * scaleFont}
                />
              </View>
            )}
          </View>

          <View style={[styles.rowCopy, { gap: 4 * scaleSpace }]}>
            <Text
              numberOfLines={1}
              style={[
                styles.rowEyebrow,
                {
                  color:
                    item.tone === "premium"
                      ? theme.colors.premium
                      : theme.colors.accent,
                  fontSize: 10 * scaleFont,
                },
              ]}
            >
              {item.eyebrow}
            </Text>
            <Text
              numberOfLines={2}
              style={[
                styles.rowTitle,
                { color: theme.colors.heading, fontSize: 17 * scaleFont },
              ]}
            >
              {item.title}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.rowMeta,
                { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
              ]}
            >
              {item.meta}
            </Text>
          </View>

          <View
            style={[
              styles.rowBadge,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: withAlpha(
                  item.tone === "premium"
                    ? theme.colors.premium
                    : theme.colors.accent,
                  0.14,
                ),
              },
            ]}
          >
            <Ionicons
              color={
                item.tone === "premium"
                  ? theme.colors.premium
                  : theme.colors.accent
              }
              name={item.iconName}
              size={16 * scaleFont}
            />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export function LibraryCollectionSection({
  title,
  subtitle,
  hideHeader = false,
  mode = "preview",
  items,
  isLoading,
  loadingLabel,
  emptyTitle,
  emptyBody,
  emptyIconName,
  emptyCtaLabel,
  emptyCtaHref,
}: LibraryCollectionSectionProps) {
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();

  const featured = mode === "full" ? undefined : items[0];
  const rest =
    mode === "full"
      ? items
      : items.slice(1, isTablet ? 5 : 4);
  const featuredHeroBg = theme.isDark ? theme.colors.canvasAccent : theme.colors.heading;
  const featuredOnHero = theme.isDark ? theme.colors.heading : theme.colors.canvas;
  const featuredMediaHeight = (isTablet ? 168 : 140) * scaleSpace;

  return (
    <View style={[styles.section, { gap: theme.spacing.md * scaleSpace }]}>
      {hideHeader ? null : (
        <View style={[styles.sectionHeader, { gap: 4 * scaleSpace }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.heading, fontSize: 24 * scaleFont },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              { color: theme.colors.textMuted, fontSize: 15 * scaleFont },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      )}

      {isLoading ? (
        <View
          style={[
            styles.loadingCard,
            {
              borderRadius: theme.radii.xl,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              gap: theme.spacing.sm * scaleSpace,
            },
          ]}
        >
          <ActivityIndicator color={theme.colors.accent} />
          <Text
            style={[
              styles.loadingLabel,
              { color: theme.colors.textMuted, fontSize: 14 * scaleFont },
            ]}
          >
            {loadingLabel}
          </Text>
        </View>
      ) : mode === "full" && rest.length > 0 ? (
        <View style={[styles.rows, { gap: theme.spacing.sm * scaleSpace }]}>
          {rest.map((item) => (
            <LibraryCollectionRow
              item={item}
              key={item.id}
              scaleFont={scaleFont}
              scaleSpace={scaleSpace}
            />
          ))}
        </View>
      ) : featured ? (
        <View style={[styles.contentStack, { gap: theme.spacing.md * scaleSpace }]}>
          <Link href={featured.href as never} asChild>
            <Pressable
              accessibilityRole="link"
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <View
                style={[
                  styles.featuredCard,
                  {
                    borderRadius: theme.radii.xl,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <View
                  style={[
                    styles.featuredMedia,
                    {
                      height: featuredMediaHeight,
                      backgroundColor: theme.colors.surfaceMuted,
                    },
                  ]}
                >
                  {featured.imageUrl ? (
                    <Image
                      accessibilityLabel={`${featured.title} cover`}
                      source={{ uri: featured.imageUrl }}
                      style={styles.cover}
                    />
                  ) : (
                    <View
                      style={[
                        styles.fallbackMedia,
                        { backgroundColor: theme.colors.canvasAccent },
                      ]}
                    >
                      <Ionicons
                        color={theme.colors.accent}
                        name={featured.iconName}
                        size={32 * scaleFont}
                      />
                    </View>
                  )}

                  <View
                    style={[
                      styles.featuredBadge,
                      {
                        borderRadius: theme.radii.pill,
                        backgroundColor: withAlpha(theme.colors.surface, 0.88),
                      },
                    ]}
                  >
                    <Ionicons
                      color={
                        featured.tone === "premium"
                          ? theme.colors.premium
                          : theme.colors.accent
                      }
                      name={featured.iconName}
                      size={14 * scaleFont}
                    />
                    <Text
                      style={[
                        styles.featuredBadgeLabel,
                        { color: theme.colors.heading, fontSize: 11 * scaleFont },
                      ]}
                    >
                      {featured.badgeLabel}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.featuredBody,
                    {
                      gap: 4 * scaleSpace,
                      padding: theme.spacing.md * scaleSpace,
                      backgroundColor: featuredHeroBg,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.featuredEyebrow,
                      {
                        color:
                          featured.tone === "premium"
                            ? theme.colors.premium
                            : theme.colors.accent,
                        fontSize: 10 * scaleFont,
                      },
                    ]}
                  >
                    {featured.eyebrow}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.featuredTitle,
                      {
                        color: featuredOnHero,
                        fontSize: 18 * scaleFont,
                        lineHeight: 22 * scaleFont,
                      },
                    ]}
                  >
                    {featured.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.featuredMeta,
                      {
                        color: withAlpha(featuredOnHero, theme.isDark ? 0.72 : 0.68),
                        fontSize: 12 * scaleFont,
                      },
                    ]}
                  >
                    {featured.meta}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Link>

          {rest.length > 0 ? (
            <View style={[styles.rows, { gap: theme.spacing.sm * scaleSpace }]}>
              {rest.map((item) => (
                <LibraryCollectionRow
                  item={item}
                  key={item.id}
                  scaleFont={scaleFont}
                  scaleSpace={scaleSpace}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View
          style={[
            styles.emptyCard,
            {
              borderRadius: theme.radii.xl,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              gap: theme.spacing.md * scaleSpace,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIconWrap,
              {
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.accentSoft,
              },
            ]}
          >
            <Ionicons
              color={theme.colors.accent}
              name={emptyIconName}
              size={26 * scaleFont}
            />
          </View>
          <View style={[styles.emptyCopy, { gap: 6 * scaleSpace }]}>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.colors.heading, fontSize: 20 * scaleFont },
              ]}
            >
              {emptyTitle}
            </Text>
            <Text
              style={[
                styles.emptyBody,
                { color: theme.colors.textMuted, fontSize: 15 * scaleFont },
              ]}
            >
              {emptyBody}
            </Text>
          </View>
          {emptyCtaLabel && emptyCtaHref ? (
            <Link href={emptyCtaHref as never} asChild>
              <Pressable
                accessibilityRole="link"
                style={({ pressed }) => [
                  styles.emptyButton,
                  {
                    borderRadius: theme.radii.pill,
                    backgroundColor: theme.colors.accent,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.emptyButtonLabel,
                    { color: theme.colors.accentContrast, fontSize: 14 * scaleFont },
                  ]}
                >
                  {emptyCtaLabel}
                </Text>
              </Pressable>
            </Link>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  sectionHeader: {},
  sectionTitle: {
    fontFamily: fontFamilies.displayBold,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: fontFamilies.body,
    lineHeight: 22,
  },
  contentStack: {},
  loadingCard: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  loadingLabel: {
    fontFamily: fontFamilies.body,
    textAlign: "center",
  },
  featuredCard: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  featuredMedia: {
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  fallbackMedia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  featuredBadgeLabel: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  featuredBody: {},
  featuredEyebrow: {
    fontFamily: fontFamilies.bodySemiBold,
    letterSpacing: 0.2,
  },
  featuredTitle: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.25,
  },
  featuredMeta: {
    fontFamily: fontFamilies.body,
    lineHeight: 16,
  },
  rows: {},
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowMedia: {
    overflow: "hidden",
    flexShrink: 0,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowEyebrow: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  rowTitle: {
    fontFamily: fontFamilies.display,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  rowMeta: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
  },
  rowBadge: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCopy: {
    maxWidth: 440,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: fontFamilies.displayBold,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: fontFamilies.body,
    lineHeight: 22,
    textAlign: "center",
  },
  emptyButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyButtonLabel: {
    fontFamily: fontFamilies.bodySemiBold,
  },
  pressed: {
    opacity: 0.88,
  },
});
