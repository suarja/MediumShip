import { renderHook, waitFor } from "@testing-library/react-native";

import { useContentEngagement, resetContentEngagementSessionForTests } from "../src/features/discovery/use-content-engagement";

const mockRecordInteraction = jest.fn().mockResolvedValue(undefined);

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => mockRecordInteraction,
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({ tenantSlug: "demo-media" }),
}));

describe("useContentEngagement", () => {
  beforeEach(() => {
    mockRecordInteraction.mockClear();
    resetContentEngagementSessionForTests();
  });

  it("records open once on mount for authenticated members", async () => {
    renderHook(() =>
      useContentEngagement({
        contentId: "content-1" as never,
        kind: "article",
      }),
    );

    await waitFor(() => {
      expect(mockRecordInteraction).toHaveBeenCalledWith({
        tenantSlug: "demo-media",
        contentId: "content-1",
        type: "open",
      });
    });
    expect(mockRecordInteraction).toHaveBeenCalledTimes(1);
  });

  it("records finish when media consumption crosses 90%", async () => {
    const { rerender } = renderHook(
      ({ progressRatio }: { progressRatio: number }) =>
        useContentEngagement({
          contentId: "episode-1" as never,
          kind: "episode",
          consumption: { progressRatio },
        }),
      { initialProps: { progressRatio: 0.5 } },
    );

    await waitFor(() => {
      expect(mockRecordInteraction).toHaveBeenCalledWith(
        expect.objectContaining({ type: "open" }),
      );
    });

    rerender({ progressRatio: 0.92 });

    await waitFor(() => {
      expect(mockRecordInteraction).toHaveBeenCalledWith({
        tenantSlug: "demo-media",
        contentId: "episode-1",
        type: "finish",
      });
    });
  });

  it("records finish when an article is scrolled to the end", async () => {
    const { rerender } = renderHook(
      ({ scrolledToEnd }: { scrolledToEnd: boolean }) =>
        useContentEngagement({
          contentId: "article-1" as never,
          kind: "article",
          consumption: { scrolledToEnd },
        }),
      { initialProps: { scrolledToEnd: false } },
    );

    rerender({ scrolledToEnd: true });

    await waitFor(() => {
      expect(mockRecordInteraction).toHaveBeenCalledWith({
        tenantSlug: "demo-media",
        contentId: "article-1",
        type: "finish",
      });
    });
  });

  it("does not record interactions for guests", async () => {
    jest.spyOn(require("convex/react"), "useConvexAuth").mockReturnValue({
      isAuthenticated: false,
    });

    renderHook(() =>
      useContentEngagement({
        contentId: "content-1" as never,
        kind: "article",
      }),
    );

    expect(mockRecordInteraction).not.toHaveBeenCalled();

    jest.spyOn(require("convex/react"), "useConvexAuth").mockReturnValue({
      isAuthenticated: true,
    });
  });

  it("does not stack finish on re-open of the same content", async () => {
    const { unmount } = renderHook(() =>
      useContentEngagement({
        contentId: "article-1" as never,
        kind: "article",
        consumption: { scrolledToEnd: true },
      }),
    );

    await waitFor(() => {
      expect(
        mockRecordInteraction.mock.calls.filter((call) => call[0].type === "finish"),
      ).toHaveLength(1);
    });

    unmount();
    mockRecordInteraction.mockClear();

    renderHook(() =>
      useContentEngagement({
        contentId: "article-1" as never,
        kind: "article",
        consumption: { scrolledToEnd: true },
      }),
    );

    await waitFor(() => {
      expect(mockRecordInteraction).toHaveBeenCalledWith(
        expect.objectContaining({ type: "open" }),
      );
    });

    expect(
      mockRecordInteraction.mock.calls.filter((call) => call[0].type === "finish"),
    ).toHaveLength(0);
  });
});
