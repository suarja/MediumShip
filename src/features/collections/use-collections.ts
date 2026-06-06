// Slice 3: fixture-backed. Slice 4 swaps the body to a Convex query; the return shape is the contract — do not change it here.
import type { Collection, CollectionDetail } from "./types";
import { FIXTURE_COLLECTIONS, FIXTURE_COLLECTION_DETAILS } from "./fixtures";

export function useCollections(): { collections: Collection[]; isLoading: boolean } {
  return { collections: FIXTURE_COLLECTIONS, isLoading: false };
}

export function useCollection(id: string): { collection?: CollectionDetail; isLoading: boolean } {
  return { collection: FIXTURE_COLLECTION_DETAILS[id], isLoading: false };
}
