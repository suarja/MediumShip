import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { HapticsService } from "../../features/haptics/haptics";
import { useResponsive } from "../../features/responsive/use-responsive";
import { withAlpha } from "../../features/theme/contrast";
import { fontFamilies } from "../../features/theme/fonts";
import { useAppTheme } from "../../features/theme/theme-provider";

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function MembershipThanksSheet({ visible, onDismiss }: Props) {
  const { t } = useTranslation("paywall");
  const { theme } = useAppTheme();
  const { isTablet, scaleFont, scaleSpace } = useResponsive();
  const insets = useSafeAreaInsets();
  const benefits = t("thanks.benefits", { returnObjects: true }) as string[];
  const maxWidth = isTablet ? 520 : undefined;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={[styles.backdrop, { backgroundColor: withAlpha(theme.colors.heading, 0.52) }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          accessibilityLabel="Dismiss"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radii.xl,
              borderTopRightRadius: theme.radii.xl,
              borderColor: theme.colors.border,
              paddingBottom: insets.bottom + 20 * scaleSpace,
              alignSelf: "center",
              width: maxWidth ?? "100%",
              shadowColor: theme.colors.heading,
            },
          ]}
        >
          <View style={styles.grab}>
            <View
              style={[styles.grabBar, { backgroundColor: withAlpha(theme.colors.heading, 0.18) }]}
            />
          </View>

          <ScrollView
            contentContainerStyle={[styles.body, { gap: 14 * scaleSpace }]}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[
                styles.title,
                { color: theme.colors.heading, fontSize: (isTablet ? 24 : 22) * scaleFont },
              ]}
            >
              {t("thanks.title")}
            </Text>

            <Text
              style={[
                styles.bodyText,
                { color: theme.colors.textMuted, fontSize: (isTablet ? 14 : 13) * scaleFont },
              ]}
            >
              {t("thanks.body")}
            </Text>

            <View style={[styles.benefits, { gap: 8 * scaleSpace }]}>
              {Array.isArray(benefits) &&
                benefits.map((benefit, index) => (
                  <View key={index} style={[styles.benefitRow, { gap: 8 * scaleSpace }]}>
                    <Text
                      style={[
                        styles.checkmark,
                        { color: theme.colors.premium, fontSize: 10 * scaleFont },
                      ]}
                    >
                      ✓
                    </Text>
                    <Text
                      style={[
                        styles.benefitLabel,
                        { color: theme.colors.text, fontSize: (isTablet ? 14 : 12) * scaleFont },
                      ]}
                    >
                      {benefit}
                    </Text>
                  </View>
                ))}
            </View>

            <Pressable
              accessibilityRole="button"
              testID="membership-thanks-dismiss"
              onPress={() => {
                void HapticsService.light();
                onDismiss();
              }}
              style={({ pressed }) => [
                styles.primaryCta,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: theme.colors.heading,
                  paddingVertical: 14 * scaleSpace,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.primaryCtaLabel,
                  { color: theme.colors.canvas, fontSize: (isTablet ? 14 : 13) * scaleFont },
                ]}
              >
                {t("thanks.cta")}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  sheet: {
    flexShrink: 1,
    maxHeight: "85%",
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 16,
  },
  grab: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  grabBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  title: {
    fontFamily: fontFamilies.display,
    letterSpacing: -0.3,
  },
  bodyText: {
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  benefits: {
    width: "100%",
    marginVertical: 4,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkmark: {
    fontFamily: fontFamilies.mono,
    width: 14,
  },
  benefitLabel: {
    fontFamily: fontFamilies.body,
    flex: 1,
    lineHeight: 18,
  },
  primaryCta: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginTop: 4,
  },
  primaryCtaLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.82,
  },
});
