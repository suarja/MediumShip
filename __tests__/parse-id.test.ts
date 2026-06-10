import { tryParseConvexId } from "../src/features/convex/parse-id";

const VALID_EVENT_ID = "jh7123456789012345678901234";

describe("tryParseConvexId", () => {
  it("accepts opaque Convex document ids", () => {
    expect(tryParseConvexId<"events">(VALID_EVENT_ID)).toBe(VALID_EVENT_ID);
  });

  it("rejects mock agenda ids", () => {
    expect(tryParseConvexId<"events">("evt-1")).toBeNull();
    expect(tryParseConvexId<"events">("evt_123")).toBeNull();
  });

  it("rejects empty and slug-like values", () => {
    expect(tryParseConvexId<"events">("")).toBeNull();
    expect(tryParseConvexId<"events">(undefined)).toBeNull();
    expect(tryParseConvexId<"events">("short-id")).toBeNull();
  });
});
