import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

type SettingsSectionProps = PropsWithChildren<{
  title: string;
}>;

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  title: {
    color: "#101828",
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(16,24,40,0.08)",
    backgroundColor: "#FFFFFF",
  },
});
