import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { formatResumeMeta } from "../../features/history/format-resume-meta";
import { useResume } from "../../features/history/use-resume";
import { HapticsService } from "../../features/haptics/haptics";
import { usePushWithReturn } from "../../features/navigation/app-navigation";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type ResumeCardProps = {
  enabled?: boolean;
  onPress?: () => void;
};

export function ResumeCard({ enabled = true, onPress }: ResumeCardProps = {}) {
  const { t } = useTranslation("library");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const pushWithReturn = usePushWithReturn();
  const { data: resume, isLoading } = useResume({ enabled });

  if (!enabled || isLoading || !resume) {
    return null;
  }

  const resumeTitle = resume.title;
  const resumeMeta = formatResumeMeta(resume, t);
  const progressPercent = `${Math.min(100, Math.max(0, resume.progressRatio * 100))}%`;

  const handlePress = () => {
    void HapticsService.light();
    if (onPress) {
      onPress();
      return;
    }
    pushWithReturn(`/${resume.kind}/${resume.contentId}`);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={resumeTitle}
      onPress={handlePress}
      testID="resume-card"
      style={({ pressed }) => [
        styles.resumeCard,
        {
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.heading,
        },
        pressed && styles.pressed,
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
        >
          {resume.heroImageUrl ? (
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="cover"
              source={{ uri: resume.heroImageUrl }}
              style={[
                styles.resumeCoverImage,
                { borderRadius: theme.radii.md },
              ]}
            />
          ) : null}
        </View>
        <View style={styles.resumeCopy}>
          <Text
            style={[
              styles.resumeTitle,
              {
                color: theme.colors.canvas,
                fontSize: 14 * scaleFont,
              },
            ]}
            numberOfLines={2}
          >
            {resumeTitle}
          </Text>
          <Text
            style={[
              styles.resumeMeta,
              {
                color: withAlpha(theme.colors.canvas, 0.64),
                fontSize: 10 * scaleFont,
              },
            ]}
            numberOfLines={1}
          >
            {resumeMeta}
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
          <Ionicons
            color={theme.colors.accentContrast}
            name="play"
            size={10 * scaleFont}
          />
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
            {
              width: progressPercent as ViewStyle["width"],
              backgroundColor: theme.colors.accent,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  resumeCard: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 2,
  },
  pressed: {
    opacity: 0.92,
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
    overflow: "hidden",
  },
  resumeCoverImage: {
    width: "100%",
    height: "100%",
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
  resumeBar: {
    height: 3,
    borderRadius: 999,
    marginTop: 10,
    overflow: "hidden",
  },
  resumeProgress: {
    height: "100%",
    borderRadius: 999,
  },
});
