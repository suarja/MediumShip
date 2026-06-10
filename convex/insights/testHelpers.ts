import type { convexTest } from "convex-test";

import type { Id } from "../_generated/dataModel";

export const TENANT = "demo-media";
export const MEMBER = { subject: "member_1", tokenIdentifier: "token_member" };
export const OTHER_MEMBER = { subject: "member_2", tokenIdentifier: "token_other" };
export const FREE_USER = { subject: "user_free", tokenIdentifier: "token_free" };

export async function seedTenant(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("tenants", {
      slug: TENANT,
      name: "Demo Media",
      enabledModules: ["articles", "episodes", "videos", "premium", "discover"],
    });
  });
}

export async function seedPremiumMember(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("entitlements", {
      tokenIdentifier: MEMBER.tokenIdentifier,
      clerkId: MEMBER.subject,
      isPro: true,
      source: "manual",
      updatedAt: Date.now(),
    });
  });
}

export async function insertPublishedContent(
  t: ReturnType<typeof convexTest>,
  args: {
    title: string;
    publishedAt?: string;
    category?: string;
    tags?: string[];
    kind?: "article" | "episode" | "video";
    isPremium?: boolean;
  },
): Promise<Id<"contents">> {
  return t.run(async (ctx) =>
    ctx.db.insert("contents", {
      tenantSlug: TENANT,
      kind: args.kind ?? "article",
      status: "published",
      slug: args.title.toLowerCase().replace(/\s+/g, "-"),
      title: args.title,
      summary: "Summary",
      category: args.category ?? "Politique",
      tags: args.tags ?? [],
      isPremium: args.isPremium ?? false,
      publishedAt: args.publishedAt ?? "2026-06-06T12:00:00.000Z",
    }),
  );
}
