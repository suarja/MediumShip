import { v } from "convex/values";

import { query } from "../_generated/server";
import { requireAuth } from "../entitlements/authz";
import { resolveListPreviewCoverUrls } from "./covers";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAuth(ctx);
    const lists = await ctx.db
      .query("personalLists")
      .withIndex("by_tokenIdentifier_and_updatedAt", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .order("desc")
      .collect();

    return Promise.all(
      lists.map(async (list) => {
        const items = await ctx.db
          .query("personalListItems")
          .withIndex("by_listId_and_position", (q) => q.eq("listId", list._id))
          .collect();

        const previewCoverUrls = await resolveListPreviewCoverUrls(ctx, list._id);

        return {
          ...list,
          itemCount: items.length,
          previewCoverUrls,
        };
      }),
    );
  },
});

export const getById = query({
  args: { listId: v.id("personalLists") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const list = await ctx.db.get(args.listId);

    if (!list || list.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("List not found");
    }

    return list;
  },
});

export const listMineForContent = query({
  args: { contentId: v.id("contents") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const lists = await ctx.db
      .query("personalLists")
      .withIndex("by_tokenIdentifier_and_updatedAt", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .order("desc")
      .collect();

    return Promise.all(
      lists.map(async (list) => {
        const items = await ctx.db
          .query("personalListItems")
          .withIndex("by_listId_and_position", (q) => q.eq("listId", list._id))
          .collect();

        const contains = items.some((item) => item.contentId === args.contentId);

        return {
          ...list,
          itemCount: items.length,
          contains,
        };
      }),
    );
  },
});

export const listWithItems = query({
  args: { listId: v.id("personalLists") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const list = await ctx.db.get(args.listId);

    if (!list || list.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("List not found");
    }

    const items = await ctx.db
      .query("personalListItems")
      .withIndex("by_listId_and_position", (q) => q.eq("listId", args.listId))
      .order("asc")
      .collect();

    const resolved = await Promise.all(
      items.map(async (item) => {
        const content = await ctx.db.get(item.contentId);
        if (!content || content.status !== "published") {
          return null;
        }

        return {
          itemId: item._id,
          content,
          position: item.position,
          addedAt: item.addedAt,
        };
      }),
    );

    return {
      list,
      items: resolved.filter((item) => item !== null),
    };
  },
});
