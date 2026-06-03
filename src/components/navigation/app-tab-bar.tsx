import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../features/theme/theme-provider";

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
  const { theme } = useAppTheme();

  return (
    <View style={[styles.outer, { backgroundColor: theme.colors.tabBar }]}>
      <View
        style={[
          styles.inner,
          {
            borderRadius: theme.radii.xl,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.tabBarCard,
          },
        ]}
      >
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
                isFocused && {
                  borderRadius: theme.radii.lg,
                  backgroundColor: theme.colors.heading,
                },
                pressed && styles.tabPressed,
              ]}
            >
              <Text
                style={[
                  styles.icon,
                  { color: isFocused ? theme.colors.surface : theme.colors.tabInactive },
                ]}
              >
                {meta.icon}
              </Text>
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? theme.colors.surface : theme.colors.tabInactive },
                ]}
              >
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
  },
  inner: {
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
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
  tabPressed: {
    opacity: 0.85,
  },
  icon: {
    fontSize: 14,
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
