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
    cmsRole: v.optional(v.literal("admin")),
    // Set by the Clerk user.deleted webhook (soft delete).
    deletedAt: v.optional(v.number()),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_clerkId", ["clerkId"])
    .index("by_cmsRole", ["cmsRole"]),
  tenants: defineTable({
    slug: v.string(),
    name: v.string(),
    brandLogoUrl: v.optional(v.string()),
    appIconUrl: v.optional(v.string()),
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
    feedSections: v.optional(
      v.array(
        v.object({
          kind: v.union(
            v.literal("article"),
            v.literal("episode"),
            v.literal("video"),
          ),
          title: v.string(),
        }),
      ),
    ),
  }).index("by_slug", ["slug"]),
  contents: defineTable({
    tenantSlug: v.string(),
    kind: v.union(
      v.literal("article"),
      v.literal("episode"),
      v.literal("video"),
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    isPremium: v.boolean(),
    heroImageUrl: v.optional(v.string()),
    publishedAt: v.optional(v.string()),
    readingTimeMinutes: v.optional(v.number()),
    articleBody: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    videoSource: v.optional(
      v.union(
        v.object({
          kind: v.literal("youtube"),
          youtubeVideoId: v.string(),
          youtubeUrl: v.string(),
        }),
        v.object({
          kind: v.literal("hosted"),
          uploadKey: v.string(),
          playbackUrl: v.string(),
        }),
      ),
    ),
  })
    .index("by_tenant_and_status", ["tenantSlug", "status"])
    .index("by_tenant_and_kind", ["tenantSlug", "kind"])
    .index("by_tenantSlug", ["tenantSlug"])
    .index("by_tenantSlug_and_slug", ["tenantSlug", "slug"]),
});
