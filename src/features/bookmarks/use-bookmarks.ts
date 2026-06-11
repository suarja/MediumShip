import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { ContentDoc } from "../content/types";
import { HapticsService } from "../haptics/haptics";
import { useIsMember } from "../membership/use-is-member";
import { requestReview } from "../review/review-service";

export type BookmarkListItem = {
  content: ContentDoc;
  createdAt: number;
};

export function useBookmarks() {
  const { isAuthenticated } = useConvexAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const toggleBookmarkMutation = useMutation(api.bookmarks.mutations.toggleBookmark);
  const canAccessBookmarks = isAuthenticated;
  const rawBookmarks = useQuery(
    api.bookmarks.queries.listBookmarks,
    canAccessBookmarks ? {} : "skip",
  ) as BookmarkListItem[] | undefined;
  const bookmarks = canAccessBookmarks && Array.isArray(rawBookmarks) ? rawBookmarks : [];
  const toggleBookmark = useCallback(
    async ({
      contentId,
      isSaved,
    }: {
      contentId: Id<"contents">;
      isSaved: boolean;
    }) => {
      void (isSaved ? HapticsService.selection() : HapticsService.success());
      const isFirstBookmark = !isSaved && bookmarks.length === 0;
      try {
        const result = await toggleBookmarkMutation({ contentId });
        if (isFirstBookmark && result?.bookmarked === true) {
          void requestReview("first_bookmark");
        }
        return result;
      } catch (error) {
        void HapticsService.error();
        throw error;
      }
    },
    [bookmarks.length, toggleBookmarkMutation],
  );

  return {
    bookmarks,
    isMember,
    isMembershipLoading,
    canAccessBookmarks,
    isBookmarksLoading: canAccessBookmarks && rawBookmarks === undefined,
    toggleBookmark,
  };
}
