import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { fontFamilies } from "../../features/theme/fonts";
import { useResponsive } from "../../features/responsive/use-responsive";
import { useAppTheme } from "../../features/theme/theme-provider";

type BriefingInviteModalProps = {
  visible: boolean;
  previewText?: string;
  onOpen: () => void;
  onDismiss: () => void;
};

export function BriefingInviteModal({
  visible,
  previewText,
  onOpen,
  onDismiss,
}: BriefingInviteModalProps) {
  const { t } = useTranslation("insights");
  const { theme } = useAppTheme();
  const { scaleFont, scaleSpace } = useResponsive();

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
          testID="briefing-invite-modal"
          style={[
            styles.sheet,
            {
              borderRadius: theme.radii.xl,
              backgroundColor: theme.colors.surface,
              gap: theme.spacing.md * scaleSpace,
              padding: theme.spacing.xl * scaleSpace,
              shadowColor: theme.colors.heading,
            },
          ]}
          onPress={() => {}}
        >
          <Text
            style={[
              styles.kicker,
              { color: theme.colors.accent, fontSize: 12 * scaleFont },
            ]}
          >
            {t("invite.kicker")}
          </Text>
          <Text
            style={[
              styles.title,
              { color: theme.colors.heading, fontSize: 22 * scaleFont },
            ]}
          >
            {t("invite.title")}
          </Text>
          <Text
            style={[
              styles.body,
              {
                color: theme.colors.textMuted,
                fontSize: 15 * scaleFont,
                lineHeight: 22 * scaleFont,
              },
            ]}
          >
            {t("invite.body")}
          </Text>
          {previewText?.trim() ? (
            <Text
              numberOfLines={3}
              style={[
                styles.preview,
                {
                  color: theme.colors.text,
                  fontSize: 15 * scaleFont,
                  lineHeight: 22 * scaleFont,
                },
              ]}
            >
              {previewText}
            </Text>
          ) : null}
          <View style={[styles.actions, { gap: theme.spacing.sm * scaleSpace }]}>
            <Pressable
              accessibilityRole="button"
              testID="briefing-invite-open"
              onPress={onOpen}
              style={({ pressed }) => [
                styles.button,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.heading,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonLabel, { color: theme.colors.canvas }]}>
                {t("invite.open")}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              testID="briefing-invite-dismiss"
              onPress={onDismiss}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                {
                  borderRadius: theme.radii.md,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceMuted,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.buttonLabel, { color: theme.colors.heading }]}>
                {t("invite.later")}
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
  kicker: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fontFamilies.body,
  },
  preview: {
    fontFamily: fontFamilies.body,
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
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
