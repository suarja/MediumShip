import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    // Canonical stable identifier from the Clerk JWT (identity.tokenIdentifier),
    // formatted as `${issuer}|${clerkId}`. Derived server-side, never accepted
    // as a function argument.
    tokenIdentifier: v.string(),
    // Raw Clerk user id (identity.subject / webhook `data.id`). The webhook only
    // carries this, so it is the join key shared by both write paths.
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    lastSeenAt: v.optional(v.string()),
    // Set by the Clerk user.deleted webhook (soft delete).
    deletedAt: v.optional(v.number()),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_clerkId", ["clerkId"]),
  tenants: defineTable({
    slug: v.string(),
    name: v.string(),
    themeConfig: v.optional(
      v.object({
        paletteName: v.string(),
      }),
    ),
    theme: v.optional(
      v.object({
        primary: v.string(),
        accent: v.string(),
        background: v.string(),
        foreground: v.string(),
      }),
    ),
    enabledModules: v.array(v.string()),
  }).index("by_slug", ["slug"]),
  contents: defineTable({
    tenantSlug: v.string(),
    kind: v.union(
      v.literal("article"),
      v.literal("episode"),
      v.literal("video"),
    ),
    title: v.string(),
    summary: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    isPremium: v.boolean(),
    heroImageUrl: v.optional(v.string()),
    publishedAt: v.string(),
    articleBody: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    videoSource: v.optional(
      v.object({
        provider: v.union(v.literal("youtube"), v.literal("hosted")),
        playbackId: v.string(),
      }),
    ),
  })
    .index("by_tenant", ["tenantSlug"])
    .index("by_tenant_kind", ["tenantSlug", "kind"]),
});
