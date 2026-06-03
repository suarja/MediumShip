import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { useAppTheme } from "../../src/features/theme/theme-provider";

export default function PremiumScreen() {
  const { t } = useTranslation("premium");
  const { theme } = useAppTheme();

  return (
    <Screen>
      <View
        style={[
          styles.card,
          {
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>Premium</Text>
        <Text style={[styles.title, { color: theme.colors.heading }]}>
          {t("title")}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          Theme-ready premium surface for the tenant brand system.
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
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
});
