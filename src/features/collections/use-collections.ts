import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAppTheme } from "../theme/theme-provider";
import type { Collection, CollectionDetail } from "./types";

export function useCollections(): { collections: Collection[]; isLoading: boolean } {
  const { tenantSlug } = useAppTheme();
  const data = useQuery(api.collections.queries.listPublishedCollections, { tenantSlug });

  return {
    collections: data ?? [],
    isLoading: data === undefined,
  };
}

export function useCollection(id: string): { collection?: CollectionDetail; isLoading: boolean } {
  const data = useQuery(
    api.collections.queries.getPublishedCollectionById,
    id ? { id: id as Id<"collections"> } : "skip",
  );

  return {
    collection: data ?? undefined,
    isLoading: data === undefined,
  };
}
