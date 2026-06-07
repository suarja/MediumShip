import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useResponsive } from "../../features/responsive/use-responsive";
import { useAppTheme } from "../../features/theme/theme-provider";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

type TabMeta = {
  icon: IoniconName;
  iconFocused: IoniconName;
  labelKey:
    | "home"
    | "discover"
    | "explore"
    | "library"
    | "profile"
    | "agenda"
    | "community"
    | "collections";
};

const TAB_ICON_SIZE = 22;

const TAB_META: Record<string, TabMeta> = {
  home: { icon: "home-outline", iconFocused: "home", labelKey: "home" },
  discover: { icon: "compass-outline", iconFocused: "compass", labelKey: "discover" },
  explore: { icon: "search-outline", iconFocused: "search", labelKey: "explore" },
  agenda: { icon: "calendar-outline", iconFocused: "calendar", labelKey: "agenda" },
  community: { icon: "people-outline", iconFocused: "people", labelKey: "community" },
  collections: { icon: "albums-outline", iconFocused: "albums", labelKey: "collections" },
  library: { icon: "library-outline", iconFocused: "library", labelKey: "library" },
  profile: { icon: "person-outline", iconFocused: "person", labelKey: "profile" },
};

const PILL_HEIGHT = 64;
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
          const iconSize = TAB_ICON_SIZE * scaleFont;

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
              accessibilityLabel={t(meta.labelKey)}
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tab,
                {
                  minHeight: 48 * scaleSpace,
                  paddingHorizontal: 8 * scaleSpace,
                  paddingVertical: 6 * scaleSpace,
                },
                isFocused && {
                  borderRadius: theme.radii.lg,
                  backgroundColor: theme.colors.heading,
                },
                pressed && styles.tabPressed,
              ]}
            >
              <Ionicons
                testID={`tab-icon-${route.name}`}
                name={isFocused ? meta.iconFocused : meta.icon}
                size={iconSize}
                color={isFocused ? theme.colors.surface : theme.colors.tabInactive}
              />
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
});
