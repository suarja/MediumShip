import { StyleSheet, Text } from "react-native";

import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * Shared editorial header for the detail bodies: accent kicker, italic-serif
 * headline, mono meta, and a serif lede divided from what follows. Rendered as
 * sibling text blocks so the detail shell's body gap controls vertical rhythm.
 */
export function DetailHeader({
  kicker,
  title,
  meta,
  lede,
  premium = false,
}: {
  kicker: string;
  title: string;
  meta?: string;
  lede?: string;
  premium?: boolean;
}) {
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();
  const accentTone = premium ? theme.colors.premium : theme.colors.accent;

  return (
    <>
      <Text style={[styles.kicker, { color: accentTone, fontSize: 12 * scaleFont }]}>{kicker}</Text>
      <Text
        style={[
          styles.title,
          { color: theme.colors.heading, fontSize: 28 * scaleFont, lineHeight: 32 * scaleFont },
        ]}
      >
        {title}
      </Text>
      {meta ? (
        <Text style={[styles.meta, { color: theme.colors.textMuted, fontSize: 12 * scaleFont }]}>
          {meta}
        </Text>
      ) : null}
      {lede ? (
        <Text
          style={[
            styles.lede,
            {
              color: theme.colors.text,
              borderTopColor: theme.colors.border,
              fontSize: 18 * scaleFont,
              lineHeight: 27 * scaleFont,
              paddingTop: theme.spacing.md * scaleSpace,
              marginTop: theme.spacing.xs * scaleSpace,
            },
          ]}
        >
          {lede}
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontFamily: fontFamilies.mono,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
  title: { fontFamily: fontFamilies.displayBoldItalic, letterSpacing: -0.4 },
  meta: { fontFamily: fontFamilies.mono, letterSpacing: 0.4 },
  lede: {
    fontFamily: fontFamilies.display,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
