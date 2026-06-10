import {
  computeReminderTriggers,
  isDailyDigestNotification,
  resolveDigestMessages,
} from "../src/features/notifications/schedule-daily-digest";

describe("computeReminderTriggers", () => {
  const now = new Date("2026-06-10T08:00:00");

  it("builds N consecutive local morning triggers starting tomorrow", () => {
    const triggers = computeReminderTriggers(now, 9, 7, "en");

    expect(triggers).toHaveLength(7);
    expect(triggers[0]?.date.getFullYear()).toBe(2026);
    expect(triggers[0]?.date.getMonth()).toBe(5);
    expect(triggers[0]?.date.getDate()).toBe(11);
    expect(triggers[0]?.date.getHours()).toBe(9);
    expect(triggers[0]?.date.getMinutes()).toBe(0);
    expect(triggers[6]?.date.getDate()).toBe(17);
  });

  it("selects French copy for fr locales", () => {
    const triggers = computeReminderTriggers(now, 9, 1, "fr-FR");

    expect(triggers[0]?.body).toBe("Ton feed du jour est prêt");
    expect(triggers[0]?.title).toBe("Knowly");
  });

  it("selects English copy for en locales", () => {
    const triggers = computeReminderTriggers(now, 9, 1, "en-US");

    expect(triggers[0]?.body).toBe("Your feed for today is ready");
  });

  it("is idempotent for the same inputs", () => {
    const first = computeReminderTriggers(now, 10, 3, "en");
    const second = computeReminderTriggers(now, 10, 3, "en");

    expect(first.map((entry) => entry.date.toISOString())).toEqual(
      second.map((entry) => entry.date.toISOString()),
    );
  });
});

describe("resolveDigestMessages", () => {
  it("falls back to English for unknown locales", () => {
    expect(resolveDigestMessages("de").body).toBe("Your feed for today is ready");
  });
});

describe("isDailyDigestNotification", () => {
  it("matches only daily digest payloads", () => {
    expect(isDailyDigestNotification({ kind: "daily_digest" })).toBe(true);
    expect(isDailyDigestNotification({ kind: "coach_reminder" })).toBe(false);
    expect(isDailyDigestNotification(null)).toBe(false);
  });
});
