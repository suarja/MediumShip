import { v } from "convex/values";

import { query } from "../_generated/server";
import { isEditorialContent } from "./source";

/** Bounded sample for tag-frequency trending (heuristic, not exhaustive). */
const TRENDING_SAMPLE_SIZE = 400;
/** Bounded field-wide scan for search beyond the title search index. */
const SEARCH_FIELD_SCAN_LIMIT = 600;

export const listPublishedFeed = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    // Editorial = CMS (or legacy rows with no `source`). Read those directly via
    // the source index instead of scanning the full published corpus: Wikipedia/
    // YouTube/RSS ingestion makes that corpus unbounded (~14MB), while editorial
    // content is bounded by human curation (a handful of rows).
    const [cms, legacy] = await Promise.all([
      ctx.db
        .query("contents")
        .withIndex("by_tenant_source_external", (q) =>
          q.eq("tenantSlug", args.tenantSlug).eq("source", "cms"),
        )
        .collect(),
      ctx.db
        .query("contents")
        .withIndex("by_tenant_source_external", (q) =>
          q.eq("tenantSlug", args.tenantSlug).eq("source", undefined),
        )
        .collect(),
    ]);

    return [...cms, ...legacy].filter(
      (content) =>
        content.status === "published" && isEditorialContent(content),
    );
  },
});

export const getPublishedById = query({
  args: { id: v.id("contents") },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content || content.status !== "published") {
      return null;
    }
    return content;
  },
});

export const searchPublished = query({
  args: { tenantSlug: v.string(), query: v.string() },
  handler: async (ctx, args) => {
    const lower = args.query.trim().toLowerCase();
    if (lower.length === 0) {
      return { contents: [] };
    }

    // Search spans every source (CMS + Wikipedia/YouTube/RSS) AND every field.
    const matches = (content: {
      title: string;
      summary: string;
      category: string;
      tags: string[];
    }) =>
      content.title.toLowerCase().includes(lower) ||
      content.summary.toLowerCase().includes(lower) ||
      content.category.toLowerCase().includes(lower) ||
      content.tags.some((tag) => tag.toLowerCase().includes(lower));

    // Ranked title matches (relevance from the full-text index).
    const titleHits = await ctx.db
      .query("contents")
      .withSearchIndex("search_title", (q) =>
        q
          .search("title", args.query)
          .eq("tenantSlug", args.tenantSlug)
          .eq("status", "published"),
      )
      .take(40);

    // Field-wide matches the title index can't surface — e.g. tapping a trending
    // tag whose word never appears in any title. Bounded scan for the demo set.
    const scanned = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "published"),
      )
      .take(SEARCH_FIELD_SCAN_LIMIT);

    const seen = new Set<string>();
    const results: typeof titleHits = [];
    for (const content of [...titleHits, ...scanned]) {
      if (seen.has(content._id)) continue;
      if (!matches(content)) continue;
      seen.add(content._id);
      results.push(content);
      if (results.length >= 40) break;
    }

    return { contents: results };
  },
});

/**
 * Real "trends" for the Explore surface: the most frequent tags across published
 * content (all sources). Bounded sample keeps it cheap on large discovery sets.
 */
export const getTrendingTopics = query({
  args: { tenantSlug: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const sample = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "published"),
      )
      .take(TRENDING_SAMPLE_SIZE);

    const counts = new Map<string, number>();
    for (const content of sample) {
      for (const tag of content.tags) {
        const key = tag.trim();
        if (key.length < 3) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    const limit = args.limit ?? 6;
    const topics = [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    return { topics };
  },
});

export const listPublishedByCategory = query({
  args: { tenantSlug: v.string(), category: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status_and_category", (q) =>
        q
          .eq("tenantSlug", args.tenantSlug)
          .eq("status", "published")
          .eq("category", args.category),
      )
      .take(50);

    return rows.filter(isEditorialContent);
  },
});

