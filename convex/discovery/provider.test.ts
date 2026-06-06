import { describe, expect, it } from "vitest";

import type { Doc } from "../_generated/dataModel";
import { cmsProvider, PROVIDERS, type ContentProvider, type ProviderContext } from "./provider";

type ContentDoc = Doc<"contents">;

function makeContent(id: string, overrides: Partial<ContentDoc> = {}): ContentDoc {
  return {
    _id: id as ContentDoc["_id"],
    _creationTime: 0,
    tenantSlug: "demo-media",
    kind: "article",
    status: "published",
    slug: `slug-${id}`,
    title: `Title ${id}`,
    summary: "Summary",
    category: "Analyse",
    tags: [],
    isPremium: false,
    ...overrides,
  };
}

function makeCtx(contents: ContentDoc[]): ProviderContext {
  return {
    db: {
      query: () => ({
        withIndex: () => ({
          collect: async () => contents,
        }),
      }),
    },
  };
}

describe("cmsProvider", () => {
  it("declares cms as its source", () => {
    expect(cmsProvider.source).toBe("cms");
  });

  it("sync is identity over contents without duplication or mutation", async () => {
    const original = [
      makeContent("content-1"),
      makeContent("content-2", { isPremium: true }),
    ];
    const snapshot = structuredClone(original);
    const ctx = makeCtx(original);

    const synced = await cmsProvider.sync(ctx, { tenantSlug: "demo-media" });

    expect(synced).toEqual(original);
    expect(ctx.db.query("contents")).toBeTruthy();
    expect(original).toEqual(snapshot);
  });
});

describe("PROVIDERS registry", () => {
  it("contains cmsProvider", () => {
    expect(PROVIDERS).toContain(cmsProvider);
  });

  it("iterates any adapter registered in the same registry shape", async () => {
    const fakeProvider: ContentProvider = {
      source: "fake",
      sync: async () => [],
    };

    const registry: ContentProvider[] = [...PROVIDERS, fakeProvider];
    const seen: string[] = [];

    for (const provider of registry) {
      seen.push(provider.source);
      await provider.sync(makeCtx([]), { tenantSlug: "demo-media" });
    }

    expect(seen).toEqual(["cms", "fake"]);
  });
});
