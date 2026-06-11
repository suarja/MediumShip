import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import type { Id } from "../../../convex/_generated/dataModel";
import { normalizeScoringKey } from "../../../convex/discovery/scoring";
import {
  buildInitialRevealedAnchors,
  buildInlineCloudEntries,
} from "../../features/categories/category-interest-inline-layout";
import {
  buildCategoryPickerTree,
  nodeHasChildren,
  type PickerCategoryNode,
} from "../../features/categories/category-interest-tree";
import type { CategoryOption } from "../../features/categories/use-category-interests";
import { fontFamilies } from "../../features/theme/fonts";
import { withAlpha } from "../../features/theme/contrast";
import { useAppTheme } from "../../features/theme/theme-provider";
import { useResponsive } from "../../features/responsive/use-responsive";
import { useCategoryInterestSearch } from "../../features/categories/use-category-interests";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CategoryInterestsPickerProps = {
  options: CategoryOption[];
  selectedKeys: Set<string>;
  applyCategoryInterests: (keys: ReadonlySet<string>) => Promise<void>;
  treeNodes: PickerCategoryNode[];
  /** "large" enlarges chips for prominent surfaces like onboarding. */
  size?: "default" | "large";
};

function animateCloudTransition() {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(
      200,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.opacity,
    ),
  );
}

function setsEqual(left: ReadonlySet<string>, right: ReadonlySet<string>) {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

function FadeInChip({ animate, children }: { animate: boolean; children: ReactNode }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) {
      opacity.setValue(1);
      return;
    }

    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [animate, opacity]);

  return (
    <Animated.View pointerEvents="box-none" style={{ opacity }}>
      {children}
    </Animated.View>
  );
}

function InterestChip({
  node,
  active,
  expanded,
  busy,
  satellite,
  large,
  onPress,
}: {
  node: PickerCategoryNode;
  active: boolean;
  expanded: boolean;
  busy: boolean;
  satellite?: boolean;
  large?: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const scoringKey = normalizeScoringKey(node.label);

  return (
    <Pressable
      accessibilityState={{ selected: active }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        satellite && styles.chipSatellite,
        large && (satellite ? styles.chipSatelliteLarge : styles.chipLarge),
        {
          borderRadius: theme.radii.pill,
          borderColor: active
            ? theme.colors.accent
            : expanded
              ? withAlpha(theme.colors.accent, 0.55)
              : theme.colors.border,
          borderStyle: expanded && !active ? "dashed" : "solid",
          backgroundColor: active
            ? withAlpha(theme.colors.accent, theme.isDark ? 0.22 : 0.12)
            : theme.colors.surfaceMuted,
        },
        pressed && styles.chipPressed,
      ]}
      testID={`interest-${scoringKey}-${active ? "on" : "off"}`}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.chipLabel,
          satellite && styles.chipLabelSatellite,
          large && (satellite ? styles.chipLabelSatelliteLarge : styles.chipLabelLarge),
          { color: active ? theme.colors.accent : theme.colors.heading },
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
  applyCategoryInterests,
  treeNodes,
  size = "default",
}: CategoryInterestsPickerProps) {
  const { t } = useTranslation("settings");
  const { theme } = useAppTheme();
  const { scaleSpace } = useResponsive();
  const large = size === "large";
  const cloudGap = (large ? 8 : 6) * scaleSpace;
  const [searchQuery, setSearchQuery] = useState("");
  const [revealedAnchorIds, setRevealedAnchorIds] = useState<Set<string>>(() => new Set());
  const [optimisticKeys, setOptimisticKeys] = useState<Set<string> | null>(null);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const searchResults = useCategoryInterestSearch(searchQuery);

  const effectiveSelectedKeys = optimisticKeys ?? selectedKeys;

  useEffect(() => {
    if (optimisticKeys === null) {
      return;
    }

    if (setsEqual(optimisticKeys, selectedKeys)) {
      setOptimisticKeys(null);
    }
  }, [optimisticKeys, selectedKeys]);

  const { roots, childrenByParent } = useMemo(
    () => buildCategoryPickerTree(treeNodes),
    [treeNodes],
  );

  useEffect(() => {
    if (treeNodes.length === 0) {
      return;
    }

    setRevealedAnchorIds((previous) => {
      const seeded = buildInitialRevealedAnchors(
        treeNodes,
        childrenByParent,
        selectedKeys,
      );
      let changed = false;
      const merged = new Set(previous);
      for (const id of seeded) {
        if (!merged.has(id)) {
          merged.add(id);
          changed = true;
        }
      }
      return changed ? merged : previous;
    });
  }, [childrenByParent, selectedKeys, treeNodes]);

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

  const cloudEntries = useMemo(() => {
    if (treeNodes.length > 0) {
      return buildInlineCloudEntries(roots, childrenByParent, revealedAnchorIds);
    }

    return flatNodes.map((node) => ({ node, level: 0, satellite: false }));
  }, [childrenByParent, flatNodes, revealedAnchorIds, roots, treeNodes.length]);

  const revealAnchor = (nodeId: Id<"categories">) => {
    animateCloudTransition();
    setRevealedAnchorIds((prev) => {
      const next = new Set(prev);
      next.add(String(nodeId));
      return next;
    });
  };

  const persistSelection = async (node: PickerCategoryNode, nextKeys: Set<string>) => {
    setBusyLabel(node.label);
    setOptimisticKeys(nextKeys);

    try {
      await applyCategoryInterests(nextKeys);
    } catch {
      setOptimisticKeys(null);
      throw new Error(`Failed to save interest for ${node.label}`);
    } finally {
      setBusyLabel(null);
    }
  };

  const handleChipPress = async (node: PickerCategoryNode) => {
    if (busyLabel !== null) {
      return;
    }

    const scoringKey = normalizeScoringKey(node.label);
    const wasPicked = effectiveSelectedKeys.has(scoringKey);
    const hasChildren = nodeHasChildren(node._id, childrenByParent);
    const isRevealed = revealedAnchorIds.has(String(node._id));

    // Reveal children on first tap; also select + persist when not picked yet.
    if (hasChildren && !isRevealed) {
      revealAnchor(node._id);
      if (!wasPicked) {
        const nextKeys = new Set(effectiveSelectedKeys);
        nextKeys.add(scoringKey);
        await persistSelection(node, nextKeys);
      }
      return;
    }

    const nextKeys = new Set(effectiveSelectedKeys);
    if (wasPicked) {
      nextKeys.delete(scoringKey);
    } else {
      nextKeys.add(scoringKey);
    }

    await persistSelection(node, nextKeys);
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <View style={[styles.container, { gap: 12 * scaleSpace }]}>
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
          <View style={[styles.chipCloud, { gap: cloudGap, rowGap: cloudGap }]}>
            {searchResults.flatMap((row) => {
              if (!row) {
                return [];
              }

              const node: PickerCategoryNode = {
                _id: row._id,
                label: row.label,
                iconKey: row.iconKey,
                parentId: row.parentId,
                depth: row.depth ?? 0,
              };
              const active = effectiveSelectedKeys.has(normalizeScoringKey(node.label));
              const busy = busyLabel === node.label;

              return [
                <InterestChip
                  active={active}
                  busy={busy}
                  expanded={false}
                  key={node._id}
                  large={large}
                  node={node}
                  onPress={() => void handleChipPress(node)}
                />,
              ];
            })}
          </View>
        )
      ) : (
        <View style={[styles.chipCloud, { gap: cloudGap, rowGap: cloudGap }]}>
          {cloudEntries.map(({ node, level, satellite }) => {
            const scoringKey = normalizeScoringKey(node.label);
            const active = effectiveSelectedKeys.has(scoringKey);
            const busy = busyLabel === node.label;
            const expanded =
              revealedAnchorIds.has(String(node._id)) &&
              nodeHasChildren(node._id, childrenByParent);

            return (
              <FadeInChip animate={satellite} key={`${node._id}-${level}-${satellite}`}>
                <InterestChip
                  active={active}
                  busy={busy}
                  expanded={expanded}
                  large={large}
                  node={node}
                  onPress={() => void handleChipPress(node)}
                  satellite={satellite}
                />
              </FadeInChip>
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
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  chipSatellite: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  chipLarge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSatelliteLarge: {
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  chipPressed: {
    opacity: 0.86,
  },
  chipLabel: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 13,
  },
  chipLabelSatellite: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
  },
  chipLabelLarge: {
    fontSize: 16,
  },
  chipLabelSatelliteLarge: {
    fontSize: 14,
  },
  emptyCopy: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
