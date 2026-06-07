import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { normalizeScoringKey } from "../../../convex/discovery/scoring";
import { fontFamilies } from "../../features/theme/fonts";
import { withAlpha } from "../../features/theme/contrast";
import { useAppTheme } from "../../features/theme/theme-provider";
import { useResponsive } from "../../features/responsive/use-responsive";
import { useCategoryInterests } from "../../features/categories/use-category-interests";
import { SettingsRow } from "./settings-row";

export function CategoryInterestsItem({ isLast = false }: { isLast?: boolean }) {
  const { t } = useTranslation("settings");
  const { theme } = useAppTheme();
  const { scaleSpace } = useResponsive();
  const [open, setOpen] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const { options, selectedKeys, isLoading, isSignedIn, toggleCategory } =
    useCategoryInterests();

  const selectedCount = selectedKeys.size;
  const value =
    selectedCount === 0
      ? t("interests.noneSelected")
      : t("interests.selectedCount", { count: selectedCount });

  const handleToggle = async (label: string) => {
    if (!isSignedIn || busyLabel !== null) {
      return;
    }

    try {
      setBusyLabel(label);
      await toggleCategory(label);
    } finally {
      setBusyLabel(null);
    }
  };

  return (
    <>
      <SettingsRow
        label={t("interests.label")}
        description={t("interests.description")}
        value={value}
        onPress={() => setOpen(true)}
        isLast={isLast}
      />

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={[
              styles.sheet,
              {
                borderRadius: theme.radii.xl,
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.heading,
              },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.sheetTitle, { color: theme.colors.heading }]}>
              {t("interests.label")}
            </Text>
            <Text style={[styles.sheetSubtitle, { color: theme.colors.textMuted }]}>
              {t("interests.pickerDescription")}
            </Text>

            {!isSignedIn ? (
              <View
                style={[
                  styles.guestBanner,
                  {
                    borderRadius: theme.radii.lg,
                    borderColor: theme.colors.border,
                    backgroundColor: withAlpha(theme.colors.accent, theme.isDark ? 0.12 : 0.06),
                  },
                ]}
              >
                <Text style={[styles.guestText, { color: theme.colors.heading }]}>
                  {t("interests.signInPrompt")}
                </Text>
              </View>
            ) : isLoading ? (
              <ActivityIndicator color={theme.colors.accent} />
            ) : (
              <View
                style={[
                  styles.chipCloud,
                  { gap: 10 * scaleSpace },
                ]}
              >
                {options.map((option) => {
                  const active = selectedKeys.has(normalizeScoringKey(option.label));
                  const busy = busyLabel === option.label;

                  return (
                    <Pressable
                      key={option.label}
                      disabled={busyLabel !== null}
                      onPress={() => void handleToggle(option.label)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          borderRadius: theme.radii.pill,
                          borderColor: active
                            ? theme.colors.accent
                            : theme.colors.border,
                          backgroundColor: active
                            ? withAlpha(theme.colors.accent, theme.isDark ? 0.22 : 0.12)
                            : theme.colors.surfaceMuted,
                        },
                        pressed && styles.chipPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipIcon,
                          { color: active ? theme.colors.accent : theme.colors.textMuted },
                        ]}
                      >
                        {option.icon}
                      </Text>
                      <Text
                        style={[
                          styles.chipLabel,
                          { color: active ? theme.colors.accent : theme.colors.heading },
                        ]}
                      >
                        {option.label}
                      </Text>
                      {busy ? (
                        <ActivityIndicator size="small" color={theme.colors.accent} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    gap: 18,
    padding: 22,
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  sheetTitle: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
  },
  guestBanner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  guestText: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  chipCloud: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  chipPressed: {
    opacity: 0.86,
  },
  chipIcon: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
  },
  chipLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
  },
});
