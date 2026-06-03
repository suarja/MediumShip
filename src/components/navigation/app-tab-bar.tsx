import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

const TAB_META: Record<string, { icon: string; labelKey: string }> = {
  home: { icon: "◉", labelKey: "home" },
  premium: { icon: "✦", labelKey: "premium" },
  profile: { icon: "○", labelKey: "profile" },
  settings: { icon: "☰", labelKey: "settings" },
};

type AppTabBarProps =
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]> extends (
    props: infer Props,
  ) => unknown
    ? Props
    : never;

export function AppTabBar({ state, descriptors, navigation }: AppTabBarProps) {
  const { t } = useTranslation("navigation");

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = TAB_META[route.name] ?? { icon: "•", labelKey: route.name };

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tab,
                isFocused && styles.tabActive,
                pressed && styles.tabPressed,
              ]}
            >
              <Text style={[styles.icon, isFocused && styles.iconActive]}>{meta.icon}</Text>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {t(meta.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
    backgroundColor: "#F4F1EA",
  },
  inner: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(16,24,40,0.08)",
    backgroundColor: "rgba(255,255,255,0.88)",
    padding: 8,
  },
  tab: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 18,
  },
  tabActive: {
    backgroundColor: "#101828",
  },
  tabPressed: {
    opacity: 0.85,
  },
  icon: {
    color: "#667085",
    fontSize: 14,
    fontWeight: "700",
  },
  iconActive: {
    color: "#FFFFFF",
  },
  label: {
    color: "#667085",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  labelActive: {
    color: "#FFFFFF",
  },
});
