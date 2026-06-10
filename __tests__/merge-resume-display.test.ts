import { mergeResumeWithLocalSnapshot } from "../src/features/history/merge-resume-display";

describe("mergeResumeWithLocalSnapshot", () => {
  it("prefers the higher local position and player duration for display", () => {
    const merged = mergeResumeWithLocalSnapshot(
      {
        contentId: "content_1" as never,
        kind: "episode",
        title: "Short clip",
        heroImageUrl: undefined,
        seconds: 30,
        catalogDurationSeconds: 3240,
        observedDurationSeconds: undefined,
        durationSeconds: 3240,
        progressRatio: 30 / 3240,
      },
      { seconds: 90, durationSeconds: 180 },
    );

    expect(merged.seconds).toBe(90);
    expect(merged.durationSeconds).toBe(180);
    expect(merged.progressRatio).toBeCloseTo(0.5);
  });
});
