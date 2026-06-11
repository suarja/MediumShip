import { useConvexAuth } from "convex/react";

import { useCategoryInterests, type CategoryOption } from "./use-category-interests";
import { useGuestCategoryInterests } from "./use-guest-category-interests";

/**
 * Auth-aware category selection: signed-in users read/write the server, guests
 * read/write local storage. `options` is public either way. Lets a guest pick
 * interests in onboarding before they have an account.
 */
export function useCategoryInterestSelection(): {
  options: CategoryOption[];
  selectedKeys: Set<string>;
  applyCategoryInterests: (keys: ReadonlySet<string>) => Promise<void>;
  isLoading: boolean;
} {
  const { isAuthenticated } = useConvexAuth();
  const server = useCategoryInterests();
  const guest = useGuestCategoryInterests();

  if (isAuthenticated) {
    return {
      options: server.options,
      selectedKeys: server.selectedKeys,
      applyCategoryInterests: server.applyCategoryInterests,
      isLoading: server.isLoading,
    };
  }

  return {
    options: server.options,
    selectedKeys: guest.selectedKeys,
    applyCategoryInterests: guest.applyCategoryInterests,
    isLoading: guest.isLoading,
  };
}
