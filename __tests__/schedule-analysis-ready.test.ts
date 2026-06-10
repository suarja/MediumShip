import {
  isAnalysisReadyNotification,
} from "../src/features/notifications/schedule-analysis-ready";

describe("schedule-analysis-ready", () => {
  it("detects analysis_ready notification data", () => {
    expect(
      isAnalysisReadyNotification({
        kind: "analysis_ready",
        analysisId: "abc123",
      }),
    ).toBe(true);
    expect(isAnalysisReadyNotification({ kind: "daily_digest" })).toBe(false);
  });
});
