import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/** Centralized semantic haptic feedback — no-op on web. */
export const HapticsService = {
  light: async () => {
    if (Platform.OS === "web") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  medium: async () => {
    if (Platform.OS === "web") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  heavy: async () => {
    if (Platform.OS === "web") return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  success: async () => {
    if (Platform.OS === "web") return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  error: async () => {
    if (Platform.OS === "web") return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  warning: async () => {
    if (Platform.OS === "web") return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  selection: async () => {
    if (Platform.OS === "web") return;
    await Haptics.selectionAsync();
  },
};
