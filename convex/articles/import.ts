import { v } from "convex/values";

import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action, internalMutation } from "../_generated/server";
import { syncContentInsert } from "../categories/aggregate";
import { normalizeScoringKey } from "../discovery/scoring";
import { defaultTenant } from "../../src/features/tenant/default-tenant";

const ARTICLE_USER_AGENT = "MediumShip/1.0 (CMS article import)";
const DEFAULT_ARTICLE_CATEGORY = "Analyses";
const MAX_BODY_CHARS = 20000;
const MIN_PARAGRAPH_CHARS = 40;

function decodeHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&(?:apos|rsquo|lsquo);/g, "'")
    .replace(/&(?:quot|ldquo|rdquo);/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function firstTag(html: string, tag: string): string | undefined {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match?.[1]) {
    return undefined;
  }
  return decodeHtml(stripTags(match[1])).replace(/\s+/g, " ").trim() || undefined;
}

/** Reads a `<meta property|name="key" content="…">` value (attribute order agnostic). */
export function metaContent(html: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const after = html.match(
      new RegExp(
        `<meta[^>]*\\b(?:property|name)=["']${escaped}["'][^>]*\\bcontent=["']([^"']*)["']`,
        "i",
      ),
    );
    const before = after
      ? null
      : html.match(
          new RegExp(
            `<meta[^>]*\\bcontent=["']([^"']*)["'][^>]*\\b(?:property|name)=["']${escaped}["']`,
            "i",
          ),
        );
    const value = after?.[1] ?? before?.[1];
    if (value) {
      return decodeHtml(value).trim();
    }
  }
  return undefined;
}

export function extractTitle(html: string): string | undefined {
  return (
    metaContent(html, ["og:title", "twitter:title"]) ??
    firstTag(html, "title") ??
    firstTag(html, "h1")
  );
}

function pickReadableContainer(html: string): string {
  const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (article?.[1]) {
    return article[1];
  }
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (main?.[1]) {
    return main[1];
  }
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return body?.[1] ?? html;
}

/** Lightweight reader-mode body: paragraph text from the main container. */
export function extractReadableBody(html: string): string {
  const container = pickReadableContainer(html);
  const paragraphs = [...container.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => decodeHtml(stripTags(match[1])).replace(/\s+/g, " ").trim())
    .filter((text) => text.length >= MIN_PARAGRAPH_CHARS);
  const body = paragraphs.join("\n\n");
  return body.length > MAX_BODY_CHARS ? body.slice(0, MAX_BODY_CHARS) : body;
}

function buildArticleSlug(title: string, url: string): string {
  const base = normalizeScoringKey(title).slice(0, 50) || "article";
  let hash = 0;
  for (let i = 0; i < url.length; i += 1) {
    hash = (hash * 31 + url.charCodeAt(i)) >>> 0;
  }
  return `web-${base}-${hash.toString(36).slice(0, 6).padStart(6, "0")}`;
}

/** Idempotently inserts a draft article from a fetched web page. Internal. */
export const insertImportedWebArticle = internalMutation({
  args: {
    title: v.string(),
    summary: v.string(),
    articleBody: v.string(),
    canonicalUrl: v.string(),
    imageUrl: v.optional(v.string()),
    category: v.string(),
  },
  returns: v.id("contents"),
  handler: async (ctx, args) => {
    const slug = buildArticleSlug(args.title, args.canonicalUrl);

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
      tags: [],
      isPremium: false,
      articleBody: args.articleBody,
      source: "web" as const,
      canonicalUrl: args.canonicalUrl,
      ...(args.imageUrl ? { heroImageUrl: args.imageUrl } : {}),
    });

    const newDoc = await ctx.db.get(newId);
    if (newDoc) {
      await syncContentInsert(ctx, newDoc);
    }
    return newId;
  },
});

/**
 * Imports any web article by URL: fetches the page, extracts a reader-mode
 * title/summary/body (best-effort), and creates a draft with source="web" +
 * canonicalUrl for attribution. Admin-gated, mirrors the other importers.
 */
export const importArticleFromUrl = action({
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
    if (!viewer.isAuthenticated || !viewer.isAdmin) {
      throw new Error("Forbidden");
    }

    const trimmedUrl = url.trim();
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      return { imported: false as const, reason: "not-a-url" as const };
    }

    let html: string;
    try {
      const response = await fetch(trimmedUrl, {
        headers: { "User-Agent": ARTICLE_USER_AGENT, accept: "text/html" },
      });
      if (!response.ok) {
        return { imported: false as const, reason: "fetch-error" as const };
      }
      html = await response.text();
    } catch {
      return { imported: false as const, reason: "fetch-failed" as const };
    }

    const title = extractTitle(html);
    const articleBody = extractReadableBody(html);
    if (!title || articleBody.length === 0) {
      return { imported: false as const, reason: "no-readable-content" as const };
    }

    const metaSummary = metaContent(html, ["og:description", "description"]);
    const summary = (metaSummary ?? articleBody.slice(0, 300)).slice(0, 400);

    const contentId: Id<"contents"> = await ctx.runMutation(
      internal.articles.import.insertImportedWebArticle,
      {
        title,
        summary,
        articleBody,
        canonicalUrl: trimmedUrl,
        imageUrl: metaContent(html, ["og:image", "twitter:image"]),
        category: category?.trim() || DEFAULT_ARTICLE_CATEGORY,
      },
    );

    return { imported: true as const, contentId, title };
  },
});
