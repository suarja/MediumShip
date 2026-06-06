import { v } from "convex/values";

import { mutation, query, type MutationCtx } from "../_generated/server";
import { defaultTenant } from "../../src/features/tenant/default-tenant";
import { normalizeRemoteImageUrl } from "../../src/features/content/selectors";
import { requireCmsAdmin } from "./authz";

const eventStatusValidator = v.union(
  v.literal("scheduled"),
  v.literal("archived"),
);

const eventModeValidator = v.union(
  v.literal("online"),
  v.literal("offline"),
  v.literal("hybrid"),
);

const eventAccessValidator = v.union(
  v.literal("free"),
  v.literal("member"),
  v.literal("premium"),
);

const EVENT_STATUSES = ["scheduled", "archived"] as const;

function buildSlug() {
  return `event-${Date.now().toString(36)}`;
}

function sanitizeText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeCoverImageUrl(value: string | null | undefined) {
  const trimmed = sanitizeText(value);
  return trimmed ? normalizeRemoteImageUrl(trimmed) : undefined;
}

function parseStartsAt(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("startsAt is required");
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("startsAt must be a valid ISO date");
  }

  return trimmed;
}

async function ensureUniqueEventSlug(
  ctx: MutationCtx,
  tenantSlug: string,
  slug: string,
  existingId?: string,
) {
  const existing = await ctx.db
    .query("events")
    .withIndex("by_tenant_and_status", (q) =>
      q.eq("tenantSlug", tenantSlug).eq("status", "scheduled"),
    )
    .collect()
    .then((rows) => rows.find((row) => row.slug === slug));

  const archivedMatch = await ctx.db
    .query("events")
    .withIndex("by_tenant_and_status", (q) =>
      q.eq("tenantSlug", tenantSlug).eq("status", "archived"),
    )
    .collect()
    .then((rows) => rows.find((row) => row.slug === slug));

  const match = existing ?? archivedMatch;
  if (match && match._id !== existingId) {
    throw new Error("Slug already exists for this tenant");
  }
}

export const listCmsEvents = query({
  args: { tenantSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const tenantSlug = args.tenantSlug ?? defaultTenant.slug;
    const rows = await Promise.all(
      EVENT_STATUSES.map((status) =>
        ctx.db
          .query("events")
          .withIndex("by_tenant_and_status", (q) =>
            q.eq("tenantSlug", tenantSlug).eq("status", status),
          )
          .collect(),
      ),
    );

    return rows
      .flat()
      .sort((left, right) => right.startsAt.localeCompare(left.startsAt));
  },
});

export const getCmsEvent = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    startsAt: v.string(),
    locationLabel: v.string(),
    mode: eventModeValidator,
    access: eventAccessValidator,
    coverImageUrl: v.optional(v.union(v.string(), v.null())),
    ctaLabel: v.optional(v.union(v.string(), v.null())),
    ctaUrl: v.optional(v.union(v.string(), v.null())),
    communityUrl: v.optional(v.union(v.string(), v.null())),
    descriptionLong: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const slug = args.slug.trim() || buildSlug();
    await ensureUniqueEventSlug(ctx, defaultTenant.slug, slug);

    return await ctx.db.insert("events", {
      tenantSlug: defaultTenant.slug,
      status: "scheduled",
      slug,
      title: args.title.trim() || "Nouvel événement",
      summary: args.summary.trim(),
      startsAt: parseStartsAt(args.startsAt),
      locationLabel: args.locationLabel.trim() || "À définir",
      mode: args.mode,
      access: args.access,
      ...(normalizeCoverImageUrl(args.coverImageUrl ?? undefined)
        ? { coverImageUrl: normalizeCoverImageUrl(args.coverImageUrl ?? undefined) }
        : {}),
      ...(sanitizeText(args.ctaLabel) ? { ctaLabel: sanitizeText(args.ctaLabel) } : {}),
      ...(sanitizeText(args.ctaUrl) ? { ctaUrl: sanitizeText(args.ctaUrl) } : {}),
      ...(sanitizeText(args.communityUrl)
        ? { communityUrl: sanitizeText(args.communityUrl) }
        : {}),
      ...(sanitizeText(args.descriptionLong)
        ? { descriptionLong: sanitizeText(args.descriptionLong) }
        : {}),
    });
  },
});

export const updateEvent = mutation({
  args: {
    id: v.id("events"),
    slug: v.string(),
    title: v.string(),
    summary: v.string(),
    startsAt: v.string(),
    locationLabel: v.string(),
    mode: eventModeValidator,
    access: eventAccessValidator,
    coverImageUrl: v.union(v.string(), v.null()),
    ctaLabel: v.union(v.string(), v.null()),
    ctaUrl: v.union(v.string(), v.null()),
    communityUrl: v.union(v.string(), v.null()),
    descriptionLong: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Event not found");
    }

    const slug = args.slug.trim();
    const title = args.title.trim();
    if (!slug || !title) {
      throw new Error("Title and slug are required");
    }

    await ensureUniqueEventSlug(ctx, existing.tenantSlug, slug, existing._id);

    const coverImageUrl = normalizeCoverImageUrl(args.coverImageUrl);

    await ctx.db.replace(existing._id, {
      tenantSlug: existing.tenantSlug,
      status: existing.status,
      slug,
      title,
      summary: args.summary.trim(),
      startsAt: parseStartsAt(args.startsAt),
      locationLabel: args.locationLabel.trim(),
      mode: args.mode,
      access: args.access,
      ...(coverImageUrl ? { coverImageUrl } : {}),
      ...(sanitizeText(args.ctaLabel) ? { ctaLabel: sanitizeText(args.ctaLabel) } : {}),
      ...(sanitizeText(args.ctaUrl) ? { ctaUrl: sanitizeText(args.ctaUrl) } : {}),
      ...(sanitizeText(args.communityUrl)
        ? { communityUrl: sanitizeText(args.communityUrl) }
        : {}),
      ...(sanitizeText(args.descriptionLong)
        ? { descriptionLong: sanitizeText(args.descriptionLong) }
        : {}),
    });

    return existing._id;
  },
});

export const setEventStatus = mutation({
  args: {
    id: v.id("events"),
    status: eventStatusValidator,
  },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Event not found");
    }

    await ctx.db.patch(existing._id, { status: args.status });

    return args.id;
  },
});
