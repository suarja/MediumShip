import { act, renderHook } from "@testing-library/react-native";

import { useBookmarks } from "../src/features/bookmarks/use-bookmarks";
import { HapticsService } from "../src/features/haptics/haptics";

const mockToggleMutation = jest.fn();

jest.mock("../src/features/haptics/haptics", () => ({
  HapticsService: {
    selection: jest.fn(),
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true }),
  useMutation: () => mockToggleMutation,
  useQuery: () => [],
}));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => ({ isMember: false, isLoading: false }),
}));

describe("useBookmarks haptics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToggleMutation.mockResolvedValue(undefined);
  });

  it("fires success when adding a bookmark", async () => {
    const { result } = renderHook(() => useBookmarks());

    await act(async () => {
      await result.current.toggleBookmark({
        contentId: "article_1" as never,
        isSaved: false,
      });
    });

    expect(HapticsService.success).toHaveBeenCalledTimes(1);
    expect(HapticsService.selection).not.toHaveBeenCalled();
  });

  it("fires selection when removing a bookmark", async () => {
    const { result } = renderHook(() => useBookmarks());

    await act(async () => {
      await result.current.toggleBookmark({
        contentId: "article_1" as never,
        isSaved: true,
      });
    });

    expect(HapticsService.selection).toHaveBeenCalledTimes(1);
    expect(HapticsService.success).not.toHaveBeenCalled();
  });

  it("fires error when the mutation fails", async () => {
    mockToggleMutation.mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => useBookmarks());

    await expect(
      act(async () => {
        await result.current.toggleBookmark({
          contentId: "article_1" as never,
          isSaved: false,
        });
      }),
    ).rejects.toThrow("network");

    expect(HapticsService.error).toHaveBeenCalledTimes(1);
  });
});
