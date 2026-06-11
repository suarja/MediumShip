import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { FREE_MEMBER_LIST_LIMIT } from "../../../convex/personalLists/model";
import { useIsMember } from "../membership/use-is-member";
import { requestReview } from "../review/review-service";
import type { PersonalListSummary } from "./types";

export function usePersonalLists() {
  const { isAuthenticated } = useConvexAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const createListMutation = useMutation(api.personalLists.mutations.create);
  const renameListMutation = useMutation(api.personalLists.mutations.rename);
  const removeListMutation = useMutation(api.personalLists.mutations.remove);
  const addItemMutation = useMutation(api.personalLists.mutations.addItem);
  const removeItemMutation = useMutation(api.personalLists.mutations.removeItem);

  const addItem = useCallback(
    async (args: { listId: Id<"personalLists">; contentId: Id<"contents"> }) => {
      const result = await addItemMutation(args);
      void requestReview("list_add");
      return result;
    },
    [addItemMutation],
  );

  const rawLists = useQuery(
    api.personalLists.queries.listMine,
    isAuthenticated ? {} : "skip",
  ) as PersonalListSummary[] | undefined;

  const lists =
    isAuthenticated && Array.isArray(rawLists) ? rawLists : [];
  const primaryList = lists[0] ?? null;
  const isAtFreeLimit = !isMember && lists.length >= FREE_MEMBER_LIST_LIMIT;
  const canCreateAnother = isMember || lists.length < FREE_MEMBER_LIST_LIMIT;

  return {
    lists,
    primaryList,
    isMember,
    isMembershipLoading,
    isListsLoading: isAuthenticated && rawLists === undefined,
    isAtFreeLimit,
    canCreateAnother,
    createList: createListMutation,
    renameList: renameListMutation,
    removeList: removeListMutation,
    addItem,
    removeItem: removeItemMutation,
  };
}
