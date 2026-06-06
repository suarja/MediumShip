import { describe, expect, it } from "vitest";

import { filterEvents, sortByStartsAt } from "./model";

const NOW = "2026-04-10T00:00:00.000Z";

const sampleEvents = [
  { _id: "e1", startsAt: "2026-04-12T10:00:00", mode: "offline" as const },
  { _id: "e2", startsAt: "2026-04-02T10:00:00", mode: "online" as const },
  { _id: "e3", startsAt: "2026-04-15T10:00:00", mode: "hybrid" as const },
  { _id: "e4", startsAt: "2026-03-01T10:00:00", mode: "offline" as const },
];

describe("filterEvents", () => {
  it("upcoming: returns only events with startsAt >= nowIso", () => {
    const result = filterEvents(sampleEvents, "upcoming", NOW);
    expect(result.map((e) => e._id)).toEqual(["e1", "e3"]);
  });

  it("online: returns online + hybrid events", () => {
    const result = filterEvents(sampleEvents, "online", NOW);
    expect(result.map((e) => e._id)).toEqual(["e2", "e3"]);
  });

  it("local: returns offline + hybrid events", () => {
    const result = filterEvents(sampleEvents, "local", NOW);
    expect(result.map((e) => e._id)).toEqual(["e1", "e3", "e4"]);
  });

  it("returns empty array when no events match", () => {
    const result = filterEvents(
      [{ _id: "x", startsAt: "2026-01-01T00:00:00", mode: "online" as const }],
      "upcoming",
      "2026-12-31T00:00:00",
    );
    expect(result).toHaveLength(0);
  });
});

describe("sortByStartsAt", () => {
  it("sorts events ascending by startsAt", () => {
    const events = [
      { startsAt: "2026-04-15T10:00:00" },
      { startsAt: "2026-04-02T10:00:00" },
      { startsAt: "2026-04-12T10:00:00" },
    ];
    const sorted = sortByStartsAt(events);
    expect(sorted.map((e) => e.startsAt)).toEqual([
      "2026-04-02T10:00:00",
      "2026-04-12T10:00:00",
      "2026-04-15T10:00:00",
    ]);
  });

  it("does not mutate the original array", () => {
    const events = [{ startsAt: "2026-04-15" }, { startsAt: "2026-04-02" }];
    const original = [...events];
    sortByStartsAt(events);
    expect(events).toEqual(original);
  });
});
