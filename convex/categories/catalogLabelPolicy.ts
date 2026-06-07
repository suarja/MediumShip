import { normalizeSearchQuery } from "./tree";
import { CATALOG_TAXONOMY_MAX_DEPTH } from "./catalogConstants";

export { CATALOG_TAXONOMY_MAX_DEPTH };

/**
 * Stop-words stripped when counting label breadth for IPTC depth-0 nodes.
 * Prepositions, articles, and coordinating conjunctions (FR + EN).
 */
const LABEL_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "au",
  "aux",
  "by",
  "d",
  "dans",
  "de",
  "des",
  "du",
  "en",
  "et",
  "for",
  "from",
  "in",
  "l",
  "la",
  "le",
  "les",
  "of",
  "on",
  "or",
  "ou",
  "par",
  "pour",
  "sur",
  "the",
  "to",
  "un",
  "une",
  "with",
]);

/** Split catalog labels on whitespace and common IPTC separators. */
export function tokenizeCatalogLabel(label: string): string[] {
  return label
    .split(/[\s,;/&]+/)
    .map((token) => normalizeSearchQuery(token))
    .filter((token) => token.length > 0);
}

export function countMeaningfulLabelWords(label: string): number {
  return tokenizeCatalogLabel(label).filter((token) => !LABEL_STOP_WORDS.has(token))
    .length;
}

/** Depth-0 IPTC families with at most two meaningful words may be added to a tenant. */
export function isCompactCatalogRootLabel(label: string): boolean {
  const count = countMeaningfulLabelWords(label);
  return count >= 1 && count <= 2;
}

export function canAddCatalogNodeToTenant(depth: number, displayLabel: string): boolean {
  if (depth > 0) {
    return true;
  }

  return isCompactCatalogRootLabel(displayLabel);
}
