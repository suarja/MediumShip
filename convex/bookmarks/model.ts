export type ExistingBookmark = { _id: string } | null;

export function resolveToggleBookmark(existingBookmark: ExistingBookmark): "insert" | "delete" {
  return existingBookmark ? "delete" : "insert";
}
