# Discovery Slice D — WikipediaProvider + ingestion par FetchDemand

> **Letter nomenclature on purpose** (parallel numeric slices run by other agents). Backend ingestion slice — see ADR 0004 + the spine `2026-06-06-slice-6-discovery-engine.md`. **Depends on Slice B** (schema, `contents`, `userPreferences`, `ScoringPolicy`, `getDiscoveryFeed`). Independent of the card (Slice C). Branch from the latest discovery branch (or from `dev` once A/B/C are merged).

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. **Vitest-first for all `convex/**` code.** Read `convex/_generated/ai/guidelines.md` before touching `convex/`. Steps use `- [ ]`.

**Goal:** ingest real **Wikipedia** content into the canonical `contents` corpus, driven by a tenant-level **`FetchDemand`** (aggregated `Affinity` + diversity quota + bootstrap seed) on a **scheduled cron** — decoupled from per-user gestures. This is the **second real adapter** of the `Provider` port, validating the hexagon. No UI work: once ingested, Wikipedia content surfaces in **Découvrir** automatically (and is kept out of the editorial Accueil/Explore).

**End-to-end proof:** run the ingestion action against the dev deployment → Wikipedia articles appear in `getDiscoveryFeed` (Découvrir) but **not** in the editorial home feed; re-running does **not** duplicate (dedup by `externalId`); with no affinities, the cold-start seed categories drive the fetch.

**Tech Stack:** Convex (schema, action with external `fetch`, internal mutation, cron, pure aggregation), TypeScript, Vitest + convex-test.

---

## Read First

- `docs/adr/0004-aggregation-engine.md` — **the decisions this slice implements** (contents-not-pages, FetchDemand cron, dedup, immersion/graph/vector/pruning deferred).
- `docs/adr/0003-content-discovery-engine.md` — provider isolation (Risk 6), canonical model.
- `docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md` — spine.
- `convex/_generated/ai/guidelines.md` — **read before any `convex/` work** (actions vs mutations vs queries, `ctx.runQuery`/`ctx.runMutation`, crons, `"use node"` only if needed).
- `docs/convex-components-descriptions.md` — check for an HTTP/rate-limit helper before hand-rolling; plain `fetch` in an action is acceptable for MediaWiki.
- Existing code to reconcile/reuse: `convex/discovery/provider.ts` (the Slice A **read-shaped** port — see Task 2), `convex/discovery/feed.ts` (reads `contents` directly), `convex/discovery/scoring.ts` (`Affinity`, `normalizeScoringKey`), `convex/content/queries.ts` (`listPublishedFeed` — editorial surface to isolate), `convex/schema.ts`, `convex/tenants/*`.

Standing rules: **test where the code lives** — Convex → Vitest/convex-test (`npm run test:convex`). Prefer pure functions for anything testable (normalization, demand computation). MediaWiki requires a descriptive **User-Agent**; respect rate limits (batch via `generator=search`).

---

## Scope Guard

Includes:

- Source fields on `contents` (`source`, `externalId`, `canonicalUrl`) + dedup index.
- Tenant **seed categories** for cold start.
- **Redefine `ContentProvider` as an ingestion port** (fetch → normalize → upsert); `cmsProvider` = identity; `WikipediaProvider` = real adapter.
- Pure **`FetchDemand`** computation (aggregate affinities + diversity quota + bootstrap seed).
- `WikipediaProvider`: MediaWiki `generator=search` (enriched batch) + `categorymembers` (cold start); pure normalization; upsert via internal mutation; dedup by `(tenantSlug, source, externalId)`.
- Scheduled **ingestion cron** orchestrating FetchDemand → provider.
- **Source isolation**: Wikipedia content appears only in `getDiscoveryFeed`, not in the editorial `Feed` (Accueil/Explore).

Does **not** include (deferred per ADR 0004):

- Infinite scroll / pagination (separate feed-mechanics slice).
- `Engagement` implicit signals (separate ambient slice).
- Immersion mode (hyperlink JIT reading), `edges` graph, vector search, **pruning**, on-demand refill, onboarding tag-cloud.
- Any change to the Discover card/UI.

---

## File Structure

- `convex/schema.ts` — `contents`: add `source`/`externalId`/`canonicalUrl` + `by_tenant_source_external` index; `tenants`: add `discoverySeedCategories`.
- `convex/discovery/provider.ts` — **redefine** the port to ingestion; `cmsProvider` identity.
- `convex/discovery/fetch-demand.ts` (+ `.test.ts`) — pure `computeFetchDemand`.
- `convex/discovery/providers/wikipedia.ts` (+ `.test.ts`) — pure `normalizeWikipediaPage` + the ingest action.
- `convex/discovery/ingest.ts` — internal upsert mutation (dedup) + orchestration action `runDiscoveryIngestion`.
- `convex/crons.ts` — register the scheduled ingestion (create if absent).
- `convex/content/queries.ts` — isolate editorial surfaces to `source === "cms"`.
- `convex/discovery/feed.ts` — confirm it includes all sources (Wikipedia visible in Découvrir).

---

### Task 1: Schema — source fields + seed categories

**Files:** `convex/schema.ts`.

- [ ] `contents`: add `source: v.optional(v.union(v.literal("cms"), v.literal("wikipedia")))` (absent ⇒ treated as `"cms"`), `externalId: v.optional(v.string())`, `canonicalUrl: v.optional(v.string())`. Add index `by_tenant_source_external` (`tenantSlug`, `source`, `externalId`) for dedup.
- [ ] `tenants`: add `discoverySeedCategories: v.optional(v.array(v.string()))`.
- [ ] `tsc -p convex` clean. **Commit** — `feat(schema): content source fields + tenant discovery seed categories`.

---

### Task 2: Redefine `ContentProvider` as an ingestion port (Vitest-first)

The Slice A port is **read-shaped** (`sync → NormalizedContent[]`, unused by the feed, which reads `contents` directly). Per ADR 0004 the port is an **ingestion** seam.

**Files:** `convex/discovery/provider.ts`; `convex/discovery/provider.test.ts`.

- [ ] **Step 1 (Vitest):** specs for the new shape — `cmsProvider.source === "cms"` and its `ingest` is the identity no-op (content is authored directly; returns `{ upserted: 0 }`); `PROVIDERS` contains `cmsProvider`; a fake adapter pushed into a local registry is iterated (seam is real).
- [ ] **Step 2:** redefine `interface ContentProvider { readonly source: string; ingest(ctx, args: { tenantSlug; demand }): Promise<{ upserted: number }> }`. Drop the read `sync` (the feed already reads `contents`). `cmsProvider.ingest` = no-op identity.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `refactor(discovery): ContentProvider is an ingestion port`.

---

### Task 3: `FetchDemand` (pure, Vitest-first)

**Files:** `convex/discovery/fetch-demand.ts`; `convex/discovery/fetch-demand.test.ts`.

- [ ] **Step 1 (Vitest, pure):**
  - Cold start (no affinities) → demand = the tenant's `discoverySeedCategories`.
  - With aggregated affinities → demand ranks the top categories by aggregate score, **plus** a diversity quota of categories outside the top (and/or seed) so the corpus does not narrow.
  - Keys normalized via `normalizeScoringKey`; bounded number of categories returned.
- [ ] **Step 2:** implement `computeFetchDemand(aggregatedAffinities, seedCategories, opts) → { categories: string[] }` (pure, no `ctx`). Aggregation of per-member `Affinity` into tenant-level scores is done by the caller (a query) and passed in.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): pure FetchDemand computation`.

---

### Task 4: WikipediaProvider adapter (Vitest-first)

**Files:** `convex/discovery/providers/wikipedia.ts`; `convex/discovery/providers/wikipedia.test.ts`; `convex/discovery/ingest.ts`.

- [ ] **Step 1 (Vitest, pure):** `normalizeWikipediaPage(rawPage, { tenantSlug, category })` maps a MediaWiki page → a `contents` insert shape: `kind: "article"`, `source: "wikipedia"`, `externalId` = pageId (string), `canonicalUrl`, `title`, `summary` = `extract`, `heroImageUrl` = thumbnail (optional), `category` = the queried category, `tags: []`, `status: "published"`, `isPremium: false`. Pure, fully unit-tested (no network).
- [ ] **Step 2:** `upsertIngested` internal mutation — for each normalized doc, dedup via `by_tenant_source_external` (`tenantSlug`, `"wikipedia"`, `externalId`): insert if absent, else skip/patch. Returns count. Vitest (convex-test).
- [ ] **Step 3:** `wikipediaProvider.ingest` **action** — for each demand category, call MediaWiki (`generator=search` enriched, or `categorymembers` for cold start) with a descriptive `User-Agent`, normalize, then `ctx.runMutation(internal…upsertIngested)`. Mock `fetch` in tests (`vi.stubGlobal`); assert it dedups across two runs.
- [ ] **Step 4:** Vitest → PASS. **Commit** — `feat(discovery): WikipediaProvider adapter (fetch + normalize + upsert)`.

---

### Task 5: Ingestion orchestration + cron (Vitest where pure)

**Files:** `convex/discovery/ingest.ts`; `convex/crons.ts`; `convex/discovery/provider.ts` (registry).

- [ ] Add `wikipediaProvider` to `PROVIDERS` (now **two real adapters** — the port is vindicated).
- [ ] `runDiscoveryIngestion` action: for each tenant → `runQuery` to aggregate `userPreferences` into tenant affinities + read `discoverySeedCategories` → `computeFetchDemand` → call each provider's `ingest` (skip the cms identity). Keep the aggregation query pure-testable.
- [ ] `convex/crons.ts`: register `runDiscoveryIngestion` on a schedule (e.g. daily). Create the file if absent.
- [ ] **Vitest:** the tenant-affinity aggregation produces expected per-category totals on a seeded set.
- [ ] **Commit** — `feat(discovery): scheduled FetchDemand ingestion cron`.

---

### Task 6: Source isolation — Wikipedia in Discover only (Vitest-first)

**Files:** `convex/content/queries.ts`; `convex/discovery/feed.ts`; tests.

- [ ] **Step 1 (Vitest):** `listPublishedFeed` (and category/explore reads) **exclude** `source === "wikipedia"` (editorial surfaces stay CMS-only); `getDiscoveryFeed` **includes** all sources. Existing content (no `source`) is treated as `cms` and stays visible everywhere it was.
- [ ] **Step 2:** implement the filter (treat missing `source` as `"cms"`).
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): keep Wikipedia content out of the editorial feed`.

---

### Task 7: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npx tsc --noEmit -p convex` + `npx tsc --noEmit` → PASS.
- [ ] **Live ingestion smoke** (dev): set `discoverySeedCategories` on the dev tenant; run `runDiscoveryIngestion`; confirm via the Convex dashboard / a query that Wikipedia rows landed in `contents` with `source: "wikipedia"` + `externalId`; **re-run → no duplicates**; Wikipedia content appears in `getDiscoveryFeed` but **not** in `listPublishedFeed`.
- [ ] `git status --short` clean.

---

## Self-Review

- **Hexagon vindicated:** two real adapters now sit behind the port — the seam the ADRs committed to was not an over-architecture.
- **Ingestion port, not read port:** the Slice A read-`sync` is replaced; the feed keeps reading the canonical `contents`, providers only fill it (ADR 0004 §3).
- **No model duplication:** Wikipedia is normalized into `contents`; ScoringPolicy/feed/card/bookmarks/ContentVisibility apply unchanged.
- **Group effect without per-user coupling:** `FetchDemand` aggregates tenant affinities on a schedule; no per-gesture fetch.
- **Editorial integrity:** source isolation keeps Wikipedia out of Accueil/Explore.
- **Deferred cleanly:** infinite scroll, Engagement, immersion, edges/vector, pruning, on-demand refill — all out, none blocking.

## After This Slice

Natural follow-ups (separate slices): infinite-scroll feed mechanics (stable-seed pagination); ambient `Engagement` signals; Immersion reading mode; then — only if justified — `edges` graph + Convex vector search, and corpus pruning.
