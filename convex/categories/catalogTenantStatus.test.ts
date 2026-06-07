import { describe, expect, it } from "vitest";

import { enrichCatalogSummariesWithTenantStatus } from "./catalogTenantStatus";
import type { CatalogNodeSummary } from "./catalogRead";

describe("catalogTenantStatus", () => {
  const summaries: CatalogNodeSummary[] = [
    {
      _id: "root",
      label: "Economy",
      displayLabel: "Economy",
      depth: 0,
      externalId: "medtop:1",
      slug: "economy",
      retired: false,
      canAdd: true,
    },
    {
      _id: "child",
      label: "Finance",
      displayLabel: "Finance",
      depth: 1,
      externalId: "medtop:2",
      slug: "finance",
      retired: false,
      canAdd: true,
      parentId: "root",
    },
    {
      _id: "grandchild",
      label: "Markets",
      displayLabel: "Markets",
      depth: 2,
      externalId: "medtop:3",
      slug: "markets",
      retired: false,
      canAdd: true,
      parentId: "child",
    },
  ];

  const catalogNodes = [
    {
      _id: "root",
      externalId: "medtop:1",
      label: "Economy",
      slug: "economy",
      depth: 0,
      retired: false,
    },
    {
      _id: "child",
      externalId: "medtop:2",
      label: "Finance",
      slug: "finance",
      depth: 1,
      parentId: "root",
      retired: false,
    },
    {
      _id: "grandchild",
      externalId: "medtop:3",
      label: "Markets",
      slug: "markets",
      depth: 2,
      parentId: "child",
      retired: false,
    },
  ] as never[];

  it("marks only the selected node as inTenant", () => {
    const enriched = enrichCatalogSummariesWithTenantStatus(
      summaries,
      [
        {
          _id: "tenant-child",
          tenantSlug: "demo-media",
          label: "Finance",
          slug: "finance",
          iconKey: "default",
          sortOrder: 0,
          updatedAt: 0,
          catalogNodeId: "child",
        },
      ] as never[],
      catalogNodes,
      "en",
    );

    expect(enriched.find((node) => node._id === "child")?.inTenant).toBe(true);
    expect(enriched.find((node) => node._id === "root")?.inTenant).toBe(false);
    expect(enriched.find((node) => node._id === "child")?.descendantsFullyInTenant).toBe(
      false,
    );
  });

  it("marks descendantsFullyInTenant when every descendant is present", () => {
    const enriched = enrichCatalogSummariesWithTenantStatus(
      summaries,
      [
        {
          _id: "tenant-child",
          tenantSlug: "demo-media",
          label: "Finance",
          slug: "finance",
          iconKey: "default",
          sortOrder: 0,
          updatedAt: 0,
          catalogNodeId: "child",
        },
        {
          _id: "tenant-grandchild",
          tenantSlug: "demo-media",
          label: "Markets",
          slug: "markets",
          iconKey: "default",
          sortOrder: 1,
          updatedAt: 0,
          catalogNodeId: "grandchild",
        },
      ] as never[],
      catalogNodes,
      "en",
    );

    expect(enriched.find((node) => node._id === "child")?.descendantsFullyInTenant).toBe(
      true,
    );
    expect(enriched.find((node) => node._id === "root")?.descendantsFullyInTenant).toBe(
      true,
    );
  });
});
