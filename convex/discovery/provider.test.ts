import { describe, expect, it } from "vitest";

import {
  cmsProvider,
  PROVIDERS,
  type ContentProvider,
} from "./provider";

const noopCtx = {} as Parameters<ContentProvider["ingest"]>[0];

describe("cmsProvider", () => {
  it("declares cms as its source", () => {
    expect(cmsProvider.source).toBe("cms");
  });

  it("ingest is the identity no-op for cms-authored content", async () => {
    const result = await cmsProvider.ingest(noopCtx, {
      tenantSlug: "demo-media",
      demand: { categories: ["science"] },
    });

    expect(result).toEqual({ upserted: 0 });
  });
});

describe("PROVIDERS registry", () => {
  it("contains cmsProvider", () => {
    expect(PROVIDERS).toContain(cmsProvider);
  });

  it("iterates any adapter registered in the same registry shape", async () => {
    const fakeProvider: ContentProvider = {
      source: "fake",
      ingest: async () => ({ upserted: 3 }),
    };

    const registry: ContentProvider[] = [...PROVIDERS, fakeProvider];
    const seen: string[] = [];
    const upserted: number[] = [];

    for (const provider of registry) {
      seen.push(provider.source);
      const result = await provider.ingest(noopCtx, {
        tenantSlug: "demo-media",
        demand: { categories: [] },
      });
      upserted.push(result.upserted);
    }

    expect(seen).toEqual(["cms", "fake"]);
    expect(upserted).toEqual([0, 3]);
  });
});
