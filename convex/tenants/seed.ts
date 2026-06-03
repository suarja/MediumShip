import { mutation } from "../_generated/server";
import { defaultTenant } from "../../src/features/tenant/default-tenant";

const demoContents = [
  {
    tenantSlug: defaultTenant.slug,
    status: "published" as const,
    slug: "economie-du-soin",
    kind: "article" as const,
    title: "L'economie du soin",
    summary: "Une analyse sur la priorite du soin.",
    category: "Analyse",
    tags: ["analyse", "politique"],
    isPremium: false,
    publishedAt: "2026-06-03T08:00:00.000Z",
    readingTimeMinutes: 18,
    articleBody:
      "Pendant des decennies, l'economie a mesure ce qui se vendait. Le soin, lui, restait invisible. Cet article propose de remettre le soin au centre de la valeur produite.",
  },
  {
    tenantSlug: defaultTenant.slug,
    status: "published" as const,
    slug: "lea-bardin-entretien",
    kind: "episode" as const,
    title: "Avec Lea Bardin",
    summary: "Entretien long format sur le travail invisible.",
    category: "Podcast",
    tags: ["podcast"],
    isPremium: true,
    publishedAt: "2026-06-03T09:00:00.000Z",
    durationSeconds: 3240,
    audioUrl: "https://example.com/audio/lea-bardin.mp3",
  },
  {
    tenantSlug: defaultTenant.slug,
    status: "published" as const,
    slug: "democratie-locale",
    kind: "video" as const,
    title: "Democratie locale, ou en sommes-nous ?",
    summary: "Debat video long format.",
    category: "Debat",
    tags: ["video", "youtube"],
    isPremium: false,
    publishedAt: "2026-06-03T10:00:00.000Z",
    durationSeconds: 3862,
    videoSource: {
      kind: "youtube" as const,
      youtubeVideoId: "abc123xyz00",
      youtubeUrl: "https://www.youtube.com/watch?v=abc123xyz00",
    },
  },
];

export const seedDemoContent = mutation({
  args: {},
  handler: async (ctx) => {
    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", defaultTenant.slug))
      .unique();

    if (!existingTenant) {
      await ctx.db.insert("tenants", {
        slug: defaultTenant.slug,
        name: defaultTenant.name,
        themeConfig: defaultTenant.themeConfig,
        enabledModules: defaultTenant.enabledModules,
        feedSections: defaultTenant.feedSections,
      });
    } else if (!existingTenant.feedSections) {
      await ctx.db.patch(existingTenant._id, {
        feedSections: defaultTenant.feedSections,
      });
    }

    // Seed demo content once: skip if anything is already published for the
    // tenant so repeated runs stay idempotent.
    const existingContent = await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", defaultTenant.slug).eq("status", "published"),
      )
      .first();

    if (!existingContent) {
      for (const content of demoContents) {
        await ctx.db.insert("contents", content);
      }
    }
  },
});
