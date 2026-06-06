import { v } from "convex/values";

import { mutation, query, type MutationCtx } from "../_generated/server";
import { defaultTenant } from "../../src/features/tenant/default-tenant";
import { normalizeRemoteImageUrl } from "../../src/features/content/selectors";
import { requireCmsAdmin } from "./authz";

const collectionStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived"),
);

const COLLECTION_STATUSES = ["draft", "published", "archived"] as const;

function buildSlug() {
  return `collection-${Date.now().toString(36)}`;
}

function sanitizeText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeCoverImageUrl(value: string | null | undefined) {
  const trimmed = sanitizeText(value);
  return trimmed ? normalizeRemoteImageUrl(trimmed) : undefined;
}

async function ensureUniqueCollectionSlug(
  ctx: MutationCtx,
  tenantSlug: string,
  slug: string,
  existingId?: string,
) {
  const existing = await ctx.db
    .query("collections")
    .withIndex("by_tenantSlug_and_slug", (q) =>
      q.eq("tenantSlug", tenantSlug).eq("slug", slug),
    )
    .unique();

  if (existing && existing._id !== existingId) {
    throw new Error("Slug already exists for this tenant");
  }
}

export const listCmsCollections = query({
  args: { tenantSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const tenantSlug = args.tenantSlug ?? defaultTenant.slug;
    const rows = await Promise.all(
      COLLECTION_STATUSES.map((status) =>
        ctx.db
          .query("collections")
          .withIndex("by_tenant_and_status", (q) =>
            q.eq("tenantSlug", tenantSlug).eq("status", status),
          )
          .collect(),
      ),
    );

    return rows
      .flat()
      .sort((left, right) => right.updatedAt - left.updatedAt);
  },
});

export const getCmsCollection = query({
  args: { id: v.id("collections") },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const collection = await ctx.db.get(args.id);
    if (!collection) {
      return null;
    }

    const items = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection_and_order", (q) =>
        q.eq("collectionId", args.id),
      )
      .order("asc")
      .collect();

    const resolvedItems = await Promise.all(
      items.map(async (item) => {
        const content = await ctx.db.get(item.contentId);
        if (!content) {
          return null;
        }

        return {
          order: item.order,
          contentId: item.contentId,
          title: content.title,
          kind: content.kind,
          status: content.status,
          slug: content.slug,
        };
      }),
    );

    return {
      collection,
      items: resolvedItems.filter((item) => item !== null),
    };
  },
});

export const createCollection = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    coverImageUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const slug = args.slug.trim() || buildSlug();
    await ensureUniqueCollectionSlug(ctx, defaultTenant.slug, slug);

    return await ctx.db.insert("collections", {
      tenantSlug: defaultTenant.slug,
      status: "draft",
      slug,
      title: args.title.trim() || "Nouvelle collection",
      summary: args.summary.trim(),
      ...(normalizeCoverImageUrl(args.coverImageUrl ?? undefined)
        ? { coverImageUrl: normalizeCoverImageUrl(args.coverImageUrl ?? undefined) }
        : {}),
      updatedAt: Date.now(),
    });
  },
});

export const updateCollection = mutation({
  args: {
    id: v.id("collections"),
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    coverImageUrl: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Collection not found");
    }

    const slug = args.slug.trim();
    const title = args.title.trim();
    if (!slug || !title) {
      throw new Error("Title and slug are required");
    }

    await ensureUniqueCollectionSlug(ctx, existing.tenantSlug, slug, existing._id);

    const coverImageUrl = normalizeCoverImageUrl(args.coverImageUrl);

    await ctx.db.patch(existing._id, {
      slug,
      title,
      summary: args.summary.trim(),
      updatedAt: Date.now(),
      ...(coverImageUrl ? { coverImageUrl } : { coverImageUrl: undefined }),
    });

    return existing._id;
  },
});

export const setCollectionStatus = mutation({
  args: {
    id: v.id("collections"),
    status: collectionStatusValidator,
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Collection not found");
    }

    await ctx.db.patch(existing._id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const setCollectionItems = mutation({
  args: {
    collectionId: v.id("collections"),
    contentIds: v.array(v.id("contents")),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const collection = await ctx.db.get(args.collectionId);
    if (!collection) {
      throw new Error("Collection not found");
    }

    for (const contentId of args.contentIds) {
      const content = await ctx.db.get(contentId);
      if (!content) {
        throw new Error("Content not found");
      }

      if (content.tenantSlug !== collection.tenantSlug) {
        throw new Error("Content belongs to another tenant");
      }
    }

    const existingItems = await ctx.db
      .query("collectionItems")
      .withIndex("by_collection_and_order", (q) =>
        q.eq("collectionId", args.collectionId),
      )
      .collect();

    for (const item of existingItems) {
      await ctx.db.delete(item._id);
    }

    for (const [index, contentId] of args.contentIds.entries()) {
      await ctx.db.insert("collectionItems", {
        tenantSlug: collection.tenantSlug,
        collectionId: args.collectionId,
        contentId,
        order: index,
      });
    }

    await ctx.db.patch(collection._id, { updatedAt: Date.now() });

    return args.collectionId;
  },
});
