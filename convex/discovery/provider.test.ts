import { afterEach, describe, expect, it, vi } from "vitest";

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
  it("contains cmsProvider and wikipediaProvider", () => {
    expect(PROVIDERS).toContain(cmsProvider);
    expect(PROVIDERS.map((provider) => provider.source)).toContain("wikipedia");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("iterates any adapter registered in the same registry shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ query: { random: [] } }),
      }),
    );

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

    expect(seen).toEqual(["cms", "wikipedia", "fake"]);
    expect(upserted[0]).toBe(0);
    expect(upserted[2]).toBe(3);
  });
});
