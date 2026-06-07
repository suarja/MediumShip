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
 */
export const importIptcMediaTopics = internalAction({
  args: {
    url: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ parsed: number; imported: number; frenchLabels: number }> => {
    const enJson = await fetchIptcJson(args.url ?? IPTC_EN_URL);
    const enNodes = parseIptcJson(enJson, { primaryLocale: "en" });
    if (enNodes.length === 0) {
      throw new Error(
        "IPTC parse returned 0 concepts — the source format may have changed",
      );
    }

    let nodes: RawIptcNode[] = enNodes;
    let frenchLabels = enNodes.filter((node) => node.labelFr).length;

    if (!args.url) {
      const frJson = await fetchIptcJson(IPTC_FR_URL);
      const frNodes = parseIptcJson(frJson, { primaryLocale: "fr" });
      if (frNodes.length === 0) {
        throw new Error(
          "IPTC French fetch parsed 0 concepts — check ?lang=fr endpoint",
        );
      }
      nodes = mergeIptcLocalizedNodes(enNodes, frNodes);
      frenchLabels = nodes.filter((node) => node.labelFr).length;
    }

    const imported: number = await ctx.runMutation(
      internal.categories.catalog.upsertCatalogNodes,
      { nodes },
    );

    return { parsed: nodes.length, imported, frenchLabels };
  },
});
