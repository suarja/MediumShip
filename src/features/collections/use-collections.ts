import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { tryParseConvexId } from "../convex/parse-id";
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
  const convexId = tryParseConvexId<"collections">(id);
  const data = useQuery(
    api.collections.queries.getPublishedCollectionById,
    convexId ? { id: convexId } : "skip",
  );

  return {
    collection: convexId ? (data ?? undefined) : undefined,
    isLoading: convexId ? data === undefined : false,
  };
}
