import type { Doc } from "../_generated/dataModel";
import type { Collection, CollectionItem } from "../../src/features/collections/types";

export function toCollectionSummary(
  doc: Doc<"collections">,
  itemCount: number,
): Collection {
  return {
    _id: doc._id,
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    coverImageUrl: doc.coverImageUrl,
    itemCount,
  };
}

export function toCollectionItem(contentDoc: Doc<"contents">): CollectionItem {
  return {
    contentId: contentDoc._id,
    title: contentDoc.title,
    kind: contentDoc.kind,
    category: contentDoc.category,
    isPremium: contentDoc.isPremium,
    coverImageUrl: contentDoc.heroImageUrl,
  };
}
