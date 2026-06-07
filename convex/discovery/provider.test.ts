import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cmsProvider,
  PROVIDERS,
  type ContentProvider,
} from "./provider";

const noopCtx = {
  runQuery: vi.fn().mockResolvedValue(null),
  runMutation: vi.fn().mockResolvedValue({ upserted: 0 }),
} as unknown as Parameters<ContentProvider["ingest"]>[0];

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

  it("ingest port accepts only tenantSlug and demand", async () => {
    const args = {
      tenantSlug: "demo-media",
      demand: { categories: ["science"], coldStart: true },
    };

    const result = await cmsProvider.ingest(noopCtx, args);

    expect(result).toEqual({ upserted: 0 });
    expect(args).not.toHaveProperty("wikipediaLocale");
  });
});

describe("PROVIDERS registry", () => {
  it("contains cmsProvider, wikipediaProvider, and rssProvider", () => {
    expect(PROVIDERS).toContain(cmsProvider);
    expect(PROVIDERS.map((provider) => provider.source)).toEqual([
      "cms",
      "wikipedia",
      "rss",
    ]);
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

    expect(seen).toEqual(["cms", "wikipedia", "rss", "fake"]);
    expect(upserted[0]).toBe(0);
    expect(upserted[3]).toBe(3);
  });
});
