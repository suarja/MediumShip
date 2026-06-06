# Slice 5 — CMS Authoring + Avatar Edit + Capability Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is a large slice — review between tasks; tasks are independent enough to split across passes if needed.

**Goal:** Make the editorial backend authorable and the module system meaningful end-to-end: (1) a CMS to create/edit/reorder/publish **collections** and **events** on the same Convex backend; (2) mobile **avatar edit** via Clerk; (3) **wire the capability toggles** (bookmarks / progressSync / offline / personalLists / membersRoom) so the CMS switches actually gate mobile features.

**Architecture:** Mirror the existing content-authoring path (`createContent`/`updateContent`/`setContentStatus`, `requireCmsAdmin`, the `contents-tab`/`content-form` CMS components) for the Slice 4 `collections`/`events` tables. Avatar uses **Clerk `user.setProfileImage`** (the profile already reads `user.imageUrl` first), so no Convex/R2 avatar storage. Capability gating uses the **strict** `hasCapability` from Slice 4 — which means the default capability set must be added to `defaultTenant.enabledModules` and the seed, or wiring would disable features by default.

**Tech Stack:** Convex (CMS mutations/queries), Next.js (CMS UI), Clerk Expo (`setProfileImage`), expo-image-picker, Expo Router, React Native, TypeScript, Jest, Vitest + convex-test

---

## Read First (standard plan header — always)

- `docs/agents/mockup-to-code-map.md` — token map, `styles.css` spec, shell patterns, i18n + guest-first conventions, traps.
- `docs/agents/ui-visual-testing.md` — Expo-web + headless-Chrome pixel protocol; auth-gated + `midnight` manual. (CMS is a separate Next.js app — smoke it in a browser; auth-gated.)
- `convex/_generated/ai/guidelines.md` — read before touching `convex/`.
- `docs/plans/2026-06-05-media-prototype-planning-slides.md` — Slide 8 (Profil/avatar), Slide 11 (CMS collections), Slide 15 (modules/capabilities).
- `docs/superpowers/plans/2026-06-06-slice-4-collections-agenda-module-system.md` — the read model + module/capability helpers this slice builds on.
- Existing patterns to mirror: `convex/cms/{mutations,queries,authz}.ts` (`createContent`/`updateContent`/`setContentStatus`/`buildContentRecord`/`requireCmsAdmin`/`listContents`), `apps/cms/components/cms/{content-form,contents-tab,editorial-list,admin-shell,tenant-settings-form,r2-upload-field}.tsx`, `convex/collections/*`, `convex/events/*`, `convex/tenants/seed.ts`, `src/features/tenant/public-config.ts` (`hasCapability`, `CAPABILITIES`), `src/features/tenant/default-tenant.ts`, `src/features/theme/theme-provider.tsx` (exposes `enabledModules`), `src/components/content/content-actions-bar.tsx`, `src/features/media/persistent-episode-player.tsx` (`canSyncRemoteProgress`), `app/(app)/library.tsx`, `app/(app)/community.tsx`, `convex/users/{mutations,queries}.ts`, `src/components/profile/profile-identity.tsx`.
- `CLAUDE.md`

Standing rules: never hardcode colors (tokens + `withAlpha`, verify `midnight`); responsive via `useResponsive`; modular i18n; **test where the code lives** — Convex → Vitest/convex-test (`npm run test:convex`), RN/UI → Jest (`npm test`); reuse existing CMS + editia patterns before inventing.

## Scope Guard

Includes:

- CMS collections: admin queries (incl. drafts), `createCollection`, `updateCollection`, `setCollectionStatus`, `setCollectionItems` (reorder/add/remove), all `requireCmsAdmin`.
- CMS events: admin query, `createEvent`, `updateEvent`, `setEventStatus`.
- CMS UI: a Collections tab+form (with item picker + reorder) and an Events tab+form, mirroring the content tab/form; wired into `admin-shell`.
- Mobile avatar edit via Clerk `setProfileImage` + expo-image-picker, from the profile identity.
- Capability wiring: add default capabilities to `defaultTenant`/seed; gate `bookmarks`, `progressSync`, `offline`, `personalLists`, `membersRoom` on `hasCapability` across the mobile surfaces.
- Tests: Vitest for every new CMS mutation/query + the avatar mutation if any; Jest for the avatar edit surface and each capability gate.

Does **not** include:

- billing / self-serve membership; search over collections/events; a `categories`/`Module` table; CMS analytics.
- changing the public read queries (Slice 4) or the entitlement read path.
- storing avatars in Convex/R2 (Clerk is the source; `users.avatarUrl` stays a fallback only).

---

## File Structure

- `convex/cms/collections.ts` (or extend `convex/cms/mutations.ts`+`queries.ts`) — admin collection queries + create/update/setStatus/setItems mutations.
- `convex/cms/events.ts` (or extend) — admin event query + create/update/setStatus.
- `convex/cms/collections.test.ts`, `convex/cms/events.test.ts` — Vitest.
- `apps/cms/components/cms/collections-tab.tsx`, `collection-form.tsx`, `events-tab.tsx`, `event-form.tsx`; wire into `apps/cms/components/cms/admin-shell.tsx`.
- `src/features/tenant/default-tenant.ts` + `convex/tenants/seed.ts` — add default capabilities to the default module set.
- `src/components/profile/profile-identity.tsx` (+ a small `use-avatar-edit` hook) — tappable avatar → picker → Clerk `setProfileImage`.
- Capability gates: `src/components/content/content-actions-bar.tsx` (bookmarks, offline), `src/features/media/persistent-episode-player.tsx` (progressSync), `app/(app)/library.tsx` (personalLists, bookmarks), `app/(app)/community.tsx` (membersRoom), and any saved/stat surfaces.
- `package.json` — add `expo-image-picker`.
- Tests: `convex/cms/*.test.ts`; `__tests__/{avatar-edit,capability-gates}.test.tsx`.

---

### Task 1: CMS collections backend (Vitest-first)

**Files:** `convex/cms/collections.ts` (or extend cms modules); `convex/cms/collections.test.ts`.

- [ ] **Step 1 (Vitest):** failing specs for admin authz + behavior:
  - `listCmsCollections` returns all statuses (incl. draft/archived) for the tenant; rejects non-admin.
  - `createCollection({ title, slug, summary, coverImageUrl? })` inserts `status:"draft"`; slug unique per tenant.
  - `updateCollection` patches metadata.
  - `setCollectionStatus({ id, status })` flips draft↔published↔archived.
  - `setCollectionItems({ collectionId, contentIds: Id[] })` clears + re-inserts `collectionItems` with `order = index` (idempotent reorder; mirrors the seed). Rejects content from another tenant.
  - All guarded by `requireCmsAdmin`.
- [ ] **Step 2:** implement mirroring `buildContentRecord`/`createContent` patterns. Run Vitest → PASS.
- [ ] **Step 3: Commit** — `feat(cms): collection authoring mutations + admin queries`.

### Task 2: CMS events backend (Vitest-first)

**Files:** `convex/cms/events.ts`; `convex/cms/events.test.ts`.

- [ ] **Step 1 (Vitest):** `listCmsEvents` (all statuses, admin-only); `createEvent` (draft/scheduled), `updateEvent`, `setEventStatus`. Validate `mode`/`access` unions and ISO `startsAt`. Reject non-admin.
- [ ] **Step 2:** implement; Vitest → PASS.
- [ ] **Step 3: Commit** — `feat(cms): event authoring mutations + admin queries`.

### Task 3: CMS UI for collections + events

**Files:** `apps/cms/components/cms/{collections-tab,collection-form,events-tab,event-form}.tsx`; modify `admin-shell.tsx`.

- [ ] **Step 1:** mirror `contents-tab` + `content-form`: a list with status chips + "new", a form for metadata (use `r2-upload-field` for cover), status actions (publish/archive). For collections, an **item manager**: search published contents, add/remove, drag-or-arrow reorder → calls `setCollectionItems`.
- [ ] **Step 2:** add Collections + Events tabs to `admin-shell` navigation. Keep the existing CMS visual style.
- [ ] **Step 3:** manual smoke in the browser (admin-authed): create a collection, attach + reorder items, publish; create + publish an event; confirm they appear in the mobile app (public queries from Slice 4). Commit — `feat(cms): collections + events authoring UI`.

### Task 4: Mobile avatar edit (Clerk)

**Files:** `package.json` (+`expo-image-picker`), `src/components/profile/profile-identity.tsx` (+ optional `src/features/profile/use-avatar-edit.ts`); test `__tests__/avatar-edit.test.tsx`.

- [ ] **Step 1 (Jest, TDD):** test that tapping the avatar invokes the picker and, on a picked asset, calls Clerk `user.setProfileImage` (mock `@clerk/clerk-expo` `useUser`/`useClerk` and `expo-image-picker`). Assert a loading state and that a cancelled pick is a no-op.
- [ ] **Step 2:** add `expo-image-picker`. Make the `ProfileIdentity` avatar a `Pressable` with an edit affordance (small camera badge, tokens only). On press → `ImagePicker.launchImageLibraryAsync` → `user.setProfileImage({ file })` (Clerk Expo). The profile already reads `user.imageUrl` first, so the new avatar shows immediately. No Convex write (leave `users.avatarUrl` as the existing fallback).
- [ ] **Step 3:** Jest → PASS; `tsc` clean. Commit — `feat(profile): edit avatar via clerk image upload`.

### Task 5: Wire capabilities (strict — defaults first!)

**Files:** `src/features/tenant/default-tenant.ts`, `convex/tenants/seed.ts`; gate sites in `content-actions-bar.tsx`, `persistent-episode-player.tsx`, `library.tsx`, `community.tsx`; tests `__tests__/capability-gates.test.tsx`.

- [ ] **Step 1 (defaults — do this FIRST):** add the default-on capabilities to `defaultTenant.enabledModules` (`bookmarks`, `progressSync`, `offline`, `personalLists`, `membersRoom` — i.e. the full set, all on out of the box) and ensure the seed writes them. Without this, strict `hasCapability` would turn these features OFF by default. Re-run the seed.
- [ ] **Step 2 (gates, TDD per surface):** read `enabledModules` from `useAppTheme()` and gate via `hasCapability`:
  - `bookmarks` → ContentActionsBar bookmark pill + Library saved section / save affordances. When off, hide the bookmark action.
  - `progressSync` → `persistent-episode-player.tsx` `canSyncRemoteProgress = isAuthenticated && isMember && hasCapability(modules, "progressSync")`.
  - `offline` → ContentActionsBar offline/download (members) — when off, the offline pill opens the paywall or is hidden; downloads disabled.
  - `personalLists` → Library "Mes listes" entry.
  - `membersRoom` → Community members-room card.
  Each gate gets a Jest test (capability present → affordance shown; absent → hidden), using the `makeTheme(enabledModules)` mock pattern from `explore-modules.test.tsx`.
- [ ] **Step 3:** Jest + Vitest + `tsc` → PASS. Commit — `feat: gate bookmarks/offline/lists/members-room/progress on capabilities`.

### Task 6: Verify the whole slice (standard verification — always)

- [ ] **Step 1 — Convex tests:** `npm run test:convex` → PASS.
- [ ] **Step 2 — RN tests:** `npm test` → PASS (avatar + capability-gate suites + regression).
- [ ] **Step 3 — TypeScript:** `npx tsc --noEmit` and `npx tsc --noEmit -p convex` → PASS.
- [ ] **Step 4 — hardcoded-color scan:** none in changed mobile files.
- [ ] **Step 5 — manual smoke:**
  - CMS (browser, admin): create/edit/reorder/publish a collection; create/publish an event; toggle a capability off and a nav module off, save.
  - Mobile per `docs/agents/ui-visual-testing.md`: the new collection/event appear; the avatar edit works on a device/simulator (picker is interactive — manual); a disabled capability hides its affordance; verify `midnight`.
- [ ] **Step 6:** `git status --short` clean.

---

## Self-Review

- Spec coverage: closes the roadmap — collections/events are now authored (Slide 11), avatar is editable (Slide 8), and the module/capability config from Slide 15 actually drives mobile behavior end-to-end.
- Sequencing safety: capability defaults are added to `defaultTenant`/seed **before** gating, so strict `hasCapability` doesn't silently disable shipped features.
- Reuse: CMS authoring mirrors the proven content path; avatar reuses Clerk (already the avatar source) instead of new R2/Convex storage.
- Size: this is the largest remaining slice (two CMS entities + UI + avatar + multi-surface gating); tasks are independent, so split across passes if a single run gets heavy.
- Test policy: Convex authoring = Vitest/convex-test; avatar + gates = Jest.

## After This Slice

The fat-slice roadmap (S3 Explorer+Paywall, S4 Collections+Agenda+Modules, S5 here) is complete. Likely follow-ups: real billing/checkout on `/premium` (the membership surface the paywall points to), collection-search in Explore, and richer agenda/community.
