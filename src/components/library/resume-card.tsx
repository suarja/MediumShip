import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

/**
 * Static "resume / continue listening" card matching the mockup `p2__resume`.
 * Resume/progress wiring is deferred — this is faithful decoration shared by the
 * Library and Profile surfaces so the visual stays in one place.
 */
export function ResumeCard() {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();

  return (
    <View
      style={[
        styles.resumeCard,
        {
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.heading,
        },
      ]}
    >
      <Text
        style={[
          styles.resumeKicker,
          {
            color: theme.colors.premium,
            fontSize: 8 * scaleFont,
          },
        ]}
      >
        {t("library:screen.resumeKicker")}
      </Text>
      <View style={styles.resumeRow}>
        <View
          style={[
            styles.resumeCover,
            {
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.accent,
            },
          ]}
        />
        <View style={styles.resumeCopy}>
          <Text
            style={[
              styles.resumeTitle,
              {
                color: theme.colors.canvas,
                fontSize: 14 * scaleFont,
              },
            ]}
          >
            {t("library:screen.resumeTitle")}
          </Text>
          <Text
            style={[
              styles.resumeMeta,
              {
                color: withAlpha(theme.colors.canvas, 0.64),
                fontSize: 10 * scaleFont,
              },
            ]}
          >
            {t("library:screen.resumeMeta")}
          </Text>
        </View>
        <View
          style={[
            styles.resumePlay,
            {
              backgroundColor: theme.colors.accent,
            },
          ]}
        >
          <Text
            style={[
              styles.resumePlayLabel,
              {
                color: theme.colors.accentContrast,
                fontSize: 8 * scaleFont,
              },
            ]}
          >
            ▶
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.resumeBar,
          { backgroundColor: withAlpha(theme.colors.canvas, 0.16) },
        ]}
      >
        <View
          style={[
            styles.resumeProgress,
            { backgroundColor: theme.colors.accent },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  resumeCard: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 2,
  },
  resumeKicker: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  resumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resumeCover: {
    width: 40,
    height: 40,
  },
  resumeCopy: {
    flex: 1,
    minWidth: 0,
  },
  resumeTitle: {
    fontFamily: fontFamilies.display,
    lineHeight: 16,
  },
  resumeMeta: {
    fontFamily: fontFamilies.body,
    lineHeight: 14,
    marginTop: 2,
  },
  resumePlay: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  resumePlayLabel: {
    fontFamily: fontFamilies.bodyBold,
  },
  resumeBar: {
    height: 3,
    borderRadius: 999,
    marginTop: 10,
    overflow: "hidden",
  },
  resumeProgress: {
    width: "62%",
    height: "100%",
    borderRadius: 999,
  },
});
