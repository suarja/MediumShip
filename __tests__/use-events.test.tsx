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
    const { result } = renderHook(() => useEvent("evt_123"));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.event).toBeUndefined();
  });

  it("returns event detail when resolved", () => {
    const mockEvent = { _id: "evt_123", title: "Detailed Event", summary: "S", startsAt: "2026-10-01", locationLabel: "Paris", mode: "offline", access: "free", status: "scheduled" };
    useQuery.mockReturnValue(mockEvent);
    const { result } = renderHook(() => useEvent("evt_123"));
    expect(result.current.event).toEqual(mockEvent);
    expect(result.current.isLoading).toBe(false);
  });

  it("skips the query when id is empty", () => {
    useQuery.mockReturnValue(undefined);
    renderHook(() => useEvent(""));
    expect(useQuery).toHaveBeenCalledWith(expect.anything(), "skip");
  });
});
