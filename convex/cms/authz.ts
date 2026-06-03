import type { MutationCtx, QueryCtx } from "../_generated/server";

type CmsCtx = QueryCtx | MutationCtx;

export async function findCurrentCmsUser(ctx: CmsCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return { identity: null, user: null };
  }

  const byToken = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  const user =
    byToken ??
    (await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique());

  return { identity, user };
}

export async function hasCmsAdmin(ctx: CmsCtx) {
  const admins = await ctx.db
    .query("users")
    .withIndex("by_cmsRole", (q) => q.eq("cmsRole", "admin"))
    .take(1);

  return admins.length > 0;
}

export async function getCmsViewer(ctx: CmsCtx) {
  const { identity, user } = await findCurrentCmsUser(ctx);
  const adminExists = await hasCmsAdmin(ctx);

  return {
    identity,
    user,
    adminExists,
    isAdmin: user?.cmsRole === "admin",
    canBootstrapAdmin: identity !== null && !adminExists,
  };
}

export async function requireCmsAdmin(ctx: CmsCtx) {
  const viewer = await getCmsViewer(ctx);
  if (!viewer.identity) {
    throw new Error("Unauthenticated");
  }

  if (!viewer.isAdmin) {
    throw new Error("Forbidden");
  }

  return viewer;
}
