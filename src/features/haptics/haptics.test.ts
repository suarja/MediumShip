import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { HapticsService } from "./haptics";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Error: "error",
    Warning: "warning",
  },
}));

describe("HapticsService", () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = "ios";
  });

  afterAll(() => {
    Platform.OS = originalPlatform;
  });

  it("selection calls selectionAsync", async () => {
    await HapticsService.selection();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  it("light calls impactAsync with Light style", async () => {
    await HapticsService.light();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it("medium calls impactAsync with Medium style", async () => {
    await HapticsService.medium();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
  });

  it("heavy calls impactAsync with Heavy style", async () => {
    await HapticsService.heavy();
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
  });

  it("success calls notificationAsync with Success type", async () => {
    await HapticsService.success();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success,
    );
  });

  it("error calls notificationAsync with Error type", async () => {
    await HapticsService.error();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Error,
    );
  });

  it("warning calls notificationAsync with Warning type", async () => {
    await HapticsService.warning();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Warning,
    );
  });

  describe("on web", () => {
    beforeEach(() => {
      Platform.OS = "web";
    });

    it("does not call any native haptic APIs", async () => {
      await HapticsService.selection();
      await HapticsService.light();
      await HapticsService.medium();
      await HapticsService.heavy();
      await HapticsService.success();
      await HapticsService.error();
      await HapticsService.warning();

      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
      expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    });
  });
});
