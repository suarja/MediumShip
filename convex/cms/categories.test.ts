/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

const ADMIN = { subject: "admin_1", tokenIdentifier: "token_admin" };

async function seedAdmin(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      tokenIdentifier: ADMIN.tokenIdentifier,
      clerkId: ADMIN.subject,
      email: "admin@test.com",
      cmsRole: "admin",
    });
  });
}

describe("cms categories", () => {
  it("creates and updates a category with a predefined icon", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    const asAdmin = t.withIdentity(ADMIN);

    const id = await asAdmin.mutation(api.cms.categories.createCategory, {
      label: "Analyses",
      slug: "analyses",
      iconKey: "analyses",
    });

    await asAdmin.mutation(api.cms.categories.updateCategory, {
      id,
      label: "Analyses éditoriales",
      slug: "analyses-editoriales",
      iconKey: "analyses",
      sortOrder: 2,
    });

    const rows = await asAdmin.query(api.cms.categories.listCmsCategories, {});
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      label: "Analyses éditoriales",
      slug: "analyses-editoriales",
      iconKey: "analyses",
      sortOrder: 2,
    });
  });

  it("blocks delete when published content still uses the category", async () => {
    const t = convexTest(schema, modules);
    await seedAdmin(t);

    const categoryId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("categories", {
        tenantSlug: "demo-media",
        label: "Podcasts",
        slug: "podcasts",
        iconKey: "podcasts",
        sortOrder: 0,
        updatedAt: Date.now(),
      });
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "episode",
        status: "published",
        slug: "episode-1",
        title: "Episode 1",
        summary: "Summary",
        category: "Podcasts",
        tags: [],
        isPremium: false,
      });
      return id;
    });

    const asAdmin = t.withIdentity(ADMIN);

    await expect(
      asAdmin.mutation(api.cms.categories.deleteCategory, { id: categoryId }),
    ).rejects.toThrow("Category is still used by published content");
  });
});
