jest.mock("../src/features/notifications/bootstrap", () => ({
  notificationsModule: null,
}));

import {
  cancelDailyDigestReminders,
  scheduleDailyDigest,
} from "../src/features/notifications/schedule-daily-digest";

describe("scheduleDailyDigest without native module", () => {
  it("no-ops safely when expo-notifications is unavailable", async () => {
    await expect(scheduleDailyDigest({ locale: "en" })).resolves.toBeUndefined();
    await expect(cancelDailyDigestReminders()).resolves.toBeUndefined();
  });
});
