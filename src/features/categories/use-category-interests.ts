import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo } from "react";

import { api } from "../../../convex/_generated/api";
import { normalizeScoringKey } from "../../../convex/discovery/scoring";
import { useClerkAuth } from "../auth/use-clerk-auth";
import { requestDiscoveryFeedRefresh } from "../discovery/discovery-feed-refresh";
import { useAppTheme } from "../theme/theme-provider";

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
  toggleCategory: (label: string) => Promise<void>;
} {
  const { tenantSlug } = useAppTheme();
  const { isSignedIn } = useClerkAuth();
  const options =
    useQuery(api.categories.queries.listCategoryOptions, { tenantSlug }) ?? [];
  const interestKeys = useQuery(
    api.categories.interests.getMyCategoryInterests,
    isSignedIn ? { tenantSlug } : "skip",
  );
  const setCategoryInterests = useMutation(api.categories.interests.setCategoryInterests);

  const selectedKeys = useMemo(
    () => new Set(interestKeys ?? []),
    [interestKeys],
  );

  const toggleCategory = useCallback(
    async (label: string) => {
      if (!isSignedIn) {
        return;
      }

      const key = normalizeScoringKey(label);
      const nextKeys = new Set(selectedKeys);

      if (nextKeys.has(key)) {
        nextKeys.delete(key);
      } else {
        nextKeys.add(key);
      }

      const categoryKeys = options
        .filter((option) => nextKeys.has(normalizeScoringKey(option.label)))
        .map((option) => option.label)
        .sort((left, right) => left.localeCompare(right));

      await setCategoryInterests({ tenantSlug, categoryKeys });
      requestDiscoveryFeedRefresh();
    },
    [isSignedIn, options, selectedKeys, setCategoryInterests, tenantSlug],
  );

  return {
    options,
    selectedKeys,
    isLoading: interestKeys === undefined,
    isSignedIn,
    toggleCategory,
  };
}
