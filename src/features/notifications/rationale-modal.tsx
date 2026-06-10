import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { fontFamilies } from "../theme/fonts";
import { useResponsive } from "../responsive/use-responsive";
import { useAppTheme } from "../theme/theme-provider";

type RationaleModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

export function RationaleModal({ visible, onConfirm, onDismiss }: RationaleModalProps) {
  const { t } = useTranslation("notifications");
  const { theme } = useAppTheme();
  const { scaleSpace } = useResponsive();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        onPress={onDismiss}
      >
        <Pressable
          style={[
            styles.sheet,
            {
              borderRadius: theme.radii.xl,
              backgroundColor: theme.colors.surface,
              gap: 16 * scaleSpace,
              padding: 22 * scaleSpace,
              shadowColor: theme.colors.heading,
            },
          ]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: theme.colors.heading }]}>
            {t("rationale.title")}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            {t("rationale.body")}
          </Text>
          <View style={[styles.actions, { gap: 8 * scaleSpace }]}>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                {
                  borderRadius: theme.radii.md,
                  backgroundColor: theme.colors.accent,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonLabel, { color: theme.colors.accentContrast }]}>
                {t("rationale.confirm")}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onDismiss}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                {
                  borderRadius: theme.radii.md,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceMuted,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonLabel, { color: theme.colors.heading }]}>
                {t("rationale.dismiss")}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  title: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    marginTop: 4,
  },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
});
