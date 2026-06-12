import { v } from "convex/values";

import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, internalMutation } from "../_generated/server";
import { syncContentInsert } from "../categories/aggregate";
import { normalizeScoringKey } from "../discovery/scoring";
import { defaultTenant } from "../../src/features/tenant/default-tenant";

const WIKIPEDIA_USER_AGENT = "MediumShip/1.0 (CMS Wikipedia import)";
const DEFAULT_IMPORT_CATEGORY = "Analyses";

/** Parses a Wikipedia article URL into { lang, title }. Pure — unit tested. */
export function parseWikipediaUrl(url: string): { lang: string; title: string } | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.match(/^([a-z]{2,3})\.(?:m\.)?wikipedia\.org$/i);
    if (!host) {
      return null;
    }
    const lang = host[1].toLowerCase();
    const path = decodeURIComponent(parsed.pathname);
    const wiki = path.match(/^\/wiki\/(.+)$/);
    if (!wiki) {
      return null;
    }
    const title = wiki[1].replace(/_/g, " ").trim();
    return title ? { lang, title } : null;
  } catch {
    return null;
  }
}

function buildWikipediaSlug(title: string, pageId: number): string {
  const base = normalizeScoringKey(title).slice(0, 60) || "article";
  return `wikipedia-${base}-${pageId}`;
}

/**
 * Inserts (idempotently) a draft article from a fetched Wikipedia summary, with
 * `source: "wikipedia"` + canonical URL so the detail screen shows attribution.
 * Internal — only the import action calls it (after the admin check).
 */
export const insertImportedWikipediaArticle = internalMutation({
  args: {
    title: v.string(),
    summary: v.string(),
    articleBody: v.string(),
    canonicalUrl: v.string(),
    externalId: v.string(),
    coverImageUrl: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    pageId: v.number(),
  },
  returns: v.id("contents"),
  handler: async (ctx, args) => {
    const slug = buildWikipediaSlug(args.title, args.pageId);

    const existing = await ctx.db
      .query("contents")
      .withIndex("by_tenantSlug_and_slug", (q) =>
        q.eq("tenantSlug", defaultTenant.slug).eq("slug", slug),
      )
      .unique();
    if (existing) {
      return existing._id;
    }

    const newId = await ctx.db.insert("contents", {
      tenantSlug: defaultTenant.slug,
      kind: "article" as const,
      status: "draft" as const,
      slug,
      title: args.title,
      summary: args.summary,
      category: args.category,
      tags: args.tags,
      isPremium: false,
      articleBody: args.articleBody,
      source: "wikipedia" as const,
      canonicalUrl: args.canonicalUrl,
      externalId: args.externalId,
      ...(args.coverImageUrl ? { heroImageUrl: args.coverImageUrl } : {}),
    });

    const newDoc = await ctx.db.get(newId);
    if (newDoc) {
      await syncContentInsert(ctx, newDoc);
    }
    return newId;
  },
});

type WikipediaSummary = {
  title?: string;
  extract?: string;
  pageid?: number;
  content_urls?: { desktop?: { page?: string } };
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
};

/**
 * Imports a specific Wikipedia article (any language) as a draft article via the
 * REST summary API. Admin-gated like enrichFromYoutube. Returns the created
 * content id so the CMS can open it / add it to a collection.
 */
export const importWikipediaArticle = action({
  args: { url: v.string(), category: v.optional(v.string()) },
  returns: v.union(
    v.object({ imported: v.literal(false), reason: v.string() }),
    v.object({
      imported: v.literal(true),
      contentId: v.id("contents"),
      title: v.string(),
    }),
  ),
  handler: async (ctx, { url, category }) => {
    const viewer = await ctx.runQuery(api.cms.queries.getViewer, {});
    if (!viewer.isAuthenticated) {
      throw new Error("Unauthenticated");
    }
    if (!viewer.isAdmin) {
      throw new Error("Forbidden");
    }

    const parsed = parseWikipediaUrl(url);
    if (!parsed) {
      return { imported: false as const, reason: "not-a-wikipedia-url" as const };
    }

    const endpoint = `https://${parsed.lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      parsed.title.replace(/ /g, "_"),
    )}`;
    const response = await fetch(endpoint, {
      headers: { "User-Agent": WIKIPEDIA_USER_AGENT, accept: "application/json" },
    });
    if (!response.ok) {
      return { imported: false as const, reason: "not-found-or-error" as const };
    }

    const data = (await response.json()) as WikipediaSummary;
    const title = data.title ?? parsed.title;
    const extract = data.extract ?? "";
    const summary = extract.length > 400 ? `${extract.slice(0, 397)}…` : extract;

    const contentId: Id<"contents"> = await ctx.runMutation(
      internal.wikipedia.import.insertImportedWikipediaArticle,
      {
        title,
        summary,
        articleBody: extract,
        canonicalUrl: data.content_urls?.desktop?.page ?? url,
        externalId: String(data.pageid ?? ""),
        coverImageUrl: data.originalimage?.source ?? data.thumbnail?.source,
        category: category?.trim() || DEFAULT_IMPORT_CATEGORY,
        tags: [],
        pageId: data.pageid ?? 0,
      },
    );

    return { imported: true as const, contentId, title };
  },
});
