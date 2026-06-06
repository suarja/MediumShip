export type Collection = {
  _id: string;
  slug: string;
  title: string;
  summary: string;
  coverImageUrl?: string;
  itemCount: number;
};

export type CollectionItem = {
  contentId: string;
  title: string;
  kind: "article" | "episode" | "video";
  category: string;
  isPremium: boolean;
  coverImageUrl?: string;
};

export type CollectionDetail = Collection & { items: CollectionItem[] };
