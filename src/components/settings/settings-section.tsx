import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import { fontFamilies } from "../../features/theme/fonts";
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
    fontFamily: fontFamilies.display,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  card: {
    overflow: "hidden",
    borderWidth: 1,
  },
});
