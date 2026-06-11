import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function PurchaseCelebrationModal({ visible, onDismiss }: Props) {
  const { t } = useTranslation("paywall");
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={[styles.backdrop, { backgroundColor: theme.colors.canvas }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.xl,
            },
          ]}
        >
          <Text style={styles.emoji}>🎉</Text>
          <Text style={[styles.title, { color: theme.colors.heading }]}>{t("celebrationTitle")}</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>{t("celebrationBody")}</Text>
          <Pressable
            accessibilityRole="button"
            testID="purchase-celebration-dismiss"
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: theme.colors.premium,
                borderRadius: theme.radii.pill,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.ctaLabel, { color: theme.colors.accentContrast }]}>
              {t("celebrationCta")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: 12,
    padding: 28,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  cta: {
    marginTop: 8,
    minHeight: 48,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  ctaLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
});
