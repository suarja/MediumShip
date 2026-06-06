import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { useAppTheme } from "../theme/theme-provider";

export type CategorySummary = { category: string; count: number };

export function useCategories(): { categories: CategorySummary[]; isLoading: boolean } {
  const { tenantSlug } = useAppTheme();
  const data = useQuery(api.content.queries.listPublishedCategories, { tenantSlug });

  return {
    categories: data ?? [],
    isLoading: data === undefined,
  };
}
