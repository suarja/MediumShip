# Discovery Slice K — CMS Développeur : import IPTC + recherche catalogue → taxonomie tenant

> **Letter nomenclature** (parallel numeric slices). Implements **ADR 0007** CMS surface. Builds on Slice J (`categoryCatalog`, catalog queries, `addCategoryFromCatalog`). Branch from `feat/discovery-slice-j-category-catalog`.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Vitest-first for new `convex/cms/**` wrappers; manual CMS smoke for UI. Read `convex/_generated/ai/guidelines.md` before `convex/`. UI → invoke `frontend-design` for the developer tab. Steps use `- [ ]`.

**Goal:** the CMS admin gets a **Développeur** tab to (1) **import IPTC** into the global `categoryCatalog` with one click, (2) **search** the catalogue (« Économie » → node + derivatives, depth cap 3), and (3) **add nodes to the tenant taxonomy** via `addCategoryFromCatalog` — no flat list browse, search-first. After import + add, new categories appear in the existing **Catégories** tab and flow through to mobile `listCategoryOptions` / Settings interests (Slice I).

**Locked product rules (ADR 0007):**

- Search-first for creators — barre de recherche + optional L1 root chips, not a full list picker.
- Results show matched node **and descendants** (max depth 3).
- `addCategoryFromCatalog` supports **node only** vs **include descendants** toggle per add.
- Member/mobile unchanged in this slice (Slice L upgrades the Settings picker UI).
- CMS admin auth only (`requireCmsAdmin`).

**End-to-end proof (manual):** CMS → **Développeur** → Import IPTC (success toast + node count) → search « econom » → add « Economy, Business and Finance » with descendants → **Catégories** tab shows new tree → mobile Settings → Centres d'intérêt lists the new labels.

---

## Read First

- `docs/adr/0007-hierarchical-category-catalog.md`
- `docs/superpowers/plans/2026-06-07-discovery-slice-j-category-catalog.md` — backend already shipped
- **Reuse:** `convex/categories/catalog.ts` (internal queries), `convex/categories/catalogImport.ts` (`importIptcMediaTopics`), `convex/cms/categories.ts` (`addCategoryFromCatalog`), `apps/cms/components/cms/admin-shell.tsx`, `dashboard.tsx`, `categories-tab.tsx`, `category-list.tsx`
- CMS styling: `apps/cms/app/globals.css` (CSS variables — do not hardcode hex in new components)
- `convex/_generated/ai/guidelines.md`, `CLAUDE.md`

Standing rules: scheduler only for internal functions; validate args/returns on new public Convex functions; responsive CMS layout; French copy OK in CMS (matches existing tabs).

---

## Scope Guard

Includes:

- **CMS Convex wrappers** — admin-gated queries wrapping catalog internals; `triggerIptcImport` mutation scheduling `importIptcMediaTopics`; `getCategoryCatalogStats` (node count, retired count).
- **Développeur tab** — new CMS tab `developer` in `CMS_TABS` / `AdminShell` nav.
- **Developer tab UI** — import panel + catalog search + hierarchical results with « Ajouter » / « Ajouter avec dérivés » actions; optional L1 root chips when search empty.
- **Feedback** — loading/error/success states; disable add when catalog empty (prompt import first).
- Vitest for new CMS convex wrappers.

Does **not** include:

- Mobile orbital cloud (Slice L).
- Onboarding flow.
- Editing catalog nodes in CMS (read + import only).
- Replacing the flat **Catégories** CRUD tab (keep both — dev tab for reservoir, categories tab for tenant-owned list).

---

## File Structure

- `convex/cms/catalog.ts` (+ test) — `getCategoryCatalogStats`, `searchCategoryCatalogForCms`, `listCategoryCatalogRootsForCms`, `triggerIptcImport`
- `apps/cms/components/cms/developer-tab.tsx` — main UI
- `apps/cms/components/cms/catalog-search-results.tsx` — indented tree results + add actions
- `apps/cms/components/cms/admin-shell.tsx` — add tab
- `apps/cms/components/cms/dashboard.tsx` — wire tab
- `apps/cms/app/page.tsx` — URL `?tab=developer` if needed

---

### Task 1: CMS catalog API wrappers (Vitest-first)

**Files:** `convex/cms/catalog.ts`; `convex/cms/catalog.test.ts`.

- [ ] **Step 1 (Vitest):** `getCategoryCatalogStats` returns `{ total, active, retired }`; guest/non-admin → error; `searchCategoryCatalogForCms({ query })` delegates to catalog search (accent fold, depth 3); empty query returns `[]`; `listCategoryCatalogRootsForCms` returns depth-0 nodes; `triggerIptcImport` requires admin and schedules `internal.categories.catalogImport.importIptcMediaTopics` (mock scheduler in test).
- [ ] **Step 2:** implement thin wrappers calling existing internal logic (refactor shared search into callable helper if needed — avoid duplicating search body).
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(cms): admin catalog queries and IPTC import trigger`.

---

### Task 2: Développeur tab shell (frontend-design)

**Files:** `admin-shell.tsx`, `dashboard.tsx`, `developer-tab.tsx` (skeleton).

- [ ] **Invoke `frontend-design`** — editorial CMS aesthetic matching existing shell (Newsreader/Hanken, accent brick, card layout).
- [ ] Add `developer` to `CMS_TABS` / nav as **« Développeur »** (icon e.g. `⬡`).
- [ ] Wire `Dashboard` to render `DeveloperTab` when active; support `?tab=developer` URL param like other tabs.
- [ ] Skeleton: page title, import section placeholder, search placeholder.
- [ ] **Commit** — `feat(cms): add Développeur tab shell`.

---

### Task 3: Import IPTC panel

**Files:** `developer-tab.tsx`; use `triggerIptcImport`, `getCategoryCatalogStats`.

- [ ] Import button → `triggerIptcImport` → loading state → refresh stats on success.
- [ ] Show stats: total active catalog nodes; empty state CTA when `total === 0`.
- [ ] Error surface (network / IPTC fetch fail) with retry.
- [ ] Note: import runs async via scheduler — poll stats or show « import en cours… » until count increases (simple interval or re-query on focus acceptable for dev tab).
- [ ] **Commit** — `feat(cms): IPTC import panel in Développeur tab`.

---

### Task 4: Catalog search + add to tenant (frontend-design)

**Files:** `catalog-search-results.tsx`, `developer-tab.tsx`.

- [ ] Search input (debounced ~300ms) → `searchCategoryCatalogForCms`; when empty, show `listCategoryCatalogRootsForCms` as L1 chips (hybrid entry).
- [ ] Results: indented list by `depth` (label + externalId muted); each row:
  - **Ajouter** → `addCategoryFromCatalog({ catalogNodeId, includeDescendants: false })`
  - **Ajouter avec dérivés** → `includeDescendants: true`
- [ ] Toast/inline feedback: `{ created, skipped }` from mutation.
- [ ] Already-in-tenant hint: compare slug or `catalogNodeId` against `listCmsCategories` (client-side badge « Déjà dans le tenant »).
- [ ] **Commit** — `feat(cms): catalog search and add-to-tenant in Développeur tab`.

---

### Task 5: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` → PASS.
- [ ] **Manual CMS smoke:** Développeur → Import → search « econom » → add with descendants → Catégories tab shows new entries → mobile Settings interests lists them.
- [ ] `git status --short` clean.

---

## Self-Review

- **No CLI required** for import — full flow testable in CMS.
- **Search-first** — no flat 1200-node list.
- **Tenant taxonomy** updated via existing `addCategoryFromCatalog` — mobile picks up via `listCategoryOptions` without mobile changes.
- **Slice L** reuses same search/orbit UX pattern on tenant tree for members.

## After This Slice

- **Slice L** — mobile Settings: search + L1 roots + orbital cloud (3 levels) on `searchTenantCategories` / `listTenantCategoryChildren`.
- Optional: catalog resync cron; custom platform nodes in catalog.
