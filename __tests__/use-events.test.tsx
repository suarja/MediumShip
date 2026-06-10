import { useEvents, useEvent } from "../src/features/events/use-events";
import { renderHook } from "@testing-library/react-native";

jest.mock("convex/react", () => ({
  useQuery: jest.fn(),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    tenantSlug: "demo-media",
    theme: {
      colors: {},
      spacing: {},
      radii: {},
      isDark: false,
    },
    enabledModules: [],
    feedSections: [],
  }),
}));

const { useQuery } = jest.requireMock("convex/react") as { useQuery: jest.Mock };

const VALID_EVENT_ID = "jh7123456789012345678901234";

describe("useEvents", () => {
  beforeEach(() => {
    useQuery.mockReset();
  });

  it("isLoading is true while loading", () => {
    useQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useEvents("upcoming"));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.events).toEqual([]);
  });

  it("returns events once resolved", () => {
    const mockEvents = [
      { _id: "e1", title: "Event 1", summary: "S", startsAt: "2026-10-01", locationLabel: "Paris", mode: "offline", access: "free", status: "scheduled" },
    ];
    useQuery.mockReturnValue(mockEvents);
    const { result } = renderHook(() => useEvents("upcoming"));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.events).toEqual(mockEvents);
  });

  it("forwards the filter argument to the query", () => {
    useQuery.mockReturnValue([]);
    renderHook(() => useEvents("online"));
    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ filter: "online", tenantSlug: "demo-media" }),
    );

    useQuery.mockClear();
    renderHook(() => useEvents("local"));
    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ filter: "local" }),
    );
  });
});

describe("useEvent", () => {
  beforeEach(() => {
    useQuery.mockReset();
  });

  it("isLoading is true while loading", () => {
    useQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useEvent(VALID_EVENT_ID));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.event).toBeUndefined();
  });

  it("returns event detail when resolved", () => {
    const mockEvent = { _id: VALID_EVENT_ID, title: "Detailed Event", summary: "S", startsAt: "2026-10-01", locationLabel: "Paris", mode: "offline", access: "free", status: "scheduled" };
    useQuery.mockReturnValue(mockEvent);
    const { result } = renderHook(() => useEvent(VALID_EVENT_ID));
    expect(result.current.event).toEqual(mockEvent);
    expect(result.current.isLoading).toBe(false);
  });

  it("skips the query when id is empty", () => {
    useQuery.mockReturnValue(undefined);
    renderHook(() => useEvent(""));
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), "skip");
  });

  it("skips the query for mock ids that are not Convex document ids", () => {
    useQuery.mockReturnValue(undefined);
    const { result } = renderHook(() => useEvent("evt-1"));
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), "skip");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.event).toBeUndefined();
  });
});
