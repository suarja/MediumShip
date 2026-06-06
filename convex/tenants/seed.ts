import { mutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
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
    title: "West Texas Boom Report",
    summary: "Reportage radio sur le boom pétrolier au Texas.",
    category: "Podcast",
    tags: ["podcast"],
    isPremium: true,
    publishedAt: "2026-06-03T09:00:00.000Z",
    durationSeconds: 3240,
    audioUrl:
      "https://stateimpact.npr.org/texas/files/2012/01/MIDLAND-FEATURE-MP3-3.mp3",
  },
  {
    tenantSlug: defaultTenant.slug,
    status: "published" as const,
    slug: "monde-dapres-episode-2",
    kind: "episode" as const,
    title: "Valencia Tuition Report",
    summary: "Reportage radio sur la hausse des frais de scolarité en Floride.",
    category: "Podcast",
    tags: ["podcast", "education"],
    isPremium: false,
    publishedAt: "2026-06-03T09:30:00.000Z",
    durationSeconds: 3120,
    audioUrl:
      "https://stateimpact.npr.org/florida/files/2012/07/ValenciaTuition.mp3",
  },
  {
    tenantSlug: defaultTenant.slug,
    status: "published" as const,
    slug: "monde-dapres-episode-3",
    kind: "episode" as const,
    title: "Oklahoma Cannabis Report",
    summary: "Reportage radio sur l'économie du cannabis en Oklahoma.",
    category: "Podcast",
    tags: ["podcast", "economy"],
    isPremium: false,
    publishedAt: "2026-06-03T09:45:00.000Z",
    durationSeconds: 2980,
    audioUrl:
      "https://stateimpact.npr.org/oklahoma/files/2022/04/Clip_1.mp3",
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

const demoCollections = [
  {
    slug: "le-grand-entretien",
    title: "Le grand entretien",
    summary: "La série phare d'entretiens longs avec des personnalités marquantes.",
    itemSlugs: ["lea-bardin-entretien", "economie-du-soin", "democratie-locale"],
  },
  {
    slug: "programme-2027",
    title: "Programme 2027",
    summary: "Des contenus qui préparent le cycle électoral. Mis à jour régulièrement.",
    itemSlugs: ["economie-du-soin", "monde-dapres-episode-2"],
  },
  {
    slug: "economie-autrement",
    title: "L'économie autrement",
    summary: "Une série de vidéos et articles qui déconstruisent les idées reçues sur l'économie.",
    itemSlugs: ["democratie-locale", "monde-dapres-episode-3"],
  },
];

const demoEvents = [
  {
    slug: "assemblee-ouverte-paris",
    title: "Assemblée ouverte · Paris",
    summary: "Une soirée de débat ouverte à tous les membres de la communauté.",
    startsAt: "2026-09-24T19:00:00",
    locationLabel: "La Bellevilloise, Paris · 180 inscrits",
    mode: "offline" as const,
    access: "free" as const,
    ctaLabel: "S'inscrire",
    descriptionLong:
      "Une rencontre mensuelle pour échanger sur les enjeux éditoriaux de la semaine. Ouvert à tous, sans inscription obligatoire.",
  },
  {
    slug: "atelier-programme-2027",
    title: "Atelier programme 2027",
    summary: "Atelier participatif en visioconférence pour les membres.",
    startsAt: "2026-10-02T20:00:00",
    locationLabel: "En visio · gratuit",
    mode: "online" as const,
    access: "member" as const,
    ctaLabel: "Rejoindre le call",
    communityUrl: "https://discord.gg/example",
    descriptionLong:
      "Un atelier en ligne réservé aux membres pour travailler collectivement sur les propositions éditoriales autour de 2027.",
  },
  {
    slug: "debat-live-economie",
    title: "Débat live — économie du soin",
    summary: "Débat en direct sur YouTube, ouvert à tous.",
    startsAt: "2026-10-11T21:00:00",
    locationLabel: "YouTube live · ouvert à tous",
    mode: "online" as const,
    access: "free" as const,
    ctaLabel: "Regarder en direct",
    ctaUrl: "https://youtube.com/watch?v=example",
    descriptionLong:
      "Un grand débat live entre économistes et citoyens autour de la crise du care et des politiques sociales.",
  },
  {
    slug: "cercle-local-lyon",
    title: "Cercle local · Lyon",
    summary: "Rencontre locale des membres lyonnais au café associatif.",
    startsAt: "2026-10-18T19:30:00",
    locationLabel: "Café associatif, Lyon · 24 inscrits",
    mode: "offline" as const,
    access: "free" as const,
    descriptionLong:
      "Les membres de Lyon se retrouvent pour échanger autour d'un verre et préparer les prochains événements locaux.",
  },
];

const transitionalEpisodeSlugs = [
  "west-texas-boom-report",
  "valencia-tuition-report",
  "oklahoma-cannabis-report",
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
        discoverySeedCategories: ["Science", "Philosophy"],
      });
    } else {
      // Seed = restore the demo tenant to a known state, including the full
      // default module set (content + premium + navigation). Module gating is a
      // strict allowlist now, so a stale content-only row would otherwise hide
      // collections/agenda/community. CMS edits after seeding take over.
      await ctx.db.patch(existingTenant._id, {
        enabledModules: defaultTenant.enabledModules,
        feedSections: existingTenant.feedSections ?? defaultTenant.feedSections,
        discoverySeedCategories: ["Science", "Philosophy"],
      });
    }

    for (const slug of transitionalEpisodeSlugs) {
      const transitionalContent = await ctx.db
        .query("contents")
        .withIndex("by_tenantSlug_and_slug", (q) =>
          q.eq("tenantSlug", defaultTenant.slug).eq("slug", slug),
        )
        .unique();

      if (transitionalContent?.status === "published") {
        await ctx.db.patch(transitionalContent._id, {
          status: "archived",
        });
      }
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
      } else if (content.kind === "episode") {
        await ctx.db.patch(existingContent._id, {
          status: content.status,
          title: content.title,
          summary: content.summary,
          category: content.category,
          tags: content.tags,
          isPremium: content.isPremium,
          publishedAt: content.publishedAt,
          durationSeconds: content.durationSeconds,
          audioUrl: content.audioUrl,
        });
      }
    }

    const demoCategories = [
      { label: "Actualités", slug: "actualites", iconKey: "news", sortOrder: 0 },
      { label: "Analyses", slug: "analyses", iconKey: "analyses", sortOrder: 1 },
      { label: "Podcasts", slug: "podcasts", iconKey: "podcasts", sortOrder: 2 },
      { label: "Agenda", slug: "agenda", iconKey: "agenda", sortOrder: 3 },
      { label: "Bibliothèque", slug: "bibliotheque", iconKey: "library", sortOrder: 4 },
      { label: "Économie", slug: "economie", iconKey: "economy", sortOrder: 5 },
      { label: "Culture", slug: "culture", iconKey: "culture", sortOrder: 6 },
    ] as const;

    for (const category of demoCategories) {
      const existingCategory = await ctx.db
        .query("categories")
        .withIndex("by_tenantSlug_and_slug", (q) =>
          q.eq("tenantSlug", defaultTenant.slug).eq("slug", category.slug),
        )
        .unique();

      if (!existingCategory) {
        await ctx.db.insert("categories", {
          tenantSlug: defaultTenant.slug,
          label: category.label,
          slug: category.slug,
          iconKey: category.iconKey,
          sortOrder: category.sortOrder,
          updatedAt: Date.now(),
        });
      }
    }

    // Seed demo collections + items
    for (const coll of demoCollections) {
      const existingColl = await ctx.db
        .query("collections")
        .withIndex("by_tenantSlug_and_slug", (q) =>
          q.eq("tenantSlug", defaultTenant.slug).eq("slug", coll.slug),
        )
        .unique();

      let collId: Id<"collections">;
      if (!existingColl) {
        collId = await ctx.db.insert("collections", {
          tenantSlug: defaultTenant.slug,
          status: "published",
          slug: coll.slug,
          title: coll.title,
          summary: coll.summary,
          updatedAt: Date.now(),
        });
      } else {
        collId = existingColl._id;
      }

      // Upsert items in order — clear then re-insert for idempotency
      const existingItems = await ctx.db
        .query("collectionItems")
        .withIndex("by_collection_and_order", (q) => q.eq("collectionId", collId))
        .collect();
      for (const item of existingItems) {
        await ctx.db.delete(item._id);
      }

      let order = 1;
      for (const contentSlug of coll.itemSlugs) {
        const content = await ctx.db
          .query("contents")
          .withIndex("by_tenantSlug_and_slug", (q) =>
            q.eq("tenantSlug", defaultTenant.slug).eq("slug", contentSlug),
          )
          .unique();
        if (content) {
          await ctx.db.insert("collectionItems", {
            tenantSlug: defaultTenant.slug,
            collectionId: collId,
            contentId: content._id,
            order: order++,
          });
        }
      }
    }

    // Seed demo events
    for (const evt of demoEvents) {
      const existingEvt = await ctx.db
        .query("events")
        .withIndex("by_tenant_and_status", (q) =>
          q.eq("tenantSlug", defaultTenant.slug).eq("status", "scheduled"),
        )
        .collect()
        .then((rows) => rows.find((r) => r.slug === evt.slug));

      if (!existingEvt) {
        await ctx.db.insert("events", {
          tenantSlug: defaultTenant.slug,
          status: "scheduled",
          ...evt,
        });
      }
    }
  },
});
