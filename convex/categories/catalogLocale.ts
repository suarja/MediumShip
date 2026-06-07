export const CATALOG_LOCALES = ["en", "fr"] as const;
export type CatalogLocale = (typeof CATALOG_LOCALES)[number];

export const WIKIPEDIA_LOCALES = ["en", "fr"] as const;
export type WikipediaLocale = (typeof WIKIPEDIA_LOCALES)[number];

export function resolveCatalogDisplayLabel(
  node: { label: string; labelFr?: string },
  locale: CatalogLocale,
): string {
  if (locale === "fr" && node.labelFr) {
    return node.labelFr;
  }
  return node.label;
}

export function catalogSearchHaystack(node: {
  label: string;
  labelFr?: string;
}): string[] {
  return [node.label, node.labelFr].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
}

export function wikipediaApiUrlForLocale(locale: WikipediaLocale): string {
  const subdomain = locale === "fr" ? "fr" : "en";
  return `https://${subdomain}.wikipedia.org/w/api.php`;
}
