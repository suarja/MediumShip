export type AppEvent = {
  _id: string;
  title: string;
  summary: string;
  startsAt: string;
  locationLabel: string;
  mode: "online" | "offline" | "hybrid";
  access: "free" | "member" | "premium";
  status: "scheduled" | "archived";
  coverImageUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  communityUrl?: string;
  descriptionLong?: string;
};

export type EventFilter = "upcoming" | "online" | "local";
