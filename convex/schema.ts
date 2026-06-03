import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tenants: defineTable({
    slug: v.string(),
    name: v.string(),
    theme: v.object({
      primary: v.string(),
      accent: v.string(),
      background: v.string(),
      foreground: v.string(),
    }),
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
