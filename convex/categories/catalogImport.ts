"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

import {
  mergeIptcLocalizedNodes,
  parseIptcJson,
  type RawIptcNode,
} from "./catalogImportParse";

export type { RawIptcNode };
export { mergeIptcLocalizedNodes, parseIptcJson };

const IPTC_EN_URL = "https://cv.iptc.org/newscodes/mediatopic/?format=json";
const IPTC_FR_URL = "https://cv.iptc.org/newscodes/mediatopic/?format=json&lang=fr";

async function fetchIptcJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `IPTC fetch failed (${url}): ${response.status} ${response.statusText}`,
    );
  }
  return response.json();
}

/**
 * Internal action: fetch IPTC Media Topics JSON (EN + FR), parse, merge, upsert.
 * Run once manually:
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
    const enJson = await fetchIptcJson(args.url ?? IPTC_EN_URL);
    const enNodes = parseIptcJson(enJson);
    if (enNodes.length === 0) {
      throw new Error(
        "IPTC parse returned 0 concepts — the source format may have changed",
      );
    }

    let nodes: RawIptcNode[] = enNodes;
    if (!args.url) {
      try {
        const frJson = await fetchIptcJson(IPTC_FR_URL);
        const frNodes = parseIptcJson(frJson);
        nodes = mergeIptcLocalizedNodes(enNodes, frNodes);
      } catch {
        // French labels are optional — keep English-only import if FR fetch fails.
      }
    }

    const imported: number = await ctx.runMutation(
      internal.categories.catalog.upsertCatalogNodes,
      { nodes },
    );

    return { parsed: nodes.length, imported };
  },
});
