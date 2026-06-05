import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../features/theme/theme-provider";

const TAB_META: Record<string, { icon: string; labelKey: string }> = {
  home: { icon: "◉", labelKey: "home" },
  explore: { icon: "⌕", labelKey: "explore" },
  library: { icon: "▤", labelKey: "library" },
  profile: { icon: "○", labelKey: "profile" },
};

const PILL_HEIGHT = 72;
const PILL_GAP = 12;

/**
 * Vertical space a screen should leave at the bottom so its content clears the
 * floating tab bar (pill height + its bottom offset including the safe inset).
 */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return PILL_HEIGHT + PILL_GAP + Math.max(insets.bottom, PILL_GAP);
}

type AppTabBarProps =
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]> extends (
    props: infer Props,
  ) => unknown
    ? Props
    : never;

export function AppTabBar({ state, descriptors, navigation }: AppTabBarProps) {
  const { t } = useTranslation("navigation");
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((route) => {
    const href = (descriptors[route.key]?.options as { href?: string | null } | undefined)
      ?.href;
    return href !== null && route.name in TAB_META;
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outer,
        { paddingBottom: Math.max(insets.bottom, PILL_GAP) },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            borderRadius: theme.radii.xl,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.tabBarCard,
            shadowColor: theme.colors.heading,
          },
        ]}
      >
        {visibleRoutes.map((route) => {
          const isFocused =
            state.index === state.routes.findIndex((item) => item.key === route.key);
          const meta = TAB_META[route.name];

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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  inner: {
    flexDirection: "row",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    // Floating elevation
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
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
