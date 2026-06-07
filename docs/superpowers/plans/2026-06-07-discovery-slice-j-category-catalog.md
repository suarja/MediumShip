# Discovery Slice J — Catalogue global hiérarchique (IPTC) + queries arbre

> **Letter nomenclature** (parallel numeric slices). Implements **ADR 0007** backend foundation. Builds on Slice I (`categoryInterests`, taxonomie plate). Branch from `feat/discovery-slice-i-category-interests` (or `dev` once merged).

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Vitest-first for `convex/**`. Read `convex/_generated/ai/guidelines.md` before `convex/`. Steps use `- [ ]`. **No mobile/CMS UI in this slice** — Slice K (CMS search) and Slice L (orbital Settings picker) follow.

**Goal:** a **global platform reservoir** of hierarchical categories (`categoryCatalog`), seeded from **IPTC Media Topics**, plus **tree-aware queries** for search and children. Extend the existing flat `categories` table with hierarchy fields and migrate in-place. Creators and members get no new UI yet — only the backend contract Slice K/L will consume.

**Locked product rules (ADR 0007):**

- Picks remain **explicit only** (Slice I `categoryInterests` unchanged).
- Catalog is **global** — not per-tenant.
- Search returns a node **and its derivatives** (descendants, max depth 3).
- Member never queries `categoryCatalog` directly — tenant `categories` only.

**End-to-end proof (backend):** run IPTC import → ~1200 catalog nodes with `parentId`/`depth` → `searchCategoryCatalog("econom")` returns Economy + descendants capped at depth 3 → `addCategoryFromCatalog` copies a subtree into tenant `categories` → `searchTenantCategories` mirrors search on tenant tree → existing Slice I interest picks still score/ingest on normalized keys.

---

## Read First

- `docs/adr/0007-hierarchical-category-catalog.md` — decisions locked 2026-06-07.
- `docs/adr/0006-tenant-managed-category-taxonomy.md` — flat taxonomy baseline.
- **Existing to REUSE:** `convex/schema.ts` (`categories`), `convex/categories/queries.ts`, `convex/categories/model.ts`, `convex/categories/interests.ts`, `normalizeScoringKey` in `convex/discovery/scoring.ts`, `convex/cms/categories.ts`.
- IPTC JSON: `http://cv.iptc.org/newscodes/mediatopic/?format=json` (Accept: `application/json`).
- `convex/_generated/ai/guidelines.md`, `CLAUDE.md`.

Standing rules: argument validation on all public functions; no `Date.now()` in queries; indexes over filter(); tests where the code lives.

---

## Scope Guard

Includes:

- **`categoryCatalog` table** — platform tree (`externalId`, labels, `slug`, `parentId`, `depth`, `iconKey?`, `retired?`).
- **Extend `categories`** — `parentId?`, `catalogNodeId?`, `depth`, `isSelectable` (default true); migration for existing rows (`depth: 0`).
- **IPTC import** — internal action (Node) parsing JSON → upsert catalog nodes idempotently by `externalId`.
- **Catalog queries** — `listCategoryCatalogRoots`, `listCategoryCatalogChildren`, `searchCategoryCatalog({ query, locale?, maxDepth?: 3 })`.
- **Tenant tree queries** — `listTenantCategoryRoots`, `listTenantCategoryChildren`, `searchTenantCategories({ tenantSlug, query, maxDepth?: 3 })` (respect `isSelectable` for member-facing paths).
- **CMS mutation** — `addCategoryFromCatalog({ tenantSlug, catalogNodeId, includeDescendants?: boolean })` copying label/slug/icon + tree shape into tenant taxonomy (skip duplicates by slug).
- Vitest coverage for import, search, children, copy-to-tenant.

Does **not** include:

- CMS search UI (Slice K).
- Mobile orbital cloud / Settings upgrade (Slice L).
- Onboarding flow.
- Branch-pick implicit boost.
- `categoryEdges` / DAG.
- Automatic IPTC cron in production.
- Changes to `categoryInterests`, `scoreContent`, or `getTenantIngestionInputs` (Slice I stays as-is).

---

## File Structure

- `convex/schema.ts` — `categoryCatalog` table; extend `categories`.
- `convex/categories/catalog.ts` — catalog queries + search helpers (pure TS testable).
- `convex/categories/catalog-import.ts` — `"use node"` IPTC import internal action.
- `convex/categories/tree.ts` — shared tree/search utilities (`buildSearchResults`, depth cap).
- `convex/categories/queries.ts` — extend with tenant tree queries (or split `tenant-tree.ts`).
- `convex/cms/categories.ts` — `addCategoryFromCatalog` mutation.
- `convex/categories/catalog.test.ts`, `convex/categories/tree.test.ts`, `convex/categories/tenant-tree.test.ts`.
- `convex/categories/fixtures/iptc-mediatopic-sample.json` — small fixture for tests (do not commit full 1200-node dump).

---

### Task 1: Schema — catalog + hierarchy fields (Vitest-first)

**Files:** `convex/schema.ts`; `convex/categories/tree.test.ts` (pure helpers first).

- [ ] **Step 1 (Vitest, pure TS):** tree helpers — given a flat node list with `parentId`, `buildSubtree(rootId, maxDepth)` returns ordered descendants; `normalizeSearchQuery` folds accents; depth cap at 3 truncates deeper branches.
- [ ] **Step 2:** add `categoryCatalog` table + indexes (`by_externalId`, `by_parent`, `by_depth`); extend `categories` with `parentId`, `catalogNodeId`, `depth`, `isSelectable`; index `by_tenantSlug_and_parent`.
- [ ] **Step 3:** migration in seed/test helper — existing flat categories get `depth: 0`, `isSelectable: true`.
- [ ] **Step 4:** Vitest → PASS. **Commit** — `feat(categories): category catalog schema and tree helpers`.

---

### Task 2: IPTC import (Vitest-first)

**Files:** `convex/categories/catalog-import.ts`; `convex/categories/fixtures/iptc-mediatopic-sample.json`; `convex/categories/catalog.test.ts`.

- [ ] **Step 1 (Vitest):** parser maps IPTC SKOS JSON to `{ externalId, label, labelFr?, parentExternalId?, depth }[]`; idempotent re-import updates labels, does not duplicate `externalId`; retired concepts marked `retired: true`.
- [ ] **Step 2:** internal action `importIptcMediaTopics` fetches JSON (or accepts fixture in test via stubbed fetch), resolves `parentId` links in second pass, writes `categoryCatalog`.
- [ ] **Step 3:** dev-only internal mutation or documented `npx convex run` entry point for manual import.
- [ ] **Step 4:** Vitest → PASS. **Commit** — `feat(categories): import IPTC Media Topics into categoryCatalog`.

---

### Task 3: Catalog search & children queries (Vitest-first)

**Files:** `convex/categories/catalog.ts`; `convex/categories/catalog.test.ts`.

- [ ] **Step 1 (Vitest, convex-test):** `listCategoryCatalogRoots` returns depth-0 nodes sorted by label; `listCategoryCatalogChildren({ parentId })` returns direct children only; `searchCategoryCatalog({ query: "econom" })` returns matching nodes **and** their descendant subtrees capped at depth 3 from each match root.
- [ ] **Step 2:** implement queries (internal or public read — catalog is not member-facing; CMS uses via admin auth in Slice K, tests use convex-test directly).
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(categories): catalog search and children queries`.

---

### Task 4: Tenant tree queries + copy from catalog (Vitest-first)

**Files:** `convex/categories/queries.ts` (or `tenant-tree.ts`); `convex/cms/categories.ts`; tests.

- [ ] **Step 1 (Vitest):** `listTenantCategoryRoots({ tenantSlug })`; `listTenantCategoryChildren({ tenantSlug, parentId })`; `searchTenantCategories({ tenantSlug, query })` same shape as catalog search but scoped to tenant + `isSelectable !== false`.
- [ ] **Step 2:** `addCategoryFromCatalog({ tenantSlug, catalogNodeId, includeDescendants })` copies node(s) preserving `parentId` links within copied subtree; skips existing slugs; sets `catalogNodeId` + `depth`.
- [ ] **Step 3:** verify Slice I regression — `setCategoryInterests` + `getDiscoveryFeed` still work on copied category labels/keys.
- [ ] **Step 4:** Vitest → PASS. **Commit** — `feat(categories): tenant tree queries and catalog copy mutation`.

---

### Task 5: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` → PASS.
- [ ] Manual (dev): run IPTC import once → Convex dashboard shows `categoryCatalog` populated → run `searchCategoryCatalog` with `econom` / `économie` → run `addCategoryFromCatalog` for demo tenant → tenant `categories` has subtree.
- [ ] `git status --short` clean.

---

## Self-Review

- **Global reservoir** separate from tenant taxonomy — ADR 0007 three-layer model.
- **IPTC** as seed, not Wikipedia, for vocabulary.
- **Search + derivatives** contract ready for Slice K/L UX (same query shape both sides).
- **Slice I preserved** — `categoryInterests` and discovery boost paths untouched.
- **Depth cap 3** enforced in search/subtree helpers, not only UI.

## After This Slice

- **Slice K** — CMS creator: search bar on `categoryCatalog`, show node + derivatives, add to tenant taxonomy (no flat list browse).
- **Slice L** — Mobile Settings: upgrade `CategoryInterestsItem` to search + L1 roots + orbital cloud (3 levels); reuse `useCategoryInterests` + new tree queries; `frontend-design` skill.
- Onboarding promotion (reuse Slice L component).
- Optional: platform custom nodes in `categoryCatalog`; IPTC resync cron.
