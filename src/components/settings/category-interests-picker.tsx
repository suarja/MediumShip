import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import type { Id } from "../../../convex/_generated/dataModel";
import { resolveCategoryIconGlyph } from "../../../convex/categories/model";
import { normalizeScoringKey } from "../../../convex/discovery/scoring";
import {
  buildCategoryPickerTree,
  buildVisibleCategoryCloud,
  nodeHasChildren,
  type PickerCategoryNode,
} from "../../features/categories/category-interest-tree";
import type { CategoryOption } from "../../features/categories/use-category-interests";
import { fontFamilies } from "../../features/theme/fonts";
import { withAlpha } from "../../features/theme/contrast";
import { useAppTheme } from "../../features/theme/theme-provider";
import { useResponsive } from "../../features/responsive/use-responsive";
import { useCategoryInterestSearch } from "../../features/categories/use-category-interests";

type CategoryInterestsPickerProps = {
  options: CategoryOption[];
  selectedKeys: Set<string>;
  toggleCategory: (label: string) => Promise<void>;
  treeNodes: PickerCategoryNode[];
};

function InterestChip({
  node,
  active,
  focused,
  busy,
  onPress,
}: {
  node: PickerCategoryNode;
  active: boolean;
  focused: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const icon = resolveCategoryIconGlyph(node.iconKey);

  return (
    <Pressable
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderRadius: theme.radii.pill,
          borderColor: active || focused ? theme.colors.accent : theme.colors.border,
          backgroundColor: active
            ? withAlpha(theme.colors.accent, theme.isDark ? 0.22 : 0.12)
            : focused
              ? withAlpha(theme.colors.accent, theme.isDark ? 0.1 : 0.06)
              : theme.colors.surfaceMuted,
        },
        pressed && styles.chipPressed,
      ]}
    >
      <Text
        style={[
          styles.chipIcon,
          { color: active || focused ? theme.colors.accent : theme.colors.textMuted },
        ]}
      >
        {icon}
      </Text>
      <Text
        style={[
          styles.chipLabel,
          { color: active || focused ? theme.colors.accent : theme.colors.heading },
        ]}
      >
        {node.label}
      </Text>
      {busy ? <ActivityIndicator size="small" color={theme.colors.accent} /> : null}
    </Pressable>
  );
}

export function CategoryInterestsPicker({
  options,
  selectedKeys,
  toggleCategory,
  treeNodes,
}: CategoryInterestsPickerProps) {
  const { t } = useTranslation("settings");
  const { theme } = useAppTheme();
  const { scaleSpace } = useResponsive();
  const [searchQuery, setSearchQuery] = useState("");
  const [focusStack, setFocusStack] = useState<Id<"categories">[]>([]);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const searchResults = useCategoryInterestSearch(searchQuery);

  const { roots, childrenByParent } = useMemo(
    () => buildCategoryPickerTree(treeNodes),
    [treeNodes],
  );

  const flatNodes: PickerCategoryNode[] = useMemo(
    () =>
      options.map((option, index) => ({
        _id: `flat-${index}` as Id<"categories">,
        label: option.label,
        iconKey: option.iconKey,
        depth: 0,
      })),
    [options],
  );

  const cloudNodes = useMemo(() => {
    if (treeNodes.length > 0) {
      return buildVisibleCategoryCloud(roots, childrenByParent, focusStack);
    }

    return flatNodes.map((node) => ({ node, level: 0 }));
  }, [childrenByParent, flatNodes, focusStack, roots, treeNodes.length]);

  const handleChipPress = async (node: PickerCategoryNode, level: number) => {
    if (busyLabel !== null) {
      return;
    }

    const wasPicked = selectedKeys.has(normalizeScoringKey(node.label));
    const hasChildren = nodeHasChildren(node._id, childrenByParent);
    const isFocused = focusStack[level] === node._id;

    try {
      if (hasChildren && !isFocused) {
        setFocusStack((prev) => [...prev.slice(0, level), node._id]);
        if (!wasPicked) {
          setBusyLabel(node.label);
          await toggleCategory(node.label);
        }
        return;
      }

      setBusyLabel(node.label);
      await toggleCategory(node.label);

      if (hasChildren && wasPicked) {
        setFocusStack((prev) => prev.slice(0, level));
      }
    } finally {
      setBusyLabel(null);
    }
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <View style={[styles.container, { gap: 14 * scaleSpace }]}>
      <TextInput
        accessibilityLabel={t("interests.searchPlaceholder")}
        onChangeText={setSearchQuery}
        placeholder={t("interests.searchPlaceholder")}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.searchInput,
          {
            borderRadius: theme.radii.lg,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceMuted,
            color: theme.colors.heading,
          },
        ]}
        value={searchQuery}
      />

      {isSearching ? (
        searchResults.length === 0 ? (
          <Text style={[styles.emptyCopy, { color: theme.colors.textMuted }]}>
            {t("interests.searchEmpty", { query: searchQuery.trim() })}
          </Text>
        ) : (
          <View style={[styles.chipCloud, { gap: 10 * scaleSpace }]}>
            {searchResults.map((node) => {
              const active = selectedKeys.has(normalizeScoringKey(node.label));
              const busy = busyLabel === node.label;

              return (
                <InterestChip
                  active={active}
                  busy={busy}
                  focused={false}
                  key={node._id}
                  node={node}
                  onPress={() => void handleChipPress(node, node.depth ?? 0)}
                />
              );
            })}
          </View>
        )
      ) : (
        <View style={[styles.chipCloud, { gap: 10 * scaleSpace }]}>
          {cloudNodes.map(({ node, level }) => {
            const active = selectedKeys.has(normalizeScoringKey(node.label));
            const busy = busyLabel === node.label;
            const focused = focusStack[level] === node._id;

            return (
              <InterestChip
                active={active}
                busy={busy}
                focused={focused}
                key={node._id}
                node={node}
                onPress={() => void handleChipPress(node, level)}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  searchInput: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
  },
  chipCloud: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  chipPressed: {
    opacity: 0.86,
  },
  chipIcon: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
  },
  chipLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 14,
  },
  emptyCopy: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
