import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { mutation } from "../_generated/server";
import { getMyEntitlementDoc, requireAuth } from "../entitlements/authz";
import {
  canCreateAnotherList,
  PersonalListLimitError,
} from "./model";

async function requireOwnedList(
  ctx: MutationCtx,
  listId: Id<"personalLists">,
  tokenIdentifier: string,
) {
  const list = await ctx.db.get(listId);

  if (!list || list.tokenIdentifier !== tokenIdentifier) {
    throw new Error("List not found");
  }

  return list;
}

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const title = args.title.trim();

    if (!title) {
      throw new Error("Title is required");
    }

    const existing = await ctx.db
      .query("personalLists")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .collect();

    const entitlement = await getMyEntitlementDoc(ctx);
    if (!canCreateAnotherList(existing.length, entitlement)) {
      throw new PersonalListLimitError();
    }

    const now = Date.now();
    const listId = await ctx.db.insert("personalLists", {
      tokenIdentifier: identity.tokenIdentifier,
      title,
      visibility: "private",
      createdAt: now,
      updatedAt: now,
    });

    return { listId };
  },
});

export const rename = mutation({
  args: {
    listId: v.id("personalLists"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    const title = args.title.trim();

    if (!title) {
      throw new Error("Title is required");
    }

    await requireOwnedList(ctx, args.listId, identity.tokenIdentifier);
    await ctx.db.patch(args.listId, { title, updatedAt: Date.now() });

    return { listId: args.listId };
  },
});

export const remove = mutation({
  args: { listId: v.id("personalLists") },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    await requireOwnedList(ctx, args.listId, identity.tokenIdentifier);

    const items = await ctx.db
      .query("personalListItems")
      .withIndex("by_listId_and_position", (q) => q.eq("listId", args.listId))
      .collect();

    await Promise.all(items.map((item) => ctx.db.delete(item._id)));
    await ctx.db.delete(args.listId);

    return { deleted: true };
  },
});

export const addItem = mutation({
  args: {
    listId: v.id("personalLists"),
    contentId: v.id("contents"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    await requireOwnedList(ctx, args.listId, identity.tokenIdentifier);

    const content = await ctx.db.get(args.contentId);
    if (!content || content.status !== "published") {
      throw new Error("Content not found");
    }

    const existing = await ctx.db
      .query("personalListItems")
      .withIndex("by_listId_and_contentId", (q) =>
        q.eq("listId", args.listId).eq("contentId", args.contentId),
      )
      .unique();

    if (existing) {
      return { itemId: existing._id, added: false };
    }

    const items = await ctx.db
      .query("personalListItems")
      .withIndex("by_listId_and_position", (q) => q.eq("listId", args.listId))
      .collect();

    const maxPosition = items.reduce(
      (max, item) => Math.max(max, item.position),
      -1,
    );

    const itemId = await ctx.db.insert("personalListItems", {
      listId: args.listId,
      contentId: args.contentId,
      position: maxPosition + 1,
      addedAt: Date.now(),
    });

    await ctx.db.patch(args.listId, { updatedAt: Date.now() });

    return { itemId, added: true };
  },
});

export const removeItem = mutation({
  args: {
    listId: v.id("personalLists"),
    contentId: v.id("contents"),
  },
  handler: async (ctx, args) => {
    const identity = await requireAuth(ctx);
    await requireOwnedList(ctx, args.listId, identity.tokenIdentifier);

    const existing = await ctx.db
      .query("personalListItems")
      .withIndex("by_listId_and_contentId", (q) =>
        q.eq("listId", args.listId).eq("contentId", args.contentId),
      )
      .unique();

    if (!existing) {
      return { removed: false };
    }

    await ctx.db.delete(existing._id);
    await ctx.db.patch(args.listId, { updatedAt: Date.now() });

    return { removed: true };
  },
});
