import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { isProFromEntitlement } from "./model";

type EntitlementCtx = QueryCtx | MutationCtx;

// Resolves the entitlement row for the *currently signed-in* identity. Mirrors
// the user-lookup fallback used elsewhere (tokenIdentifier first, then the raw
// Clerk subject) so a row written by either path is found. Returns null for
// guests and never throws — the read path stays alive across auth gaps.
export async function getMyEntitlementDoc(
  ctx: EntitlementCtx,
): Promise<Doc<"entitlements"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const byToken = await ctx.db
    .query("entitlements")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  return (
    byToken ??
    (await ctx.db
      .query("entitlements")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique())
  );
}

// Guard for member-only mutations/queries. Throws when the caller is not a
// member; returns the row otherwise. The decision flows through the pure
// `isProFromEntitlement` seam so the rule is defined exactly once.
export async function requireMember(
  ctx: EntitlementCtx,
): Promise<Doc<"entitlements">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }

  const doc = await getMyEntitlementDoc(ctx);
  if (!isProFromEntitlement(doc)) {
    throw new Error("Member access required");
  }

  return doc as Doc<"entitlements">;
}
