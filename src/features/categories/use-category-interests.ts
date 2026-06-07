import { useCallback, useMemo } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { useClerkAuth } from "../auth/use-clerk-auth";
import { requestDiscoveryFeedRefresh } from "../discovery/discovery-feed-refresh";
import { useAppTheme } from "../theme/theme-provider";
import type { PickerCategoryNode } from "./category-interest-tree";

export type CategoryOption = {
  label: string;
  icon: string;
  iconKey: string;
};

export function useCategoryInterests(): {
  options: CategoryOption[];
  selectedKeys: Set<string>;
  isLoading: boolean;
  isSignedIn: boolean;
  canPersistInterests: boolean;
  applyCategoryInterests: (keys: ReadonlySet<string>) => Promise<void>;
} {
  const { tenantSlug } = useAppTheme();
  const { isSignedIn } = useClerkAuth();
  const { isAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();

  const rawOptions = useQuery(api.categories.queries.listCategoryOptions, { tenantSlug });
  const options = Array.isArray(rawOptions) ? rawOptions : [];

  const interestKeys = useQuery(
    api.categories.interests.getMyCategoryInterests,
    isAuthenticated ? { tenantSlug } : "skip",
  );
  const setCategoryInterests = useMutation(api.categories.interests.setCategoryInterests);

  const selectedKeys = useMemo(
    () => new Set(Array.isArray(interestKeys) ? interestKeys : []),
    [interestKeys],
  );

  const applyCategoryInterests = useCallback(
    async (keys: ReadonlySet<string>) => {
      if (!isAuthenticated) {
        throw new Error("Category interests require an authenticated Convex session");
      }

      const categoryKeys = [...keys].sort((left, right) => left.localeCompare(right));

      await setCategoryInterests({ tenantSlug, categoryKeys });
      requestDiscoveryFeedRefresh();
    },
    [isAuthenticated, setCategoryInterests, tenantSlug],
  );

  return {
    options,
    selectedKeys,
    isLoading:
      (isSignedIn && isConvexAuthLoading) ||
      (isAuthenticated && interestKeys === undefined),
    isSignedIn,
    canPersistInterests: isAuthenticated,
    applyCategoryInterests,
  };
}

export function useCategoryInterestSearch(query: string) {
  const { tenantSlug } = useAppTheme();
  const trimmed = query.trim();

  const results = useQuery(
    api.categories.queries.searchTenantCategories,
    trimmed ? { tenantSlug, query: trimmed } : "skip",
  );

  return Array.isArray(results) ? results : [];
}

export function useCategoryInterestTreeNodes(): PickerCategoryNode[] {
  const { tenantSlug } = useAppTheme();

  const rows = useQuery(api.categories.queries.listTenantCategoryTree, { tenantSlug });

  return Array.isArray(rows) ? rows : [];
}
