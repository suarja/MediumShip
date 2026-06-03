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
      style={[styles.safeArea, { backgroundColor: theme.colors.canvas }]}
    >
      <View
        style={[
          styles.content,
          {
            padding: theme.spacing.lg * scaleSpace,
            maxWidth: contentMaxWidth,
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
