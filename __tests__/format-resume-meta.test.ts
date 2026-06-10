import i18n from "i18next";

import { formatResumeMeta, resolveResumeDisplayProgress } from "../src/features/history/format-resume-meta";
import { formatMediaClock } from "../src/features/media/format-media-clock";
import { changeAppLanguage, initI18n } from "../src/i18n";

describe("resolveResumeDisplayProgress", () => {
  it("uses the resolved short duration instead of stale catalog metadata", () => {
    const display = resolveResumeDisplayProgress({
      kind: "episode",
      progressRatio: 0.02,
      seconds: 90,
      durationSeconds: 180,
    });

    expect(display.percent).toBe(50);
    expect(display.remainingSeconds).toBe(90);
    expect(formatMediaClock(display.remainingSeconds!)).toBe("1:30");
  });

  it("keeps percent and remaining time aligned on floored seconds", () => {
    const display = resolveResumeDisplayProgress({
      kind: "episode",
      progressRatio: 0.37,
      seconds: 672.9,
      durationSeconds: 1800,
    });

    expect(display.percent).toBe(37);
    expect(display.remainingSeconds).toBe(1128);
    expect(formatMediaClock(display.remainingSeconds!)).toBe("18:48");
  });
});

describe("formatResumeMeta", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("renders the aligned remaining label", () => {
    const label = formatResumeMeta(
      {
        kind: "episode",
        progressRatio: 0.37,
        seconds: 672,
        durationSeconds: 1800,
      },
      i18n.getFixedT("en", "library"),
    );

    expect(label).toBe("Episode · 18:48 left · 37%");
  });
});
