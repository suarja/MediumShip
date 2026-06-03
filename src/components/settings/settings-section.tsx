import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../features/theme/theme-provider";

type SettingsSectionProps = PropsWithChildren<{
  title: string;
}>;

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.colors.heading }]}>{title}</Text>
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
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    overflow: "hidden",
    borderWidth: 1,
  },
});
