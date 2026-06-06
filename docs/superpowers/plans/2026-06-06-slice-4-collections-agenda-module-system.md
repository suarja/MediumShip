# Slice 4 — Collections + Agenda + Module System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Slice 3's Explorer surfaces a real backend. Add the Convex read model for editorial `collections` (with an ordered join) and `events`, swap the fixture-backed `useCollections`/`useEvents` seams to public Convex queries **without changing any UI**, move agenda filtering server-side, and introduce a schema-bounded **module system** so the tenant config decides which Explore modules (collections / agenda / community) render and which member capabilities are on.

**Architecture:** Public-first, guest-first. New tables `collections`, `collectionItems` (ordered join), `events`, all tenant- and status-scoped exactly like `contents`. Public queries return the **exact shapes the Slice 3 seam already defines** (`Collection`, `CollectionDetail`, `AppEvent`) so swapping the hook bodies is a pure data-source change. The module system is **config-based, not a new table** (per Slide 15's "bounded config" option): extend the existing `tenants.enabledModules` string array and add a navigation-modules + capabilities vocabulary in `public-config.ts`. CMS authoring for collections/events is **out of scope** (Slice 5); this slice ships the read model + a demo seed.

**Tech Stack:** Convex (schema, public queries, seed), Expo Router, React Native, TypeScript, i18next, Jest, Vitest + convex-test

---

## Read First (standard plan header — always)

- `docs/agents/mockup-to-code-map.md` — CSS-var→token map, `styles.css` = precise spec, reusable shell patterns, i18n + guest-first data conventions, traps.
- `docs/agents/ui-visual-testing.md` — Expo-web + headless-Chrome pixel protocol (phone 390 / iPad 834); auth-gated + `midnight` are manual.
- `convex/_generated/ai/guidelines.md` — **read before touching `convex/`** (object-form functions, validators, indexes, resource limits).
- `docs/plans/2026-06-05-media-prototype-planning-slides.md` — Slide 10 (Collections), Slide 11 (CMS collections — context only, authoring is Slice 5), Slide 12 (Agenda), Slide 14 (categories/taxonomy), **Slide 15 (Module model)**.
- `docs/superpowers/plans/2026-06-06-slice-3-explorer-v1-and-paywall.md` — the seam contract this slice fulfils.
- Existing code: `convex/schema.ts` (`contents`, `tenants.enabledModules`), `convex/content/queries.ts` (`listPublishedFeed` pattern), `convex/tenants/seed.ts` (`seedDemoContent`), `src/features/tenant/public-config.ts` (`ENABLED_MODULES`, `normalizeEnabledModules`), `src/features/collections/{types,fixtures,use-collections}.ts`, `src/features/events/{types,fixtures,use-events}.ts`, `app/(app)/explore.tsx` (module/category cards), `app/(app)/collections.tsx`, `app/(app)/agenda.tsx`, `app/event/[id].tsx`, `app/(app)/community.tsx`.
- `CLAUDE.md`

Standing rules: never hardcode colors (tokens + `withAlpha`, verify `midnight`); responsive via `useResponsive`; modular i18n; **test where the code lives** — Convex functions get **Vitest + convex-test** (`npm run test:convex`), UI/hooks get **Jest** (`npm test`); prefer existing Convex query patterns; reuse `../editia/web` Convex test patterns.

## The seam contract (must not drift)

The Slice 3 hooks define the shapes the new queries must return verbatim:

- `Collection` `{ _id, slug, title, summary, coverImageUrl?, itemCount }`
- `CollectionItem` `{ contentId, title, kind, category, isPremium, coverImageUrl? }`
- `CollectionDetail = Collection & { items: CollectionItem[] }`
- `AppEvent` `{ _id, title, summary, startsAt, locationLabel, mode, access, status, coverImageUrl?, ctaLabel?, ctaUrl?, communityUrl?, descriptionLong? }`
- `EventFilter = "upcoming" | "online" | "local"`

The four hooks (`useCollections`, `useCollection(id)`, `useEvents(filter)`, `useEvent(id)`) keep their exact signatures. Only their bodies change. **No collections/agenda/community UI file changes** beyond the hook swap.

## Scope Guard

Includes:

- Convex schema: `collections`, `collectionItems` (ordered), `events` — tenant + status scoped, indexed.
- Public queries: `listPublishedCollections`, `getPublishedCollectionById`, `listPublishedEvents` (filter server-side), `getPublishedEventById`.
- Demo seed extension so the Explorer surfaces show real data (mirror the retired fixtures).
- Swap the 4 seam hooks to Convex; remove the fixture modules once unused.
- Module system (config-based): extend `enabledModules` vocabulary (navigation modules + capabilities) in `public-config.ts`; Explore renders collections/agenda/community cards conditionally; routes guard on their module.
- Tests: Vitest for every new Convex query + the module-config helpers; Jest for Explore module gating and the swapped hooks.

Does **not** include:

- CMS authoring for collections/events (create/edit/reorder/publish) — **Slice 5**.
- avatar edit (Slice 5); billing/checkout; search over collections/events (search stays content-only from Slice 3 unless trivial).
- a dedicated `Module`/`categories` table — config-bounded only this slice (revisit if the CMS needs ordering/icons).
- changing the entitlement read path or any UI layout of the collection/agenda/community screens.

---

## File Structure

- `convex/schema.ts` — add `collections`, `collectionItems`, `events` tables + indexes.
- `convex/collections/queries.ts` — `listPublishedCollections`, `getPublishedCollectionById`.
- `convex/events/queries.ts` — `listPublishedEvents`, `getPublishedEventById`.
- `convex/collections/model.ts` / `convex/events/model.ts` — pure shaping/filter helpers (unit-testable, no ctx).
- `convex/tenants/seed.ts` — extend `seedDemoContent` to insert demo collections (+ items) and events.
- `convex/collections/queries.test.ts`, `convex/events/queries.test.ts` — Vitest + convex-test.
- `src/features/collections/use-collections.ts`, `src/features/events/use-events.ts` — swap bodies to `useQuery`; delete `fixtures.ts` once unreferenced.
- `src/features/tenant/public-config.ts` — add navigation-module + capability vocabulary + helpers (`isModuleEnabled`, `hasCapability`).
- `app/(app)/explore.tsx` — gate the collections/agenda/community module cards on enabled modules.
- `app/(app)/collections.tsx`, `app/(app)/agenda.tsx`, `app/(app)/community.tsx` — guard when their module is disabled (graceful empty/redirect); no layout change otherwise.
- `__tests__/explore-modules.test.tsx`, `__tests__/use-collections.test.tsx`, `__tests__/use-events.test.tsx`, `__tests__/public-config-modules.test.ts`.

---

### Task 1: Convex schema + pure model helpers

**Files:** `convex/schema.ts`, `convex/collections/model.ts`, `convex/events/model.ts`; tests `convex/collections/model.test.ts`, `convex/events/model.test.ts` (Vitest).

- [ ] **Step 1 (schema):** add tables (mirror `contents` conventions — `tenantSlug`, `status: draft|published|archived`, `slug`, indexes `by_tenant_and_status`, `by_tenantSlug_and_slug`):
  - `collections`: `tenantSlug, status, slug, title, summary, coverImageUrl?, updatedAt`.
  - `collectionItems`: `tenantSlug, collectionId: v.id("collections"), contentId: v.id("contents"), order: v.number()` — index `by_collection_and_order`.
  - `events`: `tenantSlug, status, slug, title, summary, startsAt (ISO string), locationLabel, mode (online|offline|hybrid), access (free|member|premium), coverImageUrl?, ctaLabel?, ctaUrl?, communityUrl?, descriptionLong?` — index `by_tenant_and_status`, and `by_tenant_and_startsAt` for ordering.
- [ ] **Step 2 (pure helpers, TDD):** `convex/events/model.ts` `filterEvents(events, filter, nowIso)` (upcoming: `startsAt >= now`; online: mode online|hybrid; local: offline|hybrid) and `sortByStartsAt`. `convex/collections/model.ts` `toCollectionSummary(doc, itemCount)` and `toCollectionItem(contentDoc)` shaping to the seam types. Vitest tests first (fail → implement → pass).
- [ ] **Step 3:** `npx tsc --noEmit -p convex` clean (test files are excluded). Commit — `feat(convex): add collections/events schema + pure model helpers`.

---

### Task 2: Public collection + event queries (Vitest-first)

**Files:** `convex/collections/queries.ts`, `convex/events/queries.ts`; tests `convex/collections/queries.test.ts`, `convex/events/queries.test.ts`.

- [ ] **Step 1 (Vitest):** write failing convex-test specs:
  - `listPublishedCollections({ tenantSlug })` → only `published`, each with correct `itemCount`, shaped as `Collection`.
  - `getPublishedCollectionById({ id })` → `CollectionDetail` with `items` ordered by `collectionItems.order`, each item joined from its `contents` doc and shaped as `CollectionItem`; drafts/archived content excluded.
  - `listPublishedEvents({ tenantSlug, filter })` → published+scheduled only, server-side `filterEvents`, sorted by `startsAt`.
  - `getPublishedEventById({ id })` → `AppEvent`.
  - guest identity works (all public, no auth required).
  Mirror `../editia/web` convex-test style; seed with `t.run`.
- [ ] **Step 2:** implement the queries on the indexes; reuse `getContentCoverImageUrl`-equivalent server logic for item covers (or store/derive `coverImageUrl`). Run Vitest → PASS.
- [ ] **Step 3:** Commit — `feat(convex): public collections + events read queries`.

---

### Task 3: Seed demo collections + events

**Files:** `convex/tenants/seed.ts`.

- [ ] **Step 1:** extend `seedDemoContent` to upsert a couple of demo collections (with ordered items referencing seeded contents) and several events spanning the three `mode`/`access` combinations and a past + future `startsAt`, mirroring the copy from the retired `src/features/{collections,events}/fixtures.ts`. Idempotent (match on `slug`).
- [ ] **Step 2:** run `npm run convex:seed` against the dev deployment; confirm via the Convex dashboard/data that rows exist. Commit — `chore(convex): seed demo collections and events`.

---

### Task 4: Swap the seams to Convex (no UI change)

**Files:** `src/features/collections/use-collections.ts`, `src/features/events/use-events.ts`; delete `fixtures.ts` files when unreferenced. Tests: `__tests__/use-collections.test.tsx`, `__tests__/use-events.test.tsx` (Jest).

- [ ] **Step 1 (Jest, TDD):** tests that mock `convex/react` `useQuery` and assert each hook returns the contract shape + `isLoading` semantics (undefined → loading; array/null → resolved), and that `useEvents(filter)` forwards the filter arg.
- [ ] **Step 2:** rewrite hook bodies to call `useQuery(api.collections.queries.…)` / `api.events.queries.…` with the active `tenantSlug`, mapping nothing (queries already return the shape). Keep signatures identical. Remove the `// Slice 3: fixture-backed` notes. Delete `fixtures.ts` once `grep` shows no references.
- [ ] **Step 3:** run the collections/agenda screen Jest suites (`collections-screen`, `agenda-screen`, plus the new hook tests) → PASS with **zero changes** to the screen components. `tsc` clean. Commit — `feat: back collections + agenda surfaces with Convex (seam swap)`.

---

### Task 5: Module system (config-bounded)

**Files:** `src/features/tenant/public-config.ts`; `app/(app)/explore.tsx`; `app/(app)/{collections,agenda,community}.tsx`. Tests: `__tests__/public-config-modules.test.ts`, `__tests__/explore-modules.test.tsx`.

- [ ] **Step 1 (pure helpers, TDD — Jest):** in `public-config.ts` add, per Slide 15, two bounded vocabularies kept in the existing `tenants.enabledModules` string array:
  - navigation modules: `collections`, `agenda`, `community` (alongside the existing content modules).
  - capabilities: `bookmarks`, `progressSync`, `offline`, `personalLists`, `membersRoom`.
  Add `isModuleEnabled(modules, name)` and `hasCapability(modules, cap)` (with sensible defaults — e.g. `bookmarks` on by default, `offline`/`personalLists`/`membersRoom` premium). Tests first.
- [ ] **Step 2 (Explore gating, Jest):** Explore renders the `collections` / `agenda` / `community` module cards only when their module is enabled; a test renders Explore with a restricted module set and asserts the disabled ones are absent, enabled ones present. Keep category cards (content-derived) as-is.
- [ ] **Step 3 (route guards):** `collections`/`agenda`/`community` screens render a graceful "module unavailable" state (or redirect home) when their module is disabled — never a crash. Use the existing config source already consumed by `home.tsx`/theme provider; do not add a new fetch path.
- [ ] **Step 4:** run module tests → PASS; `tsc` clean. Commit — `feat: gate explore modules + capabilities on tenant config`.

---

### Task 6: Verify the whole slice (standard verification — always)

- [ ] **Step 1 — Convex tests:** `npm run test:convex` → PASS (model helpers + queries).
- [ ] **Step 2 — RN tests:** `npm test` → PASS (new hook/module tests + full regression).
- [ ] **Step 3 — TypeScript:** `npx tsc --noEmit` and `npx tsc --noEmit -p convex` → PASS.
- [ ] **Step 4 — hardcoded-color scan:** none in any changed UI file (none expected — UI is largely untouched).
- [ ] **Step 5 — visual pass** per `docs/agents/ui-visual-testing.md`: screenshot `/collections`, `/agenda`, `/community` at 390 and 834 and confirm they now show **seeded data** (not fixtures) and that a restricted module set hides the right cards. Auth-gated premium-event access + `midnight` → manual. Note the server PID.
- [ ] **Step 6:** `git status --short` clean.

---

## Self-Review

- Spec coverage: Slide 10/12/14/15 — real collections + events read model, server-side agenda filtering, config-bounded module/capability system; CMS authoring deferred to Slice 5 as planned.
- Seam discipline: the four hooks keep their signatures and return shapes; the swap is a pure data-source change, so the Slice 3 UI is untouched and its tests still pass.
- Architecture honesty: module system is config-based (Slide 15's bounded option), not a premature table; capabilities route through helpers so a later `Module` table or CMS toggle is a localized change.
- Test policy: Convex logic is Vitest/convex-test, UI/hook logic is Jest — no duplication.

## Next Slice After This One

**Slice 5 — CMS minimal + Avatar edit:** Next.js CMS to create/edit/reorder/publish collections + events on the same Convex backend (Slide 11), the module toggles surfaced for editors, and the mobile avatar mutation (`users.avatarUrl`) with a simple edit surface.
