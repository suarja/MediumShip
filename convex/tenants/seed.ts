import { mutation } from "../_generated/server";
import { defaultTenant } from "../../src/features/tenant/default-tenant";

const demoEpisodeAudioUrl =
  "https://d3ctxlq1ktw2nl.cloudfront.net/staging/2020-11-30/141758914-44100-2-fc5d22f01b785193.mp3";

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
    audioUrl: demoEpisodeAudioUrl,
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
  {
    tenantSlug: defaultTenant.slug,
    status: "draft" as const,
    slug: "budget-des-villes-en-chantier",
    kind: "article" as const,
    title: "Budget des villes en chantier",
    summary: "Un brouillon pour tester l'edition avant publication.",
    category: "Brouillon",
    tags: ["draft", "cities"],
    isPremium: false,
    readingTimeMinutes: 12,
    articleBody:
      "Ce brouillon sert au premier slice CMS. Il ne doit pas apparaitre dans le feed public tant qu'il reste en draft.",
  },
  {
    tenantSlug: defaultTenant.slug,
    status: "archived" as const,
    slug: "archives-democratie-video",
    kind: "video" as const,
    title: "Archives de democratie locale",
    summary: "Une ancienne video retiree du flux public mais visible en CMS.",
    category: "Archive",
    tags: ["archive", "video"],
    isPremium: false,
    publishedAt: "2026-05-28T10:00:00.000Z",
    durationSeconds: 2540,
    videoSource: {
      kind: "youtube" as const,
      youtubeVideoId: "archvideo001",
      youtubeUrl: "https://www.youtube.com/watch?v=archvideo001",
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

    for (const content of demoContents) {
      const existingContent = await ctx.db
        .query("contents")
        .withIndex("by_tenantSlug_and_slug", (q) =>
          q.eq("tenantSlug", defaultTenant.slug).eq("slug", content.slug),
        )
        .unique();

      if (!existingContent) {
        await ctx.db.insert("contents", content);
      } else if (
        content.kind === "episode" &&
        (!existingContent.audioUrl ||
          existingContent.audioUrl.includes("example.com/audio/"))
      ) {
        await ctx.db.patch(existingContent._id, {
          audioUrl: demoEpisodeAudioUrl,
        });
      }
    }
  },
});
