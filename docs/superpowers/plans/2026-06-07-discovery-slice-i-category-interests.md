# Discovery Slice I — Intérêts de catégories (Réglages) → feed personnalisé

> **Letter nomenclature** (parallel numeric slices). Implements ADR 0006 by wiring the **already-existing** tenant `Category` taxonomy into a member-facing picker. Builds on A–H. Branch from `feat/discovery-slice-h-breadth` (or `dev` once merged).

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Vitest-first for `convex/**`, Jest-first for `app/`+`src/`. UI task → invoke `frontend-design`. Read `convex/_generated/ai/guidelines.md` before `convex/`. Steps use `- [ ]`.

**Goal:** the `Member` picks categories in Settings, and those picks gain **preponderance** in two places: (1) the **feed ranking** (a distinct interest dimension, on top of the existing like/interaction affinities) and (2) **what gets fetched** (the picked categories steer ingestion). **Existing preferences are KEPT** — picks are an *additional* layer, not a replacement; unpicking a category never erases what the member has liked. Changing the selection **reloads the feed** so the effect is immediate.

**No reset / no wipe.** We do not clear preferences, interactions, or the corpus. Likes already recorded stay and blend with the picked interests for stronger, faster personalization from the first load.

**Reuse, don't rebuild:** the tenant taxonomy already exists — `categories` table (`tenantSlug`, `label`, `slug`, `iconKey`, `sortOrder`), CMS CRUD (`convex/cms/categories.ts`), and a public picker query `convex/categories/queries.ts:listCategoryOptions`.

**Generic / white-label:** the picker shows **the tenant's own categories**. No onboarding flow yet — the picker lives in **Settings** as a stand-in.

**End-to-end proof:** existing member (with some likes) → Settings → pick "Science" + "Philosophie" → the feed **immediately reloads** with those categories on top; over the next refills, more Science/Philosophie content is fetched; unpick one → it loses its boost but liked content stays.

---

## Read First

- `docs/adr/0006-tenant-managed-category-taxonomy.md` — taxonomy is the source of truth; **it already exists**, supersede `discoverySeedCategories`.
- **Existing taxonomy to REUSE:** `convex/schema.ts` (`categories` table), `convex/categories/queries.ts` (`listCategoryOptions`), `convex/categories/model.ts`, `convex/cms/categories.ts`, `src/features/categories/*` (icons), `apps/cms/components/cms/category-list.tsx`.
- Discovery internals: `convex/discovery/scoring.ts` (`scoreContent`, `normalizeScoringKey`, affinity model — **add an interest boost here**), `convex/discovery/feed.ts` (loads affinities — **also load interests**), `convex/discovery/fetchDemand.ts` + `convex/discovery/ingest.ts` (`getTenantIngestionInputs` — **fold interests into the demand**), `src/features/discovery/use-discovery-feed.ts` (`refresh()` already bumps `feedSeed`).
- Settings surface: the mobile Settings screen (where palette selection lives) + `src/i18n/locales/{en,fr}/settings.ts`.
- `convex/_generated/ai/guidelines.md`, `CLAUDE.md`.

Standing rules: no hardcoded colors (tokens + `withAlpha`, `midnight`); responsive; modular i18n; remove dead code in the same change.

---

## Scope Guard

Includes:

- **Category interests storage** — a member-scoped set of picked category keys (a `categoryInterests` table, member + tenant + normalized key). **Distinct from `userPreferences`** so it never collides with interaction affinities.
- `setCategoryInterests({ tenantSlug, categoryKeys })` + `getMyCategoryInterests({ tenantSlug })`. Idempotent (set, not stack); unpicking removes only the interest. Guest → no-op.
- **Feed preponderance:** `scoreContent` adds an **interest boost** when a content's category (or a tag) is in the member's interests — a distinct dimension layered on top of the existing affinities, which are **kept**.
- **Fetch preponderance:** the picked categories are folded into the ingestion `FetchDemand` (alongside aggregated affinities + the taxonomy seeds) so picked categories get fetched. Discovery seeds from the `categories` taxonomy (replacing `discoverySeedCategories`, ADR 0006).
- **Settings picker (Member):** lists `listCategoryOptions` (label + icon, tenant order), pre-selects current interests, writes via `setCategoryInterests`, and **reloads the feed on change** (the hook's `refresh()`).

Does **not** include:

- Any reset/wipe of preferences, interactions, or the corpus (explicitly out — picks are additive).
- A dedicated onboarding flow (picker lives in Settings for now).
- CMS taxonomy CRUD (already exists).
- Hard FK from `contents.category` to a category id (stays a normalized-key match).

---

## File Structure

- `convex/schema.ts` — add `categoryInterests` table (member + tenantSlug + categoryKey; index by member).
- `convex/categories/interests.ts` (+ test) — `setCategoryInterests`, `getMyCategoryInterests`.
- `convex/discovery/scoring.ts` (+ test) — `scoreContent` interest boost.
- `convex/discovery/feed.ts` (+ test) — load the member's interests, pass to scoring.
- `convex/discovery/ingest.ts` / `fetchDemand.ts` — fold interests + taxonomy seeds into the demand.
- `convex/tenants/seed.ts` — ensure the demo tenant's `categories` has a sensible default list.
- Settings screen + entry; `src/features/categories/use-category-interests.ts`; `src/i18n/locales/{en,fr}/settings.ts`.
- Tests: `convex/categories/interests.test.ts`, `convex/discovery/{scoring,feed}.test.ts` (extend), `__tests__/category-interests-picker.test.tsx`.

---

### Task 1: Category interests storage (Vitest-first)

**Files:** `convex/schema.ts`; `convex/categories/interests.ts`; `convex/categories/interests.test.ts`.

- [ ] **Step 1 (Vitest, convex-test):** `setCategoryInterests({ tenantSlug, categoryKeys })` stores the member's picked keys (normalized); re-calling replaces the set (idempotent, no duplicates); unpicking removes those rows and **leaves `userPreferences` + `contentInteractions` untouched**. `getMyCategoryInterests` returns the current set. Guest → no-op.
- [ ] **Step 2:** add the `categoryInterests` table + implement the mutations/query (member via `ctx.auth`).
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(categories): member category interests storage`.

---

### Task 2: Feed preponderance — interest boost (Vitest-first)

**Files:** `convex/discovery/scoring.ts`; `convex/discovery/feed.ts`; tests.

- [ ] **Step 1 (Vitest):** `scoreContent(content, affinities, now, { interestCategories })` adds a strong boost when `content.category` (or a tag) is in `interestCategories`; with no interests it behaves exactly as today (existing affinities preserved); a content matching both a like-affinity and an interest ranks highest.
- [ ] **Step 2:** `feed.ts` loads the member's interests (`getMyCategoryInterests` logic) and passes them to `scoreContent`. Affinities from interactions are still loaded and combined.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): boost picked-category interests in the feed`.

---

### Task 3: Fetch preponderance — interests steer ingestion (Vitest-first)

**Files:** `convex/discovery/ingest.ts`; `convex/discovery/fetchDemand.ts`; `convex/tenants/seed.ts`; tests.

- [ ] **Step 1 (Vitest):** `getTenantIngestionInputs` sources seed categories from the `categories` taxonomy (not `discoverySeedCategories`) and includes the tenant's members' **picked interest categories** in the demand; `computeFetchDemand` keeps them bounded (caps + diversity intact). Empty taxonomy + no interests → cold start as today.
- [ ] **Step 2:** implement; seed the demo tenant `categories` default list; keep `discoverySeedCategories` out of the path.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): picked categories steer ingestion demand`.

---

### Task 4: Settings picker + reload on change (Jest-first + `frontend-design`)

**Files:** Settings screen + entry; `src/features/categories/use-category-interests.ts`; `src/i18n/locales/{en,fr}/settings.ts`; `__tests__/category-interests-picker.test.tsx`.

- [ ] **Invoke `frontend-design`** (chips/cloud of categories with icons + selected state).
- [ ] **Step 1 (Jest, TDD):** the Settings entry opens a picker listing `listCategoryOptions` (label + icon, tenant order); current interests pre-selected; toggling calls `setCategoryInterests` **and triggers a feed reload** (the Discover hook's `refresh()` / a shared invalidation); guest sees a sign-in affordance, no write.
- [ ] **Step 2:** implement; tokens only; modular i18n. Ensure changing interests reloads Discover next time it's shown (e.g. bump a shared `feedSeed`/key).
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(settings): category interests picker, reloads the feed`.

---

### Task 5: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` → PASS.
- [ ] Hardcoded-color scan clean on changed mobile files.
- [ ] **Live smoke** (dev): existing member with some likes → Settings → pick Science + Philosophie → Discover reloads with them on top; existing liked content still present; unpick one → boost gone, likes intact; over a refill, more picked-category content arrives; `midnight` + iPad.
- [ ] `git status --short` clean.

---

## Self-Review

- **Additive, not destructive:** picks are a distinct interest layer; existing affinities/interactions are kept. Unpicking never erases likes.
- **Two preponderances:** picked categories boost the feed ranking AND steer ingestion.
- **Immediate:** changing interests reloads the feed.
- **Reuses the existing taxonomy** (table + CMS CRUD + `listCategoryOptions`); discovery now seeds from it (ADR 0006).
- Generic / white-label: the picker shows the tenant's own categories; guest writes nothing.

## After This Slice

- A real **onboarding flow** (cloud + sub-category drill-down) — promote the Settings picker into first-run.
- Frontier promotion (ADR 0005 step 3) + graph/vector (step 4).
- Mobile/UI + config backlog (see `docs/superpowers/backlog.md`).
