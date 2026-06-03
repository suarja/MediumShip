import { PropsWithChildren, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../features/theme/theme-provider";

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
  const { theme } = useAppTheme();

  const content = (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
      ]}
    >
      <View style={styles.left}>
        {icon ? (
          <View
            style={[
              styles.iconWrap,
              { borderRadius: theme.radii.md, backgroundColor: theme.colors.surfaceMuted },
            ]}
          >
            {icon}
          </View>
        ) : null}
        <View style={styles.copy}>
          <Text
            style={[
              styles.label,
              { color: danger ? theme.colors.danger : theme.colors.heading },
            ]}
          >
            {label}
          </Text>
          {description ? (
            <Text style={[styles.description, { color: theme.colors.textMuted }]}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.right}>
        {value ? <Text style={[styles.value, { color: theme.colors.textMuted }]}>{value}</Text> : null}
        {children}
        {onPress ? (
          <Text style={[styles.chevron, { color: theme.colors.textMuted }]}>›</Text>
        ) : null}
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
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 8,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
  chevron: {
    fontSize: 18,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
