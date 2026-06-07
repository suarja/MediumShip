export const CMS_TABS = [
  "contents",
  "categories",
  "collections",
  "events",
  "modules",
  "tenant",
  "users",
  "developer",
] as const;

export type CmsTab = (typeof CMS_TABS)[number];

export function isCmsTab(value: string | null | undefined): value is CmsTab {
  return (CMS_TABS as readonly string[]).includes(value ?? "");
}
