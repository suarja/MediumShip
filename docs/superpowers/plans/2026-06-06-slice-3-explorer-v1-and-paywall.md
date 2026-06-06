# Slice 3 — Explorer V1 + Contextual Paywall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `Explore` from a static scaffold into the real discovery surface — public multi-type search, derived categories, collections index/detail, agenda list + event detail, and a community surface — and introduce the single **contextual paywall bottom-sheet** that opens whenever a guest/non-member taps a premium capability (offline, lists, members-room, support). One coherent discovery + monetization vertical.

**Architecture:** Public-first. Search and categories run on the existing `contents` table (real data now). Collections and Agenda surfaces are built against a **typed data seam** (`useCollections()` / `useEvents()` hooks) that is fixture-backed in this slice and swapped to Convex queries in Slice 4 with **zero UI change** — the hook return shapes are the contract. The paywall is a themed RN `Modal` + `Animated` sheet behind a root `PaywallSheetProvider`; it reuses the existing guest-first / no-self-serve rule from `PremiumPaywall` and reads membership only through the stable `useIsMember` API. No new heavy dependency (`@gorhom/bottom-sheet` / reanimated / gesture-handler are not added).

**Tech Stack:** Expo Router, React Native (`Modal` + `Animated`), TypeScript, Convex React (search index + public query), Clerk Expo, i18next, Jest, React Native Testing Library

---

## Read First (standard plan header — always)

- `docs/agents/mockup-to-code-map.md` — CSS-var→token map, the `styles.css` = precise spec / `.jsx` = structure+copy rule, `.phone--lg`→`isTablet`, reusable shell patterns (`topBar`/`topBarSide`/`topBarAction`, `Screen`, `useResponsive`, `useTabBarSpace` + `usePersistentMediaPlayerSpace`), guest-first data hooks, i18n conventions, and the time-sink traps.
- `docs/agents/ui-visual-testing.md` — Expo-web + headless-Chrome pixel protocol for the final visual pass (phone 390 / iPad 834); auth-gated + `midnight` are manual.
- `docs/plans/2026-06-05-media-prototype-planning-slides.md` — Slide 6 (Explorer + Search), Slide 9 (Paywall), Slide 10 (Collections), Slide 12 (Agenda), Slide 13 (Communauté), Slide 14 (Search/catégories/taxonomie).
- `docs/superpowers/plans/2026-06-06-slice-1-mobile-shell-convergence.md`, `…-slice-2-…`, `…-slice-2_5-…`
- Mockup: `docs/podapp/project/mobile-mockups/proto-screens.jsx` — `ExploreRoot` (~101–142), `CategoryView`, `CollectionsView`/collection detail, `EventsView`/event detail, `CommunityView` (~560–593), `PaywallSheet` (595–624). `styles.css` for the `.proto-top`, `.search`, grid/card, `.comm__card`, `.sheet__*` specs.
- Existing code to reuse: `app/(app)/explore.tsx`, `convex/content/queries.ts` (`listPublishedFeed`, `getPublishedById`), `convex/schema.ts` (`contents`), `src/features/content/selectors.ts`, `src/components/content/feed-row.tsx`, `src/features/membership/{use-is-member,premium-gate}.ts`, `src/components/content/premium-paywall.tsx`, `src/components/content/content-actions-bar.tsx`, `app/_layout.tsx`, `src/features/media/persistent-media-player.tsx` (provider+overlay pattern), `src/features/tenant/public-config.ts`, `src/i18n/{resources,locales}`.
- `CLAUDE.md`

Standing rules for every task below:
- **Never hardcode colors** — tokens via `useAppTheme()` + `withAlpha`; verify in `midnight`. **Responsive everywhere** via `useResponsive()` (cap+center on tablet). Fonts from `fontFamilies`.
- **Modular i18n** — new namespaces per feature (`paywall`, plus extend `explore`); never one monolith. FR follows the file's existing ASCII convention; plurals `_one`/`_other`.
- Read `convex/_generated/ai/guidelines.md` before touching `convex/`.
- Use the `frontend-design` skill for new surfaces.

## Scope Guard

Includes:

- **Paywall**: root `PaywallSheetProvider` + `usePaywallSheet()`, themed responsive bottom-sheet with `content|offline|lists|members|support` variants, pure reason→copy mapping, `paywall` i18n namespace; wired to offline (content-actions-bar), lists (Library), support (Profile "Passer Premium" + guest), members (community card in this slice).
- **Explore search**: Convex search index on `contents` + public `searchPublished` query; debounced UI, results list (reusing `feed-row`), `all/articles/podcasts/videos` filters.
- **Categories**: public `listPublishedCategories` (derived from `contents.category`, with counts); tappable category → filtered results.
- **Collections**: index + detail mobile surfaces against the `useCollections()` seam (fixture-backed this slice).
- **Agenda**: list + simple event detail against the `useEvents()` seam (fixture-backed this slice); filters `à venir / en ligne / local`.
- **Community**: hero + Discord (free) card + members-room (premium) card → `openPaywall("members")`, from tenant/module config.
- Tests for: paywall (pure copy, provider, one trigger), search query (Convex unit/`runOneoffQuery`-style or hook test), Explore screen sections, collections/agenda surfaces, community.

Does **not** include:

- the `collections`/`events` **Convex schema + public queries** (Slice 4 — this slice consumes the seam hooks; S4 swaps fixture→Convex behind the same hook return shapes)
- module **system** / capability config plumbing (Slice 4)
- CMS authoring (Slice 5), avatar edit (Slice 5)
- any real purchase/billing (no self-serve membership — guest→sign-in, member-pending note)
- changing the entitlement read path / `useIsMember`
- replacing the inline `PremiumPaywall` on article/episode/video detail (full-content gate stays; sheet is for capability taps)
- adding `@gorhom/bottom-sheet`/reanimated/gesture-handler; advanced search ranking; external search providers

---

## Data seam contract (collections + events)

Define the types now; Slice 4 makes the Convex queries return exactly these.

```ts
// src/features/collections/types.ts
export type Collection = {
  _id: string; slug: string; title: string; summary: string;
  coverImageUrl?: string; itemCount: number;
};
export type CollectionDetail = Collection & { items: Array<{ contentId: string; title: string; kind: "article"|"episode"|"video"; category: string; isPremium: boolean; coverImageUrl?: string }> };

// src/features/events/types.ts
export type AppEvent = {
  _id: string; title: string; summary: string; startsAt: string; locationLabel: string;
  mode: "online"|"offline"|"hybrid"; access: "free"|"member"|"premium"; status: "scheduled"|"archived";
  coverImageUrl?: string; ctaLabel?: string; ctaUrl?: string; communityUrl?: string; descriptionLong?: string;
};
```

`useCollections()` → `{ collections: Collection[]; isLoading: boolean }`; `useCollection(id)` → `{ collection?: CollectionDetail; isLoading }`; `useEvents(filter)` → `{ events: AppEvent[]; isLoading }`; `useEvent(id)` → `{ event?: AppEvent; isLoading }`. In this slice they return fixture data from `src/features/{collections,events}/fixtures.ts` (mirrors the mockup copy). Mark each hook file with a one-line `// Slice 3: fixture-backed. Slice 4 swaps the body to a Convex query; the return shape is the contract — do not change it here.`

---

### Task 1: Contextual paywall — pure copy + i18n + sheet + provider

**Files:** create `src/features/paywall/paywall-copy.ts`, `src/features/paywall/paywall-sheet-provider.tsx`, `src/components/paywall/paywall-sheet.tsx`, `src/i18n/locales/{en,fr}/paywall.ts`; modify `src/i18n/resources.ts`, `app/_layout.tsx`. Tests: `__tests__/paywall-copy.test.ts`, `__tests__/paywall-sheet.test.tsx`.

- [ ] **Step 1 (pure mapping, TDD):** `PaywallReason = "content"|"offline"|"lists"|"members"|"support"`; `resolvePaywallCopyKeys(reason)` → `{ eyebrow,title,description }` keys (`reasons.<r>.*`), unknown→`support`. Test first (fail → implement → pass).
- [ ] **Step 2 (i18n):** add `paywall` namespace (en+fr) — per-reason eyebrow/title/description, shared `benefits[]`, `signInCta`, `dismissCta`, `pendingTitle`, `pendingBody`, `crestFallback`. Reuse tone from existing `premium.ts`. Register in `resources.ts`.
- [ ] **Step 3 (sheet UI, TDD):** `PaywallSheet({ visible, reason, isSignedIn, onDismiss })` — RN `Modal` transparent, `Animated` slide-up card, `withAlpha` dim backdrop (tap → dismiss), grab handle, crest, eyebrow `◉ …`, headline, description, benefits checklist, then CTA block: guest → `Link href="/sign-in"` primary + ghost dismiss; signed-in non-member → pending note + ghost dismiss. Tokens + `useResponsive` (width cap/center on tablet) + safe-area bottom. `onRequestClose`→`onDismiss`. Test: offline title + benefits render; guest shows sign-in CTA, member shows pending note; dismiss hides.
- [ ] **Step 4 (provider):** `PaywallSheetProvider` exposing `openPaywall(reason)`/`closePaywall()`, holds `{visible,reason}`, reads `useClerkAuth().isSignedIn`, renders children + the sheet. `usePaywallSheet()` throws outside provider.
- [ ] **Step 5 (mount):** in `app/_layout.tsx` wrap the app frame with `PaywallSheetProvider` inside `PersistentMediaPlayerProvider` (alongside `PersistentMediaMiniPlayer`).
- [ ] **Step 6:** run paywall tests + `tsc` → PASS.
- [ ] **Step 7: Commit** — `feat: add contextual paywall bottom sheet`

---

### Task 2: Public multi-type search

**Files:** modify `convex/schema.ts` (search index), `convex/content/queries.ts` (`searchPublished`); create `src/features/search/use-search.ts`; modify `app/(app)/explore.tsx`. Test: a search-query test + Explore search UI test.

- [ ] **Step 1:** add a search index to `contents` (`searchIndex("search_title", { searchField: "title", filterFields: ["tenantSlug","status"] })`) — follow `convex/_generated/ai/guidelines.md` for the exact `defineTable(...).searchIndex(...)` form.
- [ ] **Step 2 (query, TDD):** `searchPublished({ tenantSlug, query })` → published contents matching the query (title search index; also include summary/category/tags via a post-filter on the candidate set). Returns the same shape `feed-row` consumes. Result type shaped to extend later with `collections`/`events` (return `{ contents: [...] }` so S4 can add keys). Keep it bounded to the active tenant + `status:"published"`.
- [ ] **Step 3 (hook):** `useSearch(query)` — debounced (~250ms), calls the query with `"skip"` while empty; returns `{ results, isSearching }`.
- [ ] **Step 4 (UI):** make the Explore search card a real `TextInput` (themed, loupe icon at the 2.5 size). Below it, when there is a query: a results list via `feed-row`, with `all/articles/podcasts/videos` filter chips that actually filter the result set. Empty/no-result/loading states. Keep the rest of the Explore root (categories/modules/trends) when the query is empty.
- [ ] **Step 5:** tests (query behavior + UI renders results/filters) → PASS; `tsc` → PASS.
- [ ] **Step 6: Commit** — `feat: add public content search to explore`

---

### Task 3: Derived categories + category results

**Files:** modify `convex/content/queries.ts` (`listPublishedCategories`); create `src/features/categories/use-categories.ts`; add a category-results route or in-Explore drill-down; extend `explore` i18n. Test: categories query + UI.

- [ ] **Step 1 (query, TDD):** `listPublishedCategories({ tenantSlug })` → distinct `category` values among published contents with counts, ordered by count desc. (Slide 14: derived now; a dedicated `categories` table is a later option.)
- [ ] **Step 2 (UI):** the Explore "Catégories" grid renders the real categories (icon mapping kept from the current scaffold, label/count from the query). Tapping a category shows its filtered content list (reuse the search results list with a `category` filter, or push a lightweight `category/[name]` route reusing `feed-row`).
- [ ] **Step 3:** tests → PASS; `tsc` → PASS.
- [ ] **Step 4: Commit** — `feat: derive explore categories from published content`

---

### Task 4: Collections index + detail (seam)

**Files:** create `src/features/collections/{types,fixtures,use-collections}.ts`, `app/(app)/collections.tsx` (or `collection/[id].tsx` + an index), `src/components/collections/*`; extend `explore` i18n; wire the Explore "Collections" module card to the index. Test: collections surfaces.

- [ ] **Step 1:** define `types.ts` (see seam contract) + `fixtures.ts` (mirror mockup collections) + `useCollections`/`useCollection` (fixture-backed, contract-shaped, flagged for S4 swap).
- [ ] **Step 2 (TDD):** collections index (cards: cover, title, item count) and collection detail (header + attached content list via `feed-row`-style rows). Premium items show the premium tone; tapping a premium item for a non-member → `openPaywall("content")` (or routes to detail which shows the inline paywall — pick one, document it).
- [ ] **Step 3:** Explore "Collections" module card → push the index. Tests → PASS; `tsc` → PASS.
- [ ] **Step 4: Commit** — `feat: add collections index and detail (fixture seam)`

---

### Task 5: Agenda list + event detail (seam)

**Files:** create `src/features/events/{types,fixtures,use-events}.ts`, `app/(app)/agenda.tsx` + `app/event/[id].tsx`, `src/components/events/*`; extend `explore` i18n; wire the Explore "Agenda" category/module card. Test: agenda surfaces.

- [ ] **Step 1:** `types.ts` + `fixtures.ts` (mirror mockup events) + `useEvents(filter)`/`useEvent(id)` (fixture-backed, contract-shaped, flagged for S4).
- [ ] **Step 2 (TDD):** agenda list (date, title, format, access badge, location/link) with filters `à venir / en ligne / local`; event detail (header, description, practical info, access badge, primary CTA → open `ctaUrl`/`communityUrl`, or — for `member`/`premium` access on a non-member — `openPaywall("members"|"content")`). No calendar/RSVP/reminders (Slide 12 exclusions).
- [ ] **Step 3:** Explore "Agenda" entry → push the list. Tests → PASS; `tsc` → PASS.
- [ ] **Step 4: Commit** — `feat: add agenda list and event detail (fixture seam)`

---

### Task 6: Community surface + members-room paywall trigger

**Files:** create `app/(app)/community.tsx` + `src/components/community/*`; read links from tenant/module config (`src/features/tenant/public-config.ts`); extend i18n; wire Explore "Communauté" module card. Test: community screen.

- [ ] **Step 1 (TDD):** hero "Rejoindre la communauté", a free Discord card (opens external `communityUrl` from config), a premium "Salon membres" card. Bind link types to a schema-bounded `communityLinks` shape (`discord|telegram|whatsapp|newsletter`) read from config; if config is absent, render a sensible empty/disabled state (no hardcoded URLs).
- [ ] **Step 2:** the "Salon membres" card → `usePaywallSheet().openPaywall("members")` for non-members; for members, open the configured destination. This is the trigger deferred from the original thin paywall slice.
- [ ] **Step 3:** Explore "Communauté" module card → push community. Tests → PASS; `tsc` → PASS.
- [ ] **Step 4: Commit** — `feat: add community surface and members-room paywall trigger`

---

### Task 7: Wire the remaining paywall triggers

**Files:** modify `src/components/content/content-actions-bar.tsx`, `app/(app)/library.tsx`, `src/components/profile/profile-library-rows.tsx`, `app/(app)/profile.tsx`. Test: `__tests__/content-actions-paywall.test.tsx`.

- [ ] **Step 1 (TDD):** non-member offline/download tap → `openPaywall("offline")`, no download starts (bookmarks stay free/unchanged).
- [ ] **Step 2:** Library "Mes listes" entry → `openPaywall("lists")`. Profile non-member "Passer Premium" + any guest "Découvrir Premium" → `openPaywall("support")` (replacing the `router.push("/premium")` from Slice 2.5).
- [ ] **Step 3:** trigger test → PASS; `tsc` → PASS.
- [ ] **Step 4: Commit** — `feat: open the paywall from offline, lists, and support taps`

---

### Task 8: Verify the whole slice (standard verification — always)

- [ ] **Step 1 — slice + regression tests:** run the new suites plus `__tests__/{explore-screen,signed-in-library-screen,guest-library-screen,signed-in-profile,guest-profile,content-actions-bookmarks,app-tab-bar}.test.tsx`. Expected PASS.
- [ ] **Step 2 — TypeScript:** `npx tsc --noEmit` → PASS.
- [ ] **Step 3 — hardcoded-color scan:** grep hex/`rgba(` over every new file → none (tokens + `withAlpha` only).
- [ ] **Step 4 — visual pass** per `docs/agents/ui-visual-testing.md`: Expo web on a fresh port, screenshot `/explore`, `/agenda`, `/community`, collections index/detail at **390** and **834**; check single-line labels, no overflow, centered elements, loupe sizing, tablet cap/center. Leave the server running and hand the **signed-in** (search results, profile/library triggers, paywall variants) and **`midnight`** checks to the human with the test account. Note the PID.
- [ ] **Step 5:** `git status --short` clean (only intended files committed); report the leftover pre-existing `explore.tsx`/test working-tree changes if still present rather than sweeping them in.

---

## Self-Review

- Spec coverage: implements Slide 6/9/10/12/13/14 as one discovery+monetization vertical; search/categories/community/paywall are real on existing data, collections/agenda are real-UI on a typed seam swapped in Slice 4.
- Slice size: deliberately fat (one Explorer vertical + the paywall whose triggers live across it) to cut orchestration overhead — the reason these were merged out of two thin slices.
- Architecture honesty: stable entitlement read path untouched; no self-serve purchase; no new heavy dependency; the fixture seam is explicit and contract-shaped so Slice 4 is a pure data swap.
- Standards: every surface tokenized (+`midnight`) and responsive; modular i18n; visual protocol in the verification task.

## Next Slice After This One

**Slice 4 — Collections + Agenda + Module system:** `collections`/`collectionItems`/`events` Convex schema + public queries (swap the `useCollections`/`useEvents` seam bodies to Convex — no UI change), agenda filters server-side, and the module/capability config that drives which Explore modules render. Then **Slice 5 — CMS minimal + Avatar edit**.
