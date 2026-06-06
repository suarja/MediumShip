import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useResponsive } from "../../features/responsive/use-responsive";
import { fontFamilies } from "../../features/theme/fonts";
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
  const { scaleFont, scaleSpace } = useResponsive();
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
            gap: 8 * scaleSpace,
            padding: 8 * scaleSpace,
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
                {
                  minHeight: 56 * scaleSpace,
                  gap: 3 * scaleSpace,
                  paddingHorizontal: 6 * scaleSpace,
                  paddingVertical: 4 * scaleSpace,
                },
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
                  {
                    fontSize: 16 * scaleFont,
                    lineHeight: 16 * scaleFont,
                    color: isFocused ? theme.colors.surface : theme.colors.tabInactive,
                  },
                ]}
              >
                {meta.icon}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    fontSize: 9 * scaleFont,
                    color: isFocused ? theme.colors.surface : theme.colors.tabInactive,
                  },
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
    borderWidth: StyleSheet.hairlineWidth,
    // Floating elevation
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  tabPressed: {
    opacity: 0.85,
  },
  icon: {
    fontWeight: "700",
    textAlign: "center",
  },
  label: {
    fontFamily: fontFamilies.mono,
    letterSpacing: 0.8,
    textAlign: "center",
    textTransform: "uppercase",
  },
});
