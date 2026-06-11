import type { ReactNode } from "react";
import { AppLink } from "../navigation/app-link";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { KIND_GLYPH, PREMIUM_ON_FILL, kindAccent } from "../../features/content/card-presentation";
import { HapticsService } from "../../features/haptics/haptics";
import type { ContentCardModel } from "../../features/content/types";
import { useContentAccessBadge } from "../../features/tenant/use-access-badge";
import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * Flat discovery card — category/type top-right of the title row, tight summary
 * stack, then a compact footer: duration + premium left, icon actions right.
 */
export function ContentFeatureCard({
  item,
  kicker,
  meta,
  actions,
}: {
  item: ContentCardModel;
  /** Editorial category, or format name when category is absent. */
  kicker: string;
  /** Duration / reading time only (no inline premium text). */
  meta: string;
  /** @deprecated Feature cards never draw inter-item dividers. */
  divider?: boolean;
  actions?: ReactNode;
}) {
  const { t } = useTranslation("home");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const thumb = 72 * scaleSpace;
  const hasEditorialCategory = Boolean(item.category?.trim());
  const accessBadge = useContentAccessBadge(item.isPremium);
  const showFooter = Boolean(meta || accessBadge.show || actions);
  const kAccent = kindAccent(item.kind, theme);

  return (
    <View
      testID="content-card-feature"
      style={[
        styles.card,
        { paddingVertical: theme.spacing.xs * scaleSpace },
      ]}
    >
      <View style={[styles.row, { gap: theme.spacing.md * scaleSpace }]}>
        <View
          style={[
            styles.thumb,
            {
              width: thumb,
              height: thumb,
              borderRadius: theme.radii.sm,
              backgroundColor: kAccent.accentSoft,
            },
          ]}
        >
          {item.coverImageUrl ? (
            <Image
              accessibilityLabel={`${item.title} thumbnail`}
              source={{ uri: item.coverImageUrl }}
              style={styles.thumbnail}
            />
          ) : (
            <Text
              style={[
                styles.thumbGlyph,
                { color: kAccent.accent, fontSize: 24 * scaleFont },
              ]}
            >
              {KIND_GLYPH[item.kind]}
            </Text>
          )}
        </View>

        <View style={[styles.copy, { gap: 2 * scaleSpace }]}>
          <AppLink href={item.href as never} asChild>
            <Pressable
              accessibilityRole="link"
              onPress={() => void HapticsService.light()}
              style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
            >
              <View style={{ gap: 2 * scaleSpace }}>
                <View
                  style={[
                    styles.titleRow,
                    { gap: theme.spacing.sm * scaleSpace },
                  ]}
                >
                  <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
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
                  {hasEditorialCategory ? (
                    <Text
                      numberOfLines={1}
                      testID="content-card-title-category"
                      style={[
                        styles.titleLabel,
                        { color: kAccent.accent, fontSize: 12 * scaleFont },
                      ]}
                    >
                      {kicker}
                    </Text>
                  ) : (
                    <Text
                      accessibilityLabel={item.kindLabel}
                      testID="content-card-title-kind"
                      style={[
                        styles.titleKindGlyph,
                        { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
                      ]}
                    >
                      {KIND_GLYPH[item.kind]}
                    </Text>
                  )}
                </View>
                {item.summary ? (
                  <Text
                    numberOfLines={4}
                    ellipsizeMode="tail"
                    style={[
                      styles.summary,
                      {
                        color: theme.colors.textMuted,
                        fontSize: 13 * scaleFont,
                        lineHeight: 17 * scaleFont,
                      },
                    ]}
                  >
                    {item.summary}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          </AppLink>

          {showFooter ? (
            <View
              testID="content-card-footer"
              style={[
                styles.footer,
                {
                  gap: theme.spacing.sm * scaleSpace,
                  marginTop: 1 * scaleSpace,
                },
              ]}
            >
              <View
                style={[
                  styles.footerMeta,
                  { gap: 6 * scaleSpace, minHeight: 28 * scaleSpace },
                ]}
              >
                {meta ? (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.meta,
                      { color: theme.colors.textMuted, fontSize: 12 * scaleFont },
                    ]}
                  >
                    {meta}
                  </Text>
                ) : null}
                {accessBadge.show ? (
                  <View
                    testID="content-card-premium-badge"
                    style={[
                      styles.premiumBadge,
                      {
                        borderRadius: theme.radii.pill,
                        backgroundColor: theme.colors.premium,
                        paddingHorizontal: 8 * scaleSpace,
                        paddingVertical: 3 * scaleSpace,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.premiumLabel,
                        { color: PREMIUM_ON_FILL, fontSize: 12 * scaleFont },
                      ]}
                    >
                      {`★ ${t("premiumTag")}`}
                    </Text>
                  </View>
                ) : null}
              </View>

              {actions ? (
                <View
                  testID="content-card-actions"
                  style={[styles.actions, { gap: 2 * scaleSpace }]}
                >
                  {actions}
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  thumb: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  thumbnail: { width: "100%", height: "100%" },
  thumbGlyph: { fontWeight: "700" },
  copy: { flex: 1, minWidth: 0 },
  pressable: {},
  pressed: { opacity: 0.88 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamilies.display,
    letterSpacing: -0.2,
  },
  titleLabel: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    flexShrink: 0,
    maxWidth: 80,
    textAlign: "right",
    paddingTop: 2,
  },
  titleKindGlyph: {
    fontWeight: "700",
    flexShrink: 0,
    lineHeight: 16,
    paddingTop: 1,
  },
  summary: {
    fontFamily: fontFamilies.body,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerMeta: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  meta: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  premiumBadge: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  premiumLabel: {
    fontFamily: fontFamilies.mono,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
});
