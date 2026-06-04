import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { ContentDoc } from "../content/types";
import { useIsMember } from "../membership/use-is-member";

export type BookmarkListItem = {
  content: ContentDoc;
  createdAt: number;
};

export function useBookmarks() {
  const { isAuthenticated } = useConvexAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const toggleBookmark = useMutation(api.bookmarks.mutations.toggleBookmark);
  const canAccessBookmarks = isAuthenticated && isMember;
  const rawBookmarks = useQuery(
    api.bookmarks.queries.listBookmarks,
    canAccessBookmarks ? {} : "skip",
  ) as BookmarkListItem[] | undefined;
  const bookmarks = canAccessBookmarks && Array.isArray(rawBookmarks) ? rawBookmarks : [];

  return {
    bookmarks,
    isMember,
    isMembershipLoading,
    canAccessBookmarks,
    isBookmarksLoading: canAccessBookmarks && rawBookmarks === undefined,
    toggleBookmark,
  };
}
