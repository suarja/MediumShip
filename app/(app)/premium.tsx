import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function PremiumScreen() {
  const { t } = useTranslation("premium");
  const { theme, tenantName } = useAppTheme();

  return (
    <Screen>
      <View
        style={[
          styles.card,
          {
            borderRadius: theme.radii.lg,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>{tenantName}</Text>
        <Text style={[styles.title, { color: theme.colors.heading }]}>{t("title")}</Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {t("subtitle")}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    marginTop: 8,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eyebrow: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
  },
});
