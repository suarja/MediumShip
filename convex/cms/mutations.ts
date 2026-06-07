import { v } from "convex/values";

import { mutation, type MutationCtx } from "../_generated/server";
import { defaultTenant } from "../../src/features/tenant/default-tenant";
import {
  assertNavTabCap,
  deriveEnabledModules,
  normalizeFeatureConfigs,
  normalizeNavOrder,
  type TenantFeatureConfigInput,
} from "../featureCatalog";
import { normalizeFeedSections } from "../../src/features/tenant/public-config";
import {
  getYoutubeVideoId,
  normalizeRemoteImageUrl,
} from "../../src/features/content/selectors";
import { isThemePaletteName } from "../../src/features/theme/palette-catalog";
import {
  findCurrentCmsUser,
  hasCmsAdmin,
  requireCmsAdmin,
} from "./authz";

const contentKindValidator = v.union(
  v.literal("article"),
  v.literal("episode"),
  v.literal("video"),
);

const contentStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived"),
);

const videoSourceValidator = v.union(
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
  v.null(),
);

function buildSlug(kind: "article" | "episode" | "video") {
  return `new-${kind}-${Date.now().toString(36)}`;
}

function sanitizeText(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeHeroImageUrl(value: string | null) {
  const trimmed = sanitizeText(value);
  return trimmed ? normalizeRemoteImageUrl(trimmed) : undefined;
}

function normalizeBrandAssetUrl(value: string | null) {
  const trimmed = sanitizeText(value);
  return trimmed ? normalizeRemoteImageUrl(trimmed) : undefined;
}

function normalizeAudioUrl(value: string | null) {
  const trimmed = sanitizeText(value);
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname === "example.com") {
      return undefined;
    }

    if (parsed.hostname === "anchor.fm") {
      const anchorSegments = parsed.pathname.split("/").filter(Boolean);
      const encodedOriginUrl = anchorSegments.at(-1);

      if (encodedOriginUrl?.startsWith("https%3A") || encodedOriginUrl?.startsWith("http%3A")) {
        return normalizeAudioUrl(decodeURIComponent(encodedOriginUrl));
      }
    }

    if (parsed.protocol === "http:") {
      parsed.protocol = "https:";
    }

    return parsed.toString();
  } catch {
    return trimmed;
  }
}

function normalizeVideoSource(
  source:
    | {
        kind: "youtube";
        youtubeVideoId: string;
        youtubeUrl: string;
      }
    | {
        kind: "hosted";
        uploadKey: string;
        playbackUrl: string;
      }
    | null,
) {
  if (!source) {
    return undefined;
  }

  if (source.kind === "youtube") {
    const youtubeUrl = source.youtubeUrl.trim();
    const youtubeVideoId =
      getYoutubeVideoId({
        youtubeUrl,
        youtubeVideoId: source.youtubeVideoId,
      }) ?? source.youtubeVideoId.trim();

    return youtubeUrl && youtubeVideoId
      ? {
          kind: "youtube" as const,
          youtubeVideoId,
          youtubeUrl,
        }
      : undefined;
  }

  const uploadKey = source.uploadKey.trim();
  const playbackUrl = source.playbackUrl.trim();

  return uploadKey && playbackUrl
    ? {
        kind: "hosted" as const,
        uploadKey,
        playbackUrl,
      }
    : undefined;
}

function buildContentRecord(args: {
  tenantSlug: string;
  kind: "article" | "episode" | "video";
  status: "draft" | "published" | "archived";
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  heroImageUrl?: string;
  publishedAt?: string;
  readingTimeMinutes?: number;
  articleBody?: string;
  audioUrl?: string;
  durationSeconds?: number;
  videoSource?:
    | {
        kind: "youtube";
        youtubeVideoId: string;
        youtubeUrl: string;
      }
    | {
        kind: "hosted";
        uploadKey: string;
        playbackUrl: string;
      };
}) {
  const base = {
    tenantSlug: args.tenantSlug,
    kind: args.kind,
    status: args.status,
    slug: args.slug,
    title: args.title,
    summary: args.summary,
    category: args.category,
    tags: args.tags,
    isPremium: args.isPremium,
  };

  return {
    ...base,
    ...(args.heroImageUrl ? { heroImageUrl: args.heroImageUrl } : {}),
    ...(args.publishedAt ? { publishedAt: args.publishedAt } : {}),
    ...(args.kind === "article" && args.articleBody
      ? { articleBody: args.articleBody }
      : {}),
    ...(args.kind === "article" && args.readingTimeMinutes !== undefined
      ? { readingTimeMinutes: args.readingTimeMinutes }
      : {}),
    ...(args.kind === "episode" && args.audioUrl ? { audioUrl: args.audioUrl } : {}),
    ...(args.kind === "episode" && args.durationSeconds !== undefined
      ? { durationSeconds: args.durationSeconds }
      : {}),
    ...(args.kind === "video" && args.durationSeconds !== undefined
      ? { durationSeconds: args.durationSeconds }
      : {}),
    ...(args.kind === "video" && args.videoSource
      ? { videoSource: args.videoSource }
      : {}),
  };
}

async function ensureUniqueSlug(
  ctx: MutationCtx,
  tenantSlug: string,
  slug: string,
  existingId?: string,
) {
  const existing = await ctx.db
    .query("contents")
    .withIndex("by_tenantSlug_and_slug", (q) =>
      q.eq("tenantSlug", tenantSlug).eq("slug", slug),
    )
    .unique();

  if (existing && existing._id !== existingId) {
    throw new Error("Slug already exists for this tenant");
  }
}

export const bootstrapAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const { identity, user } = await findCurrentCmsUser(ctx);
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const adminExists = await hasCmsAdmin(ctx);
    if (adminExists && user?.cmsRole !== "admin") {
      throw new Error("Forbidden");
    }

    const fields = {
      tokenIdentifier: identity.tokenIdentifier,
      clerkId: identity.subject,
      email: identity.email,
      name: identity.name,
      cmsRole: "admin" as const,
      lastSeenAt: new Date().toISOString(),
    };

    if (user) {
      await ctx.db.patch(user._id, fields);
      return user._id;
    }

    return await ctx.db.insert("users", fields);
  },
});

export const createContent = mutation({
  args: { kind: contentKindValidator },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const slug = buildSlug(args.kind);
    await ensureUniqueSlug(ctx, defaultTenant.slug, slug);

    return await ctx.db.insert(
      "contents",
      buildContentRecord({
        tenantSlug: defaultTenant.slug,
        kind: args.kind,
        status: "draft",
        slug,
        title:
          args.kind === "article"
            ? "New article"
            : args.kind === "episode"
              ? "New episode"
              : "New video",
        summary: "Add a summary for the public feed and detail screen.",
        category:
          args.kind === "article"
            ? "Analysis"
            : args.kind === "episode"
              ? "Podcast"
              : "Video",
        tags: [],
        isPremium: false,
        articleBody:
          args.kind === "article"
            ? "Write the first draft here."
            : undefined,
        audioUrl: undefined,
        durationSeconds:
          args.kind === "episode" || args.kind === "video" ? 1800 : undefined,
        videoSource:
          args.kind === "video"
            ? {
                kind: "youtube",
                youtubeVideoId: "draftvideo01",
                youtubeUrl: "https://www.youtube.com/watch?v=draftvideo01",
              }
            : undefined,
      }),
    );
  },
});

export const updateContent = mutation({
  args: {
    id: v.id("contents"),
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    isPremium: v.boolean(),
    heroImageUrl: v.union(v.string(), v.null()),
    readingTimeMinutes: v.union(v.number(), v.null()),
    articleBody: v.union(v.string(), v.null()),
    audioUrl: v.union(v.string(), v.null()),
    durationSeconds: v.union(v.number(), v.null()),
    videoSource: videoSourceValidator,
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Content not found");
    }

    const slug = args.slug.trim();
    const title = args.title.trim();
    if (!slug || !title) {
      throw new Error("Title and slug are required");
    }

    await ensureUniqueSlug(ctx, existing.tenantSlug, slug, existing._id);

    const nextRecord = buildContentRecord({
      tenantSlug: existing.tenantSlug,
      kind: existing.kind,
      status: existing.status,
      slug,
      title,
      summary: args.summary.trim(),
      category: args.category.trim(),
      tags: args.tags
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      isPremium: args.isPremium,
      heroImageUrl: normalizeHeroImageUrl(args.heroImageUrl),
      publishedAt: existing.publishedAt,
      readingTimeMinutes:
        existing.kind === "article" && args.readingTimeMinutes !== null
          ? args.readingTimeMinutes
          : undefined,
      articleBody:
        existing.kind === "article"
          ? sanitizeText(args.articleBody)
          : undefined,
      audioUrl:
        existing.kind === "episode" ? normalizeAudioUrl(args.audioUrl) : undefined,
      durationSeconds:
        (existing.kind === "episode" || existing.kind === "video") &&
        args.durationSeconds !== null
          ? args.durationSeconds
          : undefined,
      videoSource:
        existing.kind === "video"
          ? normalizeVideoSource(args.videoSource)
          : undefined,
    });

    await ctx.db.replace(existing._id, nextRecord);
    return existing._id;
  },
});

export const setContentStatus = mutation({
  args: {
    id: v.id("contents"),
    status: contentStatusValidator,
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Content not found");
    }

    const nextPublishedAt =
      args.status === "published"
        ? existing.publishedAt ?? new Date().toISOString()
        : args.status === "draft"
          ? undefined
          : existing.publishedAt;

    await ctx.db.replace(
      existing._id,
      buildContentRecord({
        tenantSlug: existing.tenantSlug,
        kind: existing.kind,
        status: args.status,
        slug: existing.slug,
        title: existing.title,
        summary: existing.summary,
        category: existing.category,
        tags: existing.tags,
        isPremium: existing.isPremium,
        heroImageUrl: existing.heroImageUrl,
        publishedAt: nextPublishedAt,
        readingTimeMinutes: existing.readingTimeMinutes,
        articleBody: existing.articleBody,
        audioUrl: existing.audioUrl,
        durationSeconds: existing.durationSeconds,
        videoSource: existing.videoSource,
      }),
    );

    return args.id;
  },
});

const featureConfigInputValidator = v.record(
  v.string(),
  v.object({
    enabled: v.optional(v.boolean()),
    access: v.optional(
      v.union(v.literal("free"), v.literal("member"), v.literal("premium")),
    ),
    iconKey: v.optional(v.string()),
  }),
);

const feedSectionValidator = v.object({
  kind: contentKindValidator,
  title: v.string(),
  visible: v.optional(v.boolean()),
});

async function getOrCreateTenant(ctx: MutationCtx) {
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_slug", (q) => q.eq("slug", defaultTenant.slug))
    .unique();

  if (tenant) {
    return tenant;
  }

  const featureConfigs = normalizeFeatureConfigs(
    undefined,
    defaultTenant.enabledModules,
  );
  const enabledModules = deriveEnabledModules(featureConfigs);
  const feedSections = normalizeFeedSections(
    defaultTenant.feedSections,
    enabledModules,
  );

  const tenantId = await ctx.db.insert("tenants", {
    slug: defaultTenant.slug,
    name: defaultTenant.name,
    themeConfig: defaultTenant.themeConfig,
    enabledModules,
    featureConfigs,
    feedSections,
  });

  const created = await ctx.db.get(tenantId);
  if (!created) {
    throw new Error("Failed to create tenant");
  }

  return created;
}

export const updateTenantSettings = mutation({
  args: {
    name: v.string(),
    brandLogoUrl: v.string(),
    appIconUrl: v.string(),
    paletteName: v.string(),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    if (!isThemePaletteName(args.paletteName)) {
      throw new Error(`Unknown palette: ${args.paletteName}`);
    }

    const name = args.name.trim() || defaultTenant.name;
    const brandLogoUrl = normalizeBrandAssetUrl(args.brandLogoUrl);
    const appIconUrl = normalizeBrandAssetUrl(args.appIconUrl);
    const tenant = await getOrCreateTenant(ctx);

    await ctx.db.patch(tenant._id, {
      name,
      brandLogoUrl,
      appIconUrl,
      themeConfig: { paletteName: args.paletteName },
    });
    return tenant._id;
  },
});

export const updateModuleSettings = mutation({
  args: {
    featureConfigs: featureConfigInputValidator,
    feedSections: v.array(feedSectionValidator),
    navOrder: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const tenant = await getOrCreateTenant(ctx);
    const featureConfigs = normalizeFeatureConfigs(
      args.featureConfigs as Record<string, TenantFeatureConfigInput>,
      tenant.enabledModules,
    );
    assertNavTabCap(featureConfigs);
    const navOrder = normalizeNavOrder(args.navOrder ?? tenant.navOrder);
    const enabledModules = deriveEnabledModules(featureConfigs);
    const feedSections = normalizeFeedSections(args.feedSections, enabledModules);

    await ctx.db.patch(tenant._id, {
      featureConfigs,
      enabledModules,
      feedSections,
      navOrder,
    });
    return tenant._id;
  },
});
