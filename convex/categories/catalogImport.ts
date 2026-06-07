"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

const IPTC_BASE = "http://cv.iptc.org/newscodes/mediatopic/";
const SKOS_CONCEPT_SHORT = "skos:Concept";
const SKOS_CONCEPT_FULL = "http://www.w3.org/2004/02/skos/core#Concept";

/** Parsed intermediate before DB write — mirrors the upsertCatalogNodes args. */
export type RawIptcNode = {
  externalId: string;
  label: string;
  labelFr?: string;
  parentExternalId?: string;
  retired: boolean;
};

function toExternalId(uri: string): string {
  // "http://cv.iptc.org/newscodes/mediatopic/20000344" → "medtop:20000344"
  if (uri.startsWith(IPTC_BASE)) {
    return `medtop:${uri.slice(IPTC_BASE.length)}`;
  }
  return uri;
}

/**
 * Parse an IPTC Media Topics SKOS JSON-LD graph into a flat node list.
 * Only processes `skos:Concept` nodes within the medtop namespace.
 * Retired (`owl:deprecated`) concepts are flagged but still included so the
 * importer can mark them and skip serving them to clients.
 */
export function parseIptcJson(json: unknown): RawIptcNode[] {
  const data = json as Record<string, unknown>;
  const graph = Array.isArray(data["@graph"]) ? (data["@graph"] as unknown[]) : [];

  const nodes: RawIptcNode[] = [];

  for (const item of graph) {
    const concept = item as Record<string, unknown>;

    // Filter to skos:Concept nodes only (skip ConceptScheme etc.)
    const types = concept["@type"];
    const typeArr = Array.isArray(types) ? (types as string[]) : typeof types === "string" ? [types] : [];
    const isConcept = typeArr.some(
      (t) => t === SKOS_CONCEPT_SHORT || t === SKOS_CONCEPT_FULL,
    );
    if (!isConcept) continue;

    const id = concept["@id"] as string | undefined;
    if (!id || !id.startsWith(IPTC_BASE)) continue;

    const externalId = toExternalId(id);

    // skos:prefLabel — may be array of language-tagged objects or a single object
    const rawLabels = concept["skos:prefLabel"];
    const labelArr = Array.isArray(rawLabels)
      ? (rawLabels as Array<Record<string, string>>)
      : rawLabels && typeof rawLabels === "object"
        ? [rawLabels as Record<string, string>]
        : [];

    const enLabel = labelArr.find((l) => l["@language"] === "en")?.["@value"];
    const frLabel = labelArr.find((l) => l["@language"] === "fr")?.["@value"];

    // Skip nodes without an English label
    if (!enLabel) continue;

    // skos:broader — first entry is the parent concept
    const broader = concept["skos:broader"];
    const broaderArr = Array.isArray(broader)
      ? (broader as Array<Record<string, string>>)
      : broader && typeof broader === "object"
        ? [broader as Record<string, string>]
        : [];
    const parentUri = broaderArr[0]?.["@id"];
    const parentExternalId =
      parentUri && parentUri.startsWith(IPTC_BASE)
        ? toExternalId(parentUri)
        : undefined;

    // owl:deprecated
    const deprecated = concept["owl:deprecated"];
    const retired = deprecated === true || deprecated === "true";

    nodes.push({
      externalId,
      label: enLabel,
      ...(frLabel !== undefined && { labelFr: frLabel }),
      ...(parentExternalId !== undefined && { parentExternalId }),
      retired,
    });
  }

  return nodes;
}

const IPTC_DEFAULT_URL = "http://cv.iptc.org/newscodes/mediatopic/?format=json";

/**
 * Internal action: fetch IPTC Media Topics JSON, parse it, and upsert into
 * the `categoryCatalog` table.  Run once manually:
 *   npx convex run categories/catalogImport:importIptcMediaTopics
 */
export const importIptcMediaTopics = internalAction({
  args: {
    /** Override the IPTC URL (useful for pointing at a cached copy). */
    url: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ parsed: number; imported: number }> => {
    const url = args.url ?? IPTC_DEFAULT_URL;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(
        `IPTC fetch failed: ${response.status} ${response.statusText}`,
      );
    }
    const json = (await response.json()) as unknown;
    const nodes = parseIptcJson(json);

    const imported: number = await ctx.runMutation(
      internal.categories.catalog.upsertCatalogNodes,
      { nodes },
    );

    return { parsed: nodes.length, imported };
  },
});
