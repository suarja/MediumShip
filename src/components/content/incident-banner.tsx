import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

export function IncidentBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const { t } = useTranslation("network");
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();

  return (
    <View
      style={[
        styles.banner,
        {
          borderRadius: theme.radii.md,
          backgroundColor: theme.colors.premiumSoft,
          borderColor: theme.colors.premium,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: theme.colors.premium }]} />
      <View style={styles.copy}>
        <Text style={[styles.label, { color: theme.colors.heading, fontSize: 13 * scaleFont }]}>
          {t("incidentLabel")}
        </Text>
        <Text style={[styles.body, { color: theme.colors.text, fontSize: 13 * scaleFont }]}>
          {message}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={t("dismiss")}
        accessibilityRole="button"
        onPress={onDismiss}
        style={({ pressed }) => [styles.close, pressed && styles.pressed]}
      >
        <Text style={[styles.closeGlyph, { color: theme.colors.heading }]}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 12,
    borderWidth: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  body: {
    fontFamily: fontFamilies.body,
    lineHeight: 18,
  },
  close: {
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
  },
  closeGlyph: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 18,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.84,
  },
});
