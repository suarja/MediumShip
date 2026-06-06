import type { Doc } from "../../../convex/_generated/dataModel";

export type PersonalListSummary = Doc<"personalLists"> & {
  itemCount: number;
  previewCoverUrls: string[];
};
