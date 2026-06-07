import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { fontFamilies } from "../../features/theme/fonts";
import { withAlpha } from "../../features/theme/contrast";
import { useAppTheme } from "../../features/theme/theme-provider";
import { useCategoryInterests, useCategoryInterestTreeNodes } from "../../features/categories/use-category-interests";
import { CategoryInterestsPicker } from "./category-interests-picker";
import { SettingsRow } from "./settings-row";

export function CategoryInterestsItem({ isLast = false }: { isLast?: boolean }) {
  const { t } = useTranslation("settings");
  const { theme } = useAppTheme();
  const [open, setOpen] = useState(false);
  const { options, selectedKeys, isLoading, isSignedIn, toggleCategory } =
    useCategoryInterests();
  const treeNodes = useCategoryInterestTreeNodes();

  const selectedCount = selectedKeys.size;
  const value =
    selectedCount === 0
      ? t("interests.noneSelected")
      : t("interests.selectedCount", { count: selectedCount });

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
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <CategoryInterestsPicker
                  options={options}
                  selectedKeys={selectedKeys}
                  toggleCategory={toggleCategory}
                  treeNodes={treeNodes}
                />
              </ScrollView>
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
    maxHeight: "85%",
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
});
