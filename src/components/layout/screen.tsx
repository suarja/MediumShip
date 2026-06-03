import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useResponsive } from "../../features/responsive/use-responsive";
import { useAppTheme } from "../../features/theme/theme-provider";

export function Screen({ children }: PropsWithChildren) {
  const { theme } = useAppTheme();
  const { scaleSpace, contentMaxWidth } = useResponsive();

  return (
    <SafeAreaView
      // No bottom edge: content runs to the bottom of the screen and scrolls
      // under the floating tab bar over a single canvas color.
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}
    >
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: theme.spacing.lg * scaleSpace,
            paddingTop: theme.spacing.lg * scaleSpace,
            maxWidth: contentMaxWidth,
            alignSelf: "center",
          },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, alignItems: "center" },
  content: { flex: 1, width: "100%" },
});
