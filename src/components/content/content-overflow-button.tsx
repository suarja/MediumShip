import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";

import type { Id } from "../../../convex/_generated/dataModel";
import { useContentActionsSheet } from "../../features/content/content-actions-sheet-provider";
import { useResponsive } from "../../features/responsive/use-responsive";
import { useAppTheme } from "../../features/theme/theme-provider";

type ContentOverflowButtonProps = {
  contentId: Id<"contents">;
  accessibilityLabel: string;
};

export function ContentOverflowButton({
  contentId,
  accessibilityLabel,
}: ContentOverflowButtonProps) {
  const { theme } = useAppTheme();
  const { scaleFont } = useResponsive();
  const { openContentActions } = useContentActionsSheet();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={(event) => {
        event.stopPropagation?.();
        openContentActions(contentId, "all");
      }}
      style={({ pressed }) => [
        styles.button,
        {
          width: 34,
          height: 34,
          borderRadius: theme.radii.sm,
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        color={theme.colors.textMuted}
        name="ellipsis-horizontal"
        size={18 * scaleFont}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.7,
  },
});
