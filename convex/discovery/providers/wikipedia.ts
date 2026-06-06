import { internal } from "../../_generated/api";
import type { ActionCtx } from "../../_generated/server";
import type { FetchDemand } from "../fetchDemand";
import type { ContentProvider } from "../provider";
import { normalizeScoringKey } from "../scoring";

export const WIKIPEDIA_USER_AGENT =
  "MediumShip/1.0 (https://mediumship.app; discovery-ingestion)";

export const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";

const PAGES_PER_CATEGORY = 12;

export { PAGES_PER_CATEGORY as WIKIPEDIA_PAGES_PER_CATEGORY };

export type WikipediaPageRaw = {
  pageid: number;
  title: string;
  extract?: string;
  fullurl?: string;
  thumbnail?: { source?: string };
};

export type NormalizedWikipediaPage = {
  tenantSlug: string;
  kind: "article";
  status: "published";
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  isPremium: false;
  heroImageUrl?: string;
  publishedAt: string;
  source: "wikipedia";
  externalId: string;
  canonicalUrl: string;
};

export function slugFromWikipediaTitle(title: string, pageId: number): string {
  const base = normalizeScoringKey(title);
  return base.length > 0 ? base : `wiki-${pageId}`;
}

export function normalizeWikipediaPage(
  rawPage: WikipediaPageRaw,
  args: { tenantSlug: string; category: string },
): NormalizedWikipediaPage {
  const title = rawPage.title;
  const pageId = rawPage.pageid;
  const wikiTitle = title.replace(/ /g, "_");

  return {
    tenantSlug: args.tenantSlug,
    kind: "article",
    status: "published",
    slug: slugFromWikipediaTitle(title, pageId),
    title,
    summary: rawPage.extract?.trim() ?? "",
    category: args.category,
    tags: [],
    isPremium: false,
    heroImageUrl: rawPage.thumbnail?.source,
    publishedAt: new Date().toISOString(),
    source: "wikipedia",
    externalId: String(pageId),
    canonicalUrl:
      rawPage.fullurl ??
      `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle)}`,
  };
}

export function toWikipediaCategoryTitle(categorySlug: string): string {
  const words = categorySlug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

  return `Category:${words.join("_")}`;
}

/**
 * Full-text search term for a category. `incategory:"X"` only matches the few
 * pages directly in that category (exhausted within a couple of refills); a
 * plain topical search returns thousands of relevance-ranked pages, giving the
 * search offset real depth to paginate through.
 */
export function toWikipediaSearchTerm(categorySlug: string): string {
  return categorySlug.split("-").filter(Boolean).join(" ");
}

function buildApiUrl(params: Record<string, string>): string {
  const url = new URL(WIKIPEDIA_API_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function mediaWikiFetch(
  params: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  const response = await fetchImpl(buildApiUrl(params), {
    headers: {
      "User-Agent": WIKIPEDIA_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`MediaWiki request failed with status ${response.status}`);
  }

  return response.json();
}

function pagesFromQueryResponse(data: unknown): WikipediaPageRaw[] {
  const pages = (data as { query?: { pages?: Record<string, WikipediaPageRaw> } })
    .query?.pages;
  if (!pages) {
    return [];
  }

  return Object.values(pages).filter(
    (page) => typeof page.pageid === "number" && page.pageid > 0,
  );
}

export async function fetchWikipediaPagesViaSearch(
  categorySlug: string,
  fetchImpl: typeof fetch = fetch,
  offset = 0,
): Promise<WikipediaPageRaw[]> {
  const data = await mediaWikiFetch(
    {
      action: "query",
      format: "json",
      origin: "*",
      generator: "search",
      gsrsearch: toWikipediaSearchTerm(categorySlug),
      gsrlimit: String(PAGES_PER_CATEGORY),
      gsroffset: String(offset),
      prop: "extracts|pageimages|info",
      exintro: "1",
      explaintext: "1",
      piprop: "thumbnail",
      pithumbsize: "400",
      inprop: "url",
    },
    fetchImpl,
  );

  return pagesFromQueryResponse(data);
}

export async function fetchWikipediaPagesViaCategoryMembers(
  categorySlug: string,
  fetchImpl: typeof fetch = fetch,
): Promise<WikipediaPageRaw[]> {
  const categoryTitle = toWikipediaCategoryTitle(categorySlug);

  const membersData = await mediaWikiFetch(
    {
      action: "query",
      format: "json",
      origin: "*",
      list: "categorymembers",
      cmtitle: categoryTitle,
      cmlimit: String(PAGES_PER_CATEGORY),
      cmtype: "page",
    },
    fetchImpl,
  );

  const members =
    (
      membersData as {
        query?: { categorymembers?: Array<{ pageid: number; title: string }> };
      }
    ).query?.categorymembers ?? [];

  if (members.length === 0) {
    return [];
  }

  const pageIds = members.map((member) => String(member.pageid)).join("|");
  const detailsData = await mediaWikiFetch(
    {
      action: "query",
      format: "json",
      origin: "*",
      pageids: pageIds,
      prop: "extracts|pageimages|info",
      exintro: "1",
      explaintext: "1",
      piprop: "thumbnail",
      pithumbsize: "400",
      inprop: "url",
    },
    fetchImpl,
  );

  return pagesFromQueryResponse(detailsData);
}

export async function fetchWikipediaArticleBody(
  pageId: number | string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const data = await mediaWikiFetch(
    {
      action: "query",
      format: "json",
      origin: "*",
      pageids: String(pageId),
      prop: "extracts",
      explaintext: "1",
    },
    fetchImpl,
  );

  const pages = (
    data as { query?: { pages?: Record<string, { extract?: string }> } }
  ).query?.pages;
  if (!pages) {
    return "";
  }

  const extract = Object.values(pages)[0]?.extract;
  if (typeof extract !== "string") {
    return "";
  }

  return extract.trim();
}

export async function fetchWikipediaCategoryPages(
  categorySlug: string,
  fetchImpl: typeof fetch = fetch,
  options: { coldStart?: boolean; offset?: number } = {},
): Promise<WikipediaPageRaw[]> {
  const offset = options.offset ?? 0;

  if (options.coldStart) {
    const members = await fetchWikipediaPagesViaCategoryMembers(
      categorySlug,
      fetchImpl,
    );
    if (members.length > 0) {
      return members;
    }
  }

  const searchPages = await fetchWikipediaPagesViaSearch(
    categorySlug,
    fetchImpl,
    offset,
  );
  if (searchPages.length > 0) {
    return searchPages;
  }

  return fetchWikipediaPagesViaCategoryMembers(categorySlug, fetchImpl);
}

async function ingestWikipediaDemand(
  ctx: ActionCtx,
  args: { tenantSlug: string; demand: FetchDemand },
  fetchImpl: typeof fetch = fetch,
): Promise<{ upserted: number }> {
  let totalUpserted = 0;

  for (const category of args.demand.categories) {
    // Cold start fills from offset 0 (categorymembers); refills advance a
    // persisted search offset so each run brings genuinely new pages.
    const offset = args.demand.coldStart
      ? 0
      : await ctx.runQuery(internal.discovery.ingest.getCategoryOffset, {
          tenantSlug: args.tenantSlug,
          category,
        });

    const pages = await fetchWikipediaCategoryPages(category, fetchImpl, {
      coldStart: args.demand.coldStart,
      offset,
    });
    const normalized = pages.map((page) =>
      normalizeWikipediaPage(page, {
        tenantSlug: args.tenantSlug,
        category,
      }),
    );

    if (normalized.length === 0) {
      continue;
    }

    const result: { upserted: number } = await ctx.runMutation(
      internal.discovery.ingest.upsertIngested,
      { items: normalized },
    );
    totalUpserted += result.upserted;

    if (!args.demand.coldStart) {
      await ctx.runMutation(internal.discovery.ingest.advanceCategoryOffset, {
        tenantSlug: args.tenantSlug,
        category,
        by: pages.length,
      });
    }
  }

  return { upserted: totalUpserted };
}

export const wikipediaProvider: ContentProvider = {
  source: "wikipedia",
  async ingest(ctx, args) {
    return ingestWikipediaDemand(ctx, args);
  },
};

export { ingestWikipediaDemand };
