import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAppTheme } from "../../features/theme/theme-provider";
import { SettingsRow } from "./settings-row";

type SettingsChoiceOption = {
  value: string;
  label: string;
  description?: string;
  swatches?: string[];
};

type SettingsChoiceItemProps = {
  label: string;
  description: string;
  value?: string;
  options: SettingsChoiceOption[];
  selectedValue: string;
  onSelect: (value: string) => Promise<void>;
  busyValue?: string | null;
  isLast?: boolean;
};

export function SettingsChoiceItem({
  label,
  description,
  value,
  options,
  selectedValue,
  onSelect,
  busyValue = null,
  isLast = false,
}: SettingsChoiceItemProps) {
  const [open, setOpen] = useState(false);
  const { theme } = useAppTheme();

  const handleSelect = async (nextValue: string) => {
    if (nextValue === selectedValue) {
      setOpen(false);
      return;
    }

    await onSelect(nextValue);
    setOpen(false);
  };

  return (
    <>
      <SettingsRow
        label={label}
        description={description}
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
              {label}
            </Text>
            <Text style={[styles.sheetSubtitle, { color: theme.colors.textMuted }]}>
              {description}
            </Text>

            <View
              style={[
                styles.optionList,
                {
                  borderRadius: theme.radii.lg,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceMuted,
                },
              ]}
            >
              {options.map((option, index) => {
                const active = option.value === selectedValue;
                const busy = busyValue === option.value;

                return (
                  <Pressable
                    key={option.value}
                    disabled={busyValue !== null}
                    onPress={() => void handleSelect(option.value)}
                    style={({ pressed }) => [
                      styles.option,
                      index < options.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                      },
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <View style={styles.optionCopy}>
                      <View style={styles.optionLabelRow}>
                        <Text
                          style={[
                            styles.optionText,
                            { color: active ? theme.colors.accent : theme.colors.heading },
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.swatches ? (
                          <View style={styles.swatches}>
                            {option.swatches.map((swatch) => (
                              <View
                                key={`${option.value}-${swatch}`}
                                style={[
                                  styles.swatch,
                                  {
                                    backgroundColor: swatch,
                                    borderColor: theme.colors.border,
                                  },
                                ]}
                              />
                            ))}
                          </View>
                        ) : null}
                      </View>
                      {option.description ? (
                        <Text
                          style={[
                            styles.optionDescription,
                            { color: theme.colors.textMuted },
                          ]}
                        >
                          {option.description}
                        </Text>
                      ) : null}
                    </View>
                    {busy ? (
                      <ActivityIndicator size="small" color={theme.colors.heading} />
                    ) : active ? (
                      <Text style={[styles.check, { color: theme.colors.accent }]}>✓</Text>
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
    fontSize: 22,
    fontWeight: "700",
  },
  sheetSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionList: {
    overflow: "hidden",
    borderWidth: 1,
  },
  option: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionCopy: {
    flex: 1,
    gap: 4,
  },
  optionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  swatches: {
    flexDirection: "row",
    gap: 6,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  check: {
    fontSize: 16,
    fontWeight: "800",
  },
});
