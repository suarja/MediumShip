import {
  cancelAnalysisReadyNotifications,
  isAnalysisReadyNotification,
  scheduleAnalysisReadyNotification,
} from "../src/features/notifications/schedule-analysis-ready";

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
  },
}));

const mockCancel = jest.fn();
const mockSchedule = jest.fn();
const mockGetAllScheduled = jest.fn();

jest.mock("../src/features/notifications/bootstrap", () => ({
  notificationsModule: {
    SchedulableTriggerInputTypes: { DATE: "date" },
    cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancel(...args),
    scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
    getAllScheduledNotificationsAsync: () => mockGetAllScheduled(),
  },
}));

describe("schedule-analysis-ready", () => {
  beforeEach(() => {
    mockGetItem.mockReset();
    mockSetItem.mockReset();
    mockCancel.mockReset();
    mockSchedule.mockReset();
    mockGetAllScheduled.mockReset();
    mockGetAllScheduled.mockResolvedValue([]);
    mockGetItem.mockResolvedValue(null);
    mockSchedule.mockResolvedValue("notif-1");
  });

  it("detects analysis_ready notification data", () => {
    expect(
      isAnalysisReadyNotification({
        kind: "analysis_ready",
        analysisId: "abc123",
      }),
    ).toBe(true);
    expect(isAnalysisReadyNotification({ kind: "daily_digest" })).toBe(false);
  });

  it("does not schedule twice for the same analysis id", async () => {
    mockGetItem.mockResolvedValue("analysis_1");

    const scheduled = await scheduleAnalysisReadyNotification({
      analysisId: "analysis_1",
      title: "Knowly",
      body: "Ready",
    });

    expect(scheduled).toBe(false);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it("cancels prior analysis_ready notifications before scheduling", async () => {
    mockGetAllScheduled.mockResolvedValue([
      {
        identifier: "old-1",
        content: { data: { kind: "analysis_ready", analysisId: "old" } },
      },
    ]);

    const scheduled = await scheduleAnalysisReadyNotification({
      analysisId: "analysis_2",
      title: "Knowly",
      body: "Ready",
    });

    expect(scheduled).toBe(true);
    expect(mockCancel).toHaveBeenCalledWith("old-1");
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect(mockSetItem).toHaveBeenCalledWith(
      "mediumship:analysisReady.lastNotifiedId",
      "analysis_2",
    );
  });

  it("cancelAnalysisReadyNotifications removes queued analysis_ready entries", async () => {
    mockGetAllScheduled.mockResolvedValue([
      {
        identifier: "queued-1",
        content: { data: { kind: "analysis_ready", analysisId: "x" } },
      },
      {
        identifier: "digest-1",
        content: { data: { kind: "daily_digest" } },
      },
    ]);

    await cancelAnalysisReadyNotifications();

    expect(mockCancel).toHaveBeenCalledTimes(1);
    expect(mockCancel).toHaveBeenCalledWith("queued-1");
  });
});
