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
    discoverySeedCategories: v.optional(v.array(v.string())),
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
    source: v.optional(
      v.union(v.literal("cms"), v.literal("wikipedia")),
    ),
    externalId: v.optional(v.string()),
    canonicalUrl: v.optional(v.string()),
  })
    .index("by_tenant_and_status", ["tenantSlug", "status"])
    .index("by_tenant_source_external", [
      "tenantSlug",
      "source",
      "externalId",
    ])
    .index("by_tenant_and_status_and_category", ["tenantSlug", "status", "category"])
    .index("by_tenant_and_kind", ["tenantSlug", "kind"])
    .index("by_tenantSlug", ["tenantSlug"])
    .index("by_tenantSlug_and_slug", ["tenantSlug", "slug"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["tenantSlug", "status"],
    }),
  // Single source of truth for the member ("Pro") entitlement. Provider-agnostic
  // on purpose: today only the manual admin grant writes it, but later a
  // RevenueCat / Stripe webhook will upsert the SAME row (matching on
  // tokenIdentifier / clerkId) with a different `source`. The read path
  // (getMyEntitlement / requireMember) must not change when that happens.
  entitlements: defineTable({
    // Canonical stable identifier from the Clerk JWT, mirrored from `users`.
    // The read path matches the signed-in identity on this first.
    tokenIdentifier: v.string(),
    // Raw Clerk user id — the join key a webhook can resolve without a JWT.
    clerkId: v.string(),
    isPro: v.boolean(),
    source: v.union(
      v.literal("manual"),
      v.literal("revenuecat"),
      v.literal("stripe"),
    ),
    // For manual grants: the `users._id` of the admin who toggled it.
    grantedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_clerkId", ["clerkId"]),
  collections: defineTable({
    tenantSlug: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    coverImageUrl: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_tenant_and_status", ["tenantSlug", "status"])
    .index("by_tenantSlug_and_slug", ["tenantSlug", "slug"]),
  categories: defineTable({
    tenantSlug: v.string(),
    label: v.string(),
    slug: v.string(),
    iconKey: v.string(),
    sortOrder: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenantSlug", ["tenantSlug"])
    .index("by_tenantSlug_and_slug", ["tenantSlug", "slug"]),
  collectionItems: defineTable({
    tenantSlug: v.string(),
    collectionId: v.id("collections"),
    contentId: v.id("contents"),
    order: v.number(),
  }).index("by_collection_and_order", ["collectionId", "order"]),
  events: defineTable({
    tenantSlug: v.string(),
    status: v.union(v.literal("scheduled"), v.literal("archived")),
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    startsAt: v.string(),
    locationLabel: v.string(),
    mode: v.union(
      v.literal("online"),
      v.literal("offline"),
      v.literal("hybrid"),
    ),
    access: v.union(
      v.literal("free"),
      v.literal("member"),
      v.literal("premium"),
    ),
    coverImageUrl: v.optional(v.string()),
    ctaLabel: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    communityUrl: v.optional(v.string()),
    descriptionLong: v.optional(v.string()),
  })
    .index("by_tenant_and_status", ["tenantSlug", "status"])
    .index("by_tenant_and_startsAt", ["tenantSlug", "startsAt"]),
  bookmarks: defineTable({
    tokenIdentifier: v.string(),
    contentId: v.id("contents"),
    createdAt: v.number(),
  })
    .index("by_tokenIdentifier_and_contentId", ["tokenIdentifier", "contentId"])
    .index("by_tokenIdentifier_and_createdAt", ["tokenIdentifier", "createdAt"]),
  playbackProgress: defineTable({
    tokenIdentifier: v.string(),
    contentId: v.id("contents"),
    seconds: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier_and_contentId", ["tokenIdentifier", "contentId"])
    .index("by_tokenIdentifier_and_updatedAt", ["tokenIdentifier", "updatedAt"]),
  personalLists: defineTable({
    tokenIdentifier: v.string(),
    title: v.string(),
    visibility: v.literal("private"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_tokenIdentifier_and_updatedAt", [
      "tokenIdentifier",
      "updatedAt",
    ]),
  personalListItems: defineTable({
    listId: v.id("personalLists"),
    contentId: v.id("contents"),
    position: v.number(),
    addedAt: v.number(),
  })
    .index("by_listId_and_position", ["listId", "position"])
    .index("by_listId_and_contentId", ["listId", "contentId"]),
  contentInteractions: defineTable({
    tokenIdentifier: v.string(),
    tenantSlug: v.string(),
    contentId: v.id("contents"),
    type: v.union(
      v.literal("view"),
      v.literal("open"),
      v.literal("skip"),
      v.literal("like"),
      v.literal("finish"),
      v.literal("share"),
      v.literal("hide"),
    ),
    createdAt: v.number(),
  })
    .index("by_tokenIdentifier_and_contentId", ["tokenIdentifier", "contentId"])
    .index("by_tokenIdentifier_and_type", ["tokenIdentifier", "type"])
    .index("by_contentId", ["contentId"]),
  userPreferences: defineTable({
    tokenIdentifier: v.string(),
    tenantSlug: v.string(),
    targetType: v.union(
      v.literal("category"),
      v.literal("tag"),
      v.literal("contentType"),
    ),
    targetId: v.string(),
    score: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tokenIdentifier_and_target", [
      "tokenIdentifier",
      "targetType",
      "targetId",
    ])
    .index("by_tokenIdentifier", ["tokenIdentifier"]),
  ingestionThrottle: defineTable({
    tenantSlug: v.string(),
    categoryKey: v.string(),
    lastRequestedAt: v.number(),
  }).index("by_tenant_and_category", ["tenantSlug", "categoryKey"]),
});
