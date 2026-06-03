import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useSelectedLanguage } from "../../i18n/use-selected-language";
import type { AppLanguage } from "../../i18n/resources";
import { SettingsRow } from "./settings-row";

export function LanguageItem({ isLast = false }: { isLast?: boolean }) {
  const { t } = useTranslation("settings");
  const { language, setLanguage } = useSelectedLanguage();
  const [open, setOpen] = useState(false);
  const [changingLanguage, setChangingLanguage] = useState<AppLanguage | null>(
    null,
  );

  const options = useMemo(
    () => [
      { value: "fr" as const, label: t("language.fr") },
      { value: "en" as const, label: t("language.en") },
    ],
    [t, language],
  );

  const selectedOption = options.find((option) => option.value === language);

  const handleSelect = async (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) {
      setOpen(false);
      return;
    }

    try {
      setChangingLanguage(nextLanguage);
      await setLanguage(nextLanguage);
      setOpen(false);
    } finally {
      setChangingLanguage(null);
    }
  };

  return (
    <>
      <SettingsRow
        label={t("language.label")}
        description={t("language.description")}
        value={selectedOption?.label}
        onPress={() => setOpen(true)}
        isLast={isLast}
      />

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{t("language.label")}</Text>
            <Text style={styles.sheetSubtitle}>{t("language.description")}</Text>

            <View style={styles.optionList}>
              {options.map((option, index) => {
                const active = option.value === language;
                const busy = changingLanguage === option.value;

                return (
                  <Pressable
                    key={option.value}
                    disabled={changingLanguage !== null}
                    onPress={() => void handleSelect(option.value)}
                    style={({ pressed }) => [
                      styles.option,
                      index < options.length - 1 && styles.optionBorder,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {option.label}
                    </Text>
                    {busy ? (
                      <ActivityIndicator size="small" color="#101828" />
                    ) : active ? (
                      <Text style={styles.check}>✓</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
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
    backgroundColor: "rgba(16,24,40,0.28)",
  },
  sheet: {
    gap: 18,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 22,
    shadowColor: "#101828",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  sheetTitle: {
    color: "#101828",
    fontSize: 22,
    fontWeight: "700",
  },
  sheetSubtitle: {
    color: "#667085",
    fontSize: 14,
    lineHeight: 20,
  },
  optionList: {
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(16,24,40,0.08)",
    backgroundColor: "#FCFCFD",
  },
  option: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16,24,40,0.06)",
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionText: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "600",
  },
  optionTextActive: {
    color: "#B42318",
  },
  check: {
    color: "#B42318",
    fontSize: 16,
    fontWeight: "800",
  },
});
