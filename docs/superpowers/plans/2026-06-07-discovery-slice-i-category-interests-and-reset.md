# Discovery Slice I — Choix de catégories (Réglages) + branchement taxonomie + reset

> **Letter nomenclature** (parallel numeric slices). Implements ADR 0006 (use the tenant taxonomy as source of truth) — **the taxonomy already exists**, so this slice *wires* it, it doesn't build it. Builds on A–H. Branch from `feat/discovery-slice-h-breadth` (or `dev` once merged).

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Vitest-first for `convex/**`, Jest-first for `app/`+`src/`. UI task → invoke `frontend-design`. Read `convex/_generated/ai/guidelines.md` before `convex/`. Steps use `- [ ]`.

**Why / what already exists:** the tenant-managed `Category` taxonomy is **already built** — `categories` table (`tenantSlug`, `label`, `slug`, `iconKey`, `sortOrder`), CMS CRUD (`convex/cms/categories.ts`, `apps/cms/.../category-list.tsx`), and a public picker query `convex/categories/queries.ts:listCategoryOptions`. So this slice delivers the **"vrai flow"** with minimal new model: **a fresh `Member` (no affinities) picks categories in Settings → the feed is personalized from the first scroll**, independently of what content/categories already exist.

**The point is personalization, not content cleanup.** We do **NOT** wipe the corpus — the pre-fix junk tags dilute on their own as clean content keeps arriving. "Starting from zero" means **the member's preferences are empty** (a brand-new user), so the only test reset is **member-scoped** (clear my affinities), never the corpus.

**Generic / white-label:** the picker shows **the tenant's own categories** (whatever they defined). Provider-agnostic. No onboarding flow yet — the picker lives in **Settings** as a stand-in.

**End-to-end proof:** as a fresh `Member` (no affinities) → open Settings → pick e.g. "Science" + "Philosophie" → Discover surfaces those categories first immediately. The corpus is untouched.

---

## Read First

- `docs/adr/0006-tenant-managed-category-taxonomy.md` — the decision; **note the taxonomy already exists**, supersede `discoverySeedCategories`.
- **Existing taxonomy to REUSE (do not rebuild):** `convex/schema.ts` (`categories` table), `convex/categories/queries.ts` (`listCategoryOptions`, `listPublishedCategories`), `convex/categories/model.ts`, `convex/cms/categories.ts` (CRUD), `src/features/categories/*` (icons, presentation), `apps/cms/components/cms/category-list.tsx`.
- Discovery wiring: `convex/discovery/ingest.ts` (`getTenantIngestionInputs` reads `tenant.discoverySeedCategories` today), `convex/discovery/fetchDemand.ts`, `convex/discovery/scoring.ts` (`normalizeScoringKey`, affinity model), `convex/discovery/interactions.ts`.
- Settings surface: the mobile Settings screen (where palette selection lives) + `src/i18n/locales/{en,fr}/settings.ts`.
- `convex/_generated/ai/guidelines.md`, `CLAUDE.md`.

Standing rules: no hardcoded colors (tokens + `withAlpha`, `midnight`); responsive; modular i18n; remove dead code in the same change.

---

## Scope Guard

Includes:

- **Fresh-member reset (testing):** clear the **current member's** `userPreferences` + `contentInteractions` so a tester can experience the feed as a brand-new user. **Does NOT touch the corpus** (content is left to dilute on its own — this slice is about personalization, not content cleanup). Useful as a real "reset my personalization" feature too.
- **Discovery sources seeds from the taxonomy:** `getTenantIngestionInputs` reads the tenant's `categories` table (the managed taxonomy) instead of `discoverySeedCategories`. Ensure the demo tenant's `categories` has a sensible default list (seed if empty).
- **Category-interest mutation:** `setCategoryInterests({ tenantSlug, categoryKeys })` upserts the `Member`'s `userPreferences` category affinities (seed score), **idempotent** (re-picking sets, never stacks; reuse the clamp/projection discipline). Unpicking removes them.
- **Settings picker (Member):** a Settings entry → a screen listing `listCategoryOptions` (label + icon, tenant order), multi-select reflecting current interests, writing via `setCategoryInterests`.

Does **not** include:

- A dedicated onboarding flow (the picker lives in Settings for now).
- CMS taxonomy changes (CRUD already exists).
- Hard FK from `contents.category` to a category id (stays a normalized key match).
- Auto-running ingestion from the reset (run manually after).

---

## File Structure

- `convex/discovery/reset.ts` (+ test) — `resetMyDiscoveryPreferences` (member-scoped: clears the caller's `userPreferences` + `contentInteractions`; never the corpus).
- `convex/discovery/ingest.ts` — `getTenantIngestionInputs` reads `categories` table for seeds (replace `discoverySeedCategories`).
- `convex/categories/interests.ts` (+ test) — `setCategoryInterests` mutation; maybe `getMyCategoryInterests` query for the picker's current state.
- `convex/tenants/seed.ts` — ensure a default `categories` list for the demo tenant.
- `app/(app)/settings/...` — Settings entry + category picker screen; `src/features/categories/use-category-interests.ts`.
- `src/i18n/locales/{en,fr}/settings.ts` — strings.
- Tests: `convex/discovery/reset.test.ts`, `convex/categories/interests.test.ts`, `__tests__/category-interests-picker.test.tsx`.

---

### Task 1: Fresh-member reset (Vitest-first)

**Files:** `convex/discovery/reset.ts`; `convex/discovery/reset.test.ts`.

- [ ] **Step 1 (Vitest, convex-test):** `resetMyDiscoveryPreferences` (a `mutation` on the authenticated identity) deletes the caller's `userPreferences` + `contentInteractions`; **leaves all `contents` (corpus) and other members' data untouched**. Guest → no-op. Returns counts.
- [ ] **Step 2:** implement (member-scoped via `ctx.auth.getUserIdentity()`).
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): reset my discovery preferences (member-scoped)`.

---

### Task 2: Discovery seeds from the taxonomy (Vitest-first)

**Files:** `convex/discovery/ingest.ts`; `convex/tenants/seed.ts`; tests.

- [ ] **Step 1 (Vitest):** `getTenantIngestionInputs` returns seed categories from the tenant's `categories` table (normalized via `normalizeScoringKey`), not `discoverySeedCategories`. Empty taxonomy → empty seeds (cold start handled by `FetchDemand`).
- [ ] **Step 2:** implement; seed the demo tenant's `categories` with a sensible default list. Keep `discoverySeedCategories` out of the path (note its removal/deprecation).
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): seed ingestion from the tenant category taxonomy`.

---

### Task 3: Category-interest mutation (Vitest-first)

**Files:** `convex/categories/interests.ts`; `convex/categories/interests.test.ts`.

- [ ] **Step 1 (Vitest, convex-test):** `setCategoryInterests({ tenantSlug, categoryKeys })` upserts `userPreferences` (targetType `category`, normalized key, a seed score) for the member; re-calling with the same set is **idempotent** (no score inflation); removing a key drops that affinity. Guest → no-op. A `getMyCategoryInterests` query returns the current picked set.
- [ ] **Step 2:** implement, reusing `normalizeScoringKey` + the clamp discipline from `scoring.ts`.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(categories): member category-interest affinities`.

---

### Task 4: Settings category picker (Jest-first + `frontend-design`)

**Files:** Settings screen + entry; `src/features/categories/use-category-interests.ts`; `src/i18n/locales/{en,fr}/settings.ts`; `__tests__/category-interests-picker.test.tsx`.

- [ ] **Invoke `frontend-design`** for the picker (chips/cloud of categories with icons, selected state).
- [ ] **Step 1 (Jest, TDD):** the Settings entry opens a picker listing `listCategoryOptions` (label + icon, tenant order); current interests are pre-selected (`getMyCategoryInterests`); toggling a category calls `setCategoryInterests`; guest sees a sign-in affordance, no write.
- [ ] **Step 2:** implement; tokens only; modular i18n.
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(settings): category interests picker`.

---

### Task 5: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` → PASS.
- [ ] Hardcoded-color scan clean on changed mobile files.
- [ ] **Live smoke** (dev): `resetMyDiscoveryPreferences` (or a fresh member) → no affinities → Settings → pick Science + Philosophie → Discover surfaces those first (corpus untouched); unpick → affinity drops; `midnight` + iPad.
- [ ] `git status --short` clean.

---

## Self-Review

- **Reuses the existing taxonomy** (`categories` table + CMS CRUD + `listCategoryOptions`) — no model rebuild.
- **The "vrai flow":** a fresh member → pick interests in Settings → personalized feed from the first scroll. The corpus is untouched (this slice is personalization, not content cleanup).
- Discovery now seeds from the **tenant taxonomy** (ADR 0006), not the ad-hoc `discoverySeedCategories`.
- Interests are idempotent affinities (no inflation); guest writes nothing.
- Generic / white-label: the picker shows the tenant's own categories.

## After This Slice

- A real **onboarding flow** (the cloud with sub-category drill-down) — promote the Settings picker into first-run.
- Frontier promotion (ADR 0005 step 3) + graph/vector (step 4).
- Backlog: imageBoost, CMS pagination + provider filter, developer-level module-enable meta layer.
