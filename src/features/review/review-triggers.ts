export const REVIEW_TRIGGERS = [
  "premium_activated",
  "list_add",
  "first_bookmark",
] as const;

export type ReviewTrigger = (typeof REVIEW_TRIGGERS)[number];

export function isReviewTrigger(value: string): value is ReviewTrigger {
  return (REVIEW_TRIGGERS as readonly string[]).includes(value);
}
