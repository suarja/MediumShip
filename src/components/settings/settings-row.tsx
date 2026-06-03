import { PropsWithChildren, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SettingsRowProps = PropsWithChildren<{
  label: string;
  description?: string;
  value?: string;
  icon?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  isLast?: boolean;
}>;

export function SettingsRow({
  label,
  description,
  value,
  icon,
  onPress,
  danger = false,
  isLast = false,
  children,
}: SettingsRowProps) {
  const content = (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.left}>
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <View style={styles.copy}>
          <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      </View>
      <View style={styles.right}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {children}
        {onPress ? <Text style={styles.chevron}>›</Text> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16,24,40,0.06)",
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F2F4F7",
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: "#101828",
    fontSize: 15,
    fontWeight: "600",
  },
  labelDanger: {
    color: "#B42318",
  },
  description: {
    color: "#667085",
    fontSize: 13,
    lineHeight: 18,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  value: {
    color: "#667085",
    fontSize: 14,
    fontWeight: "500",
  },
  chevron: {
    color: "#98A2B3",
    fontSize: 18,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
