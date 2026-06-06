# Slice 6 — Content Discovery Engine (architecture spine)

> **This document is the architecture spine, not an execution plan.** It owns the hexagon, the canonical `Content` mapping, and the `Provider` / `ScoringPolicy` / `ScoringKey` / `ContentVisibility` specs. Execution is split into three **vertical** slices, each end-to-end testable, named with letters to avoid collision with the numeric slices other agents run in parallel:
>
> - `2026-06-06-discovery-slice-a-feed-read.md` — **Slice A**: Discover renders (guest-first, read-only).
> - `2026-06-06-discovery-slice-b-signals.md` — **Slice B**: Discover learns (interactions + personalization).
> - `2026-06-06-discovery-slice-c-card.md` — **Slice C**: reusable composable `ContentCard` (Découvrir first; Like/Favoris/⋯, non-destructive). The old "ambient signals + explanation" Slice C is deferred (see that file's backlog note).
>
> Slices A + B are the core; C is a deepening. Each references this spine for the deep specs and carries its own tasks + standard verification. The task list below remains the canonical reference for *what each module is*; the slice files decide *in which order and behind which end-to-end surface* the modules land.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement the slice files task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Content Discovery Engine on top of the existing CMS content: record user interaction signals, maintain weighted preference profiles, generate a scored discovery feed, and expose it in a new **Discover** tab gated behind a `"discover"` navigation module.

**Architecture (hexagonale, assumée — voir ADR 0003 + `CONTEXT.md` › Principes d'Architecture):** the Discovery Engine is built as ports & adapters from day one, because multi-source ingestion is a near-term certainty, not a hypothetical. The seam is deliberate even with a single adapter — do **not** collapse it on adapter-count grounds.

- **Provider port (ingestion seam).** A `ContentProvider` interface fetches from a source, normalizes to the canonical `Content` shape, and upserts into the existing `contents` table. `CmsProvider` is the first — and trivial — adapter: content is authored straight into `contents` via `cms/mutations`, so its `sync` is the identity case. External adapters (`WikipediaProvider` in Slice 7, then RSS/YouTube) implement real fetch + normalize + upsert behind the **same** port. The feed always reads the canonical `contents` store, never a provider at query time (caching/quotas — per ADR Risk 6).
- **ScoringPolicy (domain core).** A pure module — weights, dimension factors, freshness/archive/seen boosts, and the 60/20/10/10 bucket mix — with no `ctx` dependency. Its interface is its test surface. `recordInteraction` and `getDiscoveryFeed` are thin callers that fetch rows and hand them to it.
- **ScoringKey (shared identity).** Category/tag affinity keys are normalized through one seam so a single taste never fragments across casing/accent variants.
- **ContentVisibility (shared access gate).** The `premium`-module rule is one predicate, applied identically by the editorial `Feed` and the discovery feed.

Two new tables — `contentInteractions` and `userPreferences` — capture signals and affinities. `getDiscoveryFeed` returns a mixed feed (60 % personalized + 20 % archive + 10 % editorial + 10 % random); guests get an editorial + random mix with no personalization. `Entity`-level scoring is deferred (no `entities` table yet); `WikipediaProvider` and other external **adapters** are deferred to later slices — but the **port they plug into ships in this slice**.

**Tech Stack:** Convex (schema, mutations, queries), Expo Router, React Native, TypeScript, Jest, Vitest + convex-test

---

## Read First (standard plan header — always)

- `docs/agents/mockup-to-code-map.md` — token map, `styles.css` spec, shell patterns, i18n + guest-first conventions, traps.
- `docs/agents/ui-visual-testing.md` — Expo-web + headless-Chrome pixel protocol; auth-gated + `midnight` manual.
- `convex/_generated/ai/guidelines.md` — read before touching `convex/`.
- `docs/adr/0003-content-discovery-engine.md` — interaction weights, scoring formula, feed mix rationale.
- `docs/superpowers/plans/2026-06-06-slice-5-cms-authoring-avatar-capabilities.md` — the CMS authoring + capability-wiring this slice builds on.
- Existing patterns to mirror: `convex/schema.ts` (`bookmarks`, `playbackProgress` — same index style); `src/features/tenant/public-config.ts` (`isModuleEnabled`, `NAVIGATION_MODULES`); `convex/cms/mutations.ts` (`requireCmsAdmin` pattern for authz helpers); `app/(app)/explore.tsx` and `app/(app)/community.tsx` (module-gated screen pattern); `src/components/content/content-card.tsx`.
- `CLAUDE.md`

Standing rules: never hardcode colors (tokens + `withAlpha`, verify `midnight`); responsive via `useResponsive`; modular i18n; **test where the code lives** — Convex → Vitest/convex-test (`npm run test:convex`), RN/UI → Jest (`npm test`).

---

## Scope Guard

Includes:

- `ContentProvider` **port** + `cmsProvider` adapter + `PROVIDERS` registry (the hexagonal seam — ships now, one adapter).
- `ScoringPolicy` pure domain core (`scoring.ts`) + `ContentVisibility` predicate (`visibility.ts`).
- `contentInteractions` and `userPreferences` Convex tables + indexes.
- `recordInteraction` mutation (records signal, delegates affinity update to `ScoringPolicy`).
- `getDiscoveryFeed` query: scored + mixed feed, guest-aware, gated through `ContentVisibility`.
- `"discover"` added to `NAVIGATION_MODULES` + `defaultTenant.enabledModules` + seed.
- Mobile `app/(app)/discover.tsx` screen: scrollable feed cards with skip/like affordances, source explanation label.
- Interaction signals wired from existing surfaces: content card view impression, content detail open, finish (episode/video) → `recordInteraction`.
- Tests: Vitest for all Convex functions; Jest for the Discover screen and interaction wiring.

Does **not** include:

- `Entity` content model or `entityAffinity` scoring (no `entities` table yet).
- `sourceAffinity` scoring (single adapter today; the scoring dimension lands when a second `Provider` does).
- `WikipediaProvider` or any external **adapter** (Slice 7+). The **port** they plug into is in scope; the adapters are not.
- `FeedSession` persistence (optional trace — defer until analytics are needed).
- Recommendation explanation UI beyond a simple label ("Recommandé", "Archive", "Surprise").
- CMS analytics or admin dashboard for interaction data.
- Changing the public home feed or existing content detail screens beyond adding `recordInteraction` calls.

---

## File Structure

**Convex — domain core + ports (all scoring math lives here, no `src` import):**

- `convex/schema.ts` — add `contentInteractions` + `userPreferences` tables.
- `convex/discovery/scoring.ts` — **ScoringPolicy domain core (pure, no `ctx`)**: `INTERACTION_WEIGHTS`, `DIMENSION_FACTORS`, `normalizeScoringKey`, `applyInteraction(prefs, signal) → prefs`, `scoreContent(content, prefs, now) → number`, `bucketFeed(scored, mix) → FeedItem[]`. Owns Candidate 2 + Candidate 3.
- `convex/discovery/provider.ts` — **Provider port (ingestion seam)**: `ContentProvider` interface + `cmsProvider` adapter + `PROVIDERS` registry (`[cmsProvider]` today). Owns the hexagonal seam.
- `convex/discovery/visibility.ts` — **ContentVisibility** predicate `isContentVisible(content, enabledModules)`. Owns Candidate 4; re-used by `public-config.ts`.
- `convex/discovery/interactions.ts` — `recordInteraction` mutation; delegates the math to `scoring.applyInteraction`.
- `convex/discovery/feed.ts` — `getDiscoveryFeed` query; delegates ranking to `scoring.scoreContent` + `scoring.bucketFeed`, filtering through `isContentVisible`.
- `convex/discovery/scoring.test.ts` — **Vitest, pure (no convex-test harness)**: weights, factors, boosts, bucket mix, `normalizeScoringKey`.
- `convex/discovery/provider.test.ts` — Vitest: `cmsProvider.sync` is identity over `contents`; registry contract.
- `convex/discovery/interactions.test.ts` — Vitest (convex-test): row insert, debounce, guest no-op.
- `convex/discovery/feed.test.ts` — Vitest (convex-test): ranking, hidden-exclusion, seen-penalty, mix proportions.

**Client:**

- `src/features/tenant/public-config.ts` — add `"discover"` to `NAVIGATION_MODULES`; route the premium filter in `filterAndOrderFeedContent` through the shared `isContentVisible` (Candidate 4 parity).
- `src/features/categories/category-presentation.ts` — delegate key normalization to the shared `normalizeScoringKey` (Candidate 3 single identity; pin with a parity test — see Task 2 note on the convex/src seam).
- `src/features/tenant/default-tenant.ts` + `convex/tenants/seed.ts` — add `"discover"` to `enabledModules`.
- `app/(app)/discover.tsx` — Discover screen, gated on `isModuleEnabled(modules, "discover")`.
- `src/features/discovery/use-discovery-feed.ts` — hook wrapping `getDiscoveryFeed` + `recordInteraction`.
- `src/components/content/content-card.tsx` — add `onView` / `onSkip` / `onLike` callback props.
- `__tests__/discover-screen.test.tsx` — Jest.
- `__tests__/interaction-wiring.test.tsx` — Jest.

> **Note on the `convex` ⇆ `src` seam (Candidate 2 leak):** the original plan put `interaction-weights.ts` in `src/` and imported it into `convex/`. That import is removed — the weights and all scoring math live in `convex/discovery/scoring.ts`. Nothing in `convex/` imports from `src/`. Where the client genuinely needs a pure scoring helper (the `normalizeScoringKey` parity in `category-presentation.ts`), prefer importing the canonical `convex/discovery/scoring.ts` export if this repo's tsconfig resolves it cleanly; otherwise duplicate the ~6-line pure function and pin the two with a parity test. Decide at implementation time — do not re-introduce a `convex → src` import.

---

### Task 1: Schema additions

**Files:** `convex/schema.ts`.

- [ ] Add `contentInteractions` table:
  - `tokenIdentifier: v.string()` — user (optional for guest, use `"guest"` sentinel or skip recording)
  - `tenantSlug: v.string()`
  - `contentId: v.id("contents")`
  - `type: v.union(v.literal("view"), v.literal("open"), v.literal("skip"), v.literal("like"), v.literal("finish"), v.literal("share"), v.literal("hide"))`
  - `createdAt: v.number()`
  - Indexes: `by_tokenIdentifier_and_contentId` (`tokenIdentifier`, `contentId`), `by_tokenIdentifier_and_type` (`tokenIdentifier`, `type`), `by_contentId` (`contentId`).
- [ ] Add `userPreferences` table:
  - `tokenIdentifier: v.string()`
  - `tenantSlug: v.string()`
  - `targetType: v.union(v.literal("category"), v.literal("tag"), v.literal("contentType"))`
  - `targetId: v.string()` — category string / tag string / `"article"|"episode"|"video"`
  - `score: v.number()`
  - `updatedAt: v.number()`
  - Indexes: `by_tokenIdentifier_and_target` (`tokenIdentifier`, `targetType`, `targetId`), `by_tokenIdentifier` (`tokenIdentifier`).
- [ ] **Commit** — `feat(schema): add contentInteractions + userPreferences tables`.

---

### Task 2: ScoringPolicy domain core + ScoringKey + ContentVisibility (Vitest-first, **pure**)

This is the hexagon's domain core (Candidates 2 + 3) and the shared access gate (Candidate 4). All pure — no `ctx`, no convex-test harness. The interface is the test surface.

**Files:** `convex/discovery/scoring.ts`; `convex/discovery/visibility.ts`; `convex/discovery/scoring.test.ts`; `convex/discovery/visibility.test.ts`.

- [ ] **Step 1 (Vitest, pure):** failing specs for `scoring.ts`:
  - `normalizeScoringKey("Politique")` === `normalizeScoringKey("politique")` === `normalizeScoringKey(" Politique ")`; accents folded (`"Démocratie"` → `"democratie"`). (Candidate 3)
  - `applyInteraction(prefs, { type: "like", category: "Politique", tags: ["Démocratie"], kind: "article" })` raises the affinity for key `category/politique` and `tag/democratie`; `skip` lowers; `hide` applies a large negative; score clamps to `[-500, 1000]`.
  - Dimension factors: category 1.0, tag 0.5, contentType 0.2.
  - `scoreContent(content, prefs, now)` is higher for a content whose category matches a high affinity than for an unmatched one; freshness boost `+30` when `publishedAt < 30 d`; archive boost `+15` when `> 180 d` and unseen; seen penalty `−30` when an `open`/`finish` signal exists.
  - `bucketFeed(scored, { personalized: .6, archive: .2, editorial: .1, random: .1 })` over a **seeded** corpus of 40 items returns counts per bucket within ±2 (Candidate fixes the "roughly respected" vagueness — seed the RNG, assert exact-ish counts).
- [ ] **Step 2 (Vitest, pure):** failing specs for `visibility.ts`:
  - `isContentVisible(premiumContent, modulesWithoutPremium)` === `false`; with `premium` enabled === `true`; non-premium always `true`. (Candidate 4)
- [ ] **Step 3:** implement.
  - `scoring.ts` exports (all pure):
    ```ts
    export const INTERACTION_WEIGHTS = { view: 5, open: 20, skip: -10, like: 50, finish: 100, share: 80, hide: -100 } as const;
    export const DIMENSION_FACTORS = { category: 1.0, tag: 0.5, contentType: 0.2 } as const;
    export function normalizeScoringKey(label: string): string;          // trim → lower → NFD strip accents → kebab
    export function applyInteraction(prefs: Affinity[], signal): Affinity[]; // clamp(existing + weight*factor, -500, 1000)
    export function scoreContent(content, prefs, now): number;            // affinities + boosts − penalty + jitter
    export function bucketFeed(scored, mix, rng): FeedItem[];             // rng injectable for deterministic tests
    ```
  - `bucketFeed` takes an injectable `rng` (default `Math.random`) so tests seed it.
  - Each `FeedItem` carries `reason: "personalized" | "archive" | "editorial" | "random"`.
  - `visibility.ts` exports `isContentVisible(content, enabledModules)`.
- [ ] **Step 4:** Vitest → PASS. **Commit** — `feat(discovery): pure ScoringPolicy + ScoringKey + ContentVisibility`.

> **Candidate 3 follow-through (separate small commit, same task):** make `src/features/categories/category-presentation.ts` use the canonical `normalizeScoringKey` (import it if the tsconfig resolves `convex/` cleanly from `src/`; otherwise keep a local copy + a parity test asserting both agree on a fixture list). Do **not** add a `convex → src` import. Commit — `refactor(categories): share normalizeScoringKey identity`.

---

### Task 3: Provider port (ingestion seam, Vitest-first)

The hexagonal seam (the architecture the ADR commits to). Ships with one adapter; the port is the point.

**Files:** `convex/discovery/provider.ts`; `convex/discovery/provider.test.ts`.

- [ ] **Step 1 (Vitest):** failing specs for:
  - `cmsProvider.source === "cms"`.
  - `cmsProvider.sync(ctx, { tenantSlug })` is the identity case: content already authored into `contents` via `cms/mutations` is returned/visible unchanged (no duplication, no mutation of existing rows).
  - `PROVIDERS` registry contains `cmsProvider`; a fake second adapter pushed into a local registry is picked up by the same iteration (proves the seam is real, not the count).
- [ ] **Step 2:** implement.
  ```ts
  export type NormalizedContent = /* canonical Content shape the engine consumes */;
  export interface ContentProvider {
    readonly source: string;                       // "cms" | "wikipedia" | "rss" | "youtube"
    sync(ctx, args: { tenantSlug: string }): Promise<void>; // fetch → normalize → upsert into `contents`
  }
  export const cmsProvider: ContentProvider = { source: "cms", async sync() { /* identity: content authored directly */ } };
  export const PROVIDERS: readonly ContentProvider[] = [cmsProvider];
  ```
  - Keep the port narrow: external adapters (WikipediaProvider, Slice 7) implement real fetch+normalize+upsert behind it without touching the feed.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): ContentProvider port + cmsProvider adapter`.

---

### Task 4: Interactions backend (Vitest-first)

Thin caller over the `ScoringPolicy` core — no math here.

**Files:** `convex/discovery/interactions.ts`; `convex/discovery/interactions.test.ts`.

- [ ] **Step 1 (Vitest, convex-test):** failing specs for:
  - `recordInteraction` inserts a row in `contentInteractions`.
  - After `recordInteraction(type: "like")` on an article with `category: "politique"`, `tags: ["démocratie"]`, `userPreferences` holds positive affinities for `category/politique` and `tag/democratie` (keyed via `normalizeScoringKey`).
  - `skip` lowers affinity; `hide` applies a large negative.
  - Duplicate `view` on the same content within 60 s is a no-op (debounce).
  - Guest interactions (`tokenIdentifier` absent) are silently ignored (no insert, no error).
- [ ] **Step 2:** implement `recordInteraction`: insert the signal row, then upsert `userPreferences` by calling `scoring.applyInteraction` (no inline weights — import from `scoring.ts`). The mutation only fetches the content's `category`/`tags`/`kind`, fetches existing affinities, and persists what the pure function returns.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): recordInteraction over ScoringPolicy`.

---

### Task 5: Discovery feed query (Vitest-first)

Thin caller: read the canonical `contents` store, gate with `isContentVisible`, rank with `ScoringPolicy`.

**Files:** `convex/discovery/feed.ts`; `convex/discovery/feed.test.ts`.

- [ ] **Step 1 (Vitest, convex-test):** failing specs for:
  - Guest call returns published contents mixed by recency + random (no preference scoring), and **excludes premium content when `premium` is off** (via `isContentVisible`).
  - Authenticated call with affinities ranks a category-matching content above an unmatched one.
  - A content with a `hide` interaction is excluded.
  - A content already `open`/`finish`-ed lands near the bottom (seen penalty from `scoreContent`).
  - Feed mix proportions respected on a seeded 40+ item corpus (assertions delegated to `bucketFeed`'s own pure test; here assert the wiring passes the seed through).
  - Returns at most `limit` items (default 20).
- [ ] **Step 2:** implement `getDiscoveryFeed(args: { tenantSlug, tokenIdentifier?, limit? })`:
  - Load published `contents` for tenant; **filter through `isContentVisible(content, enabledModules)`** (Candidate 4 — single gate, shared with the editorial feed).
  - Load the member's `contentInteractions` + `userPreferences` (if authenticated); drop `hide`-d contents.
  - Map each content → `scoring.scoreContent(content, affinities, now)`, then `scoring.bucketFeed(scored, MIX)` — no scoring math inline in the query.
  - Return top `limit`, each carrying its `reason`.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): getDiscoveryFeed over ScoringPolicy + ContentVisibility`.

---

### Task 6: `"discover"` module registration

**Files:** `src/features/tenant/public-config.ts`; `src/features/tenant/default-tenant.ts`; `convex/tenants/seed.ts`.

- [ ] Add `"discover"` to `NAVIGATION_MODULES` tuple and update `NavigationModule` type.
- [ ] Add `"discover"` to `defaultTenant.enabledModules`.
- [ ] Add `"discover"` to the seed's `enabledModules` array. Re-run seed.
- [ ] **Candidate 4 editorial side:** route the premium filter inside `filterAndOrderFeedContent` through the shared `isContentVisible` (replace the inline `enabledModules.includes("premium") || !content.isPremium` with the predicate). Keep the existing feed regression test green — the gate must behave identically.
- [ ] `tsc` clean. **Commit** — `feat(tenant): register discover module + share ContentVisibility gate`.

---

### Task 7: Discover mobile screen (Jest-first)

**Files:** `app/(app)/discover.tsx`; `src/features/discovery/use-discovery-feed.ts`; `__tests__/discover-screen.test.tsx`.

- [ ] **Step 1 (Jest, TDD):**
  - When `"discover"` is not in `enabledModules`, the screen renders nothing (or redirects).
  - When the feed loads, `ContentCard` components appear for each item.
  - Tapping the skip affordance on a card calls `recordInteraction(type: "skip")` and removes the card from view.
  - Tapping the like affordance calls `recordInteraction(type: "like")`.
  - Each card shows the `reason` label ("Recommandé", "Archive", "Surprise", "Sélection éditoriale") using i18n.
  - Loading state renders a skeleton; empty state renders a fallback message.
- [ ] **Step 2:** implement.
  - `use-discovery-feed.ts` wraps `useQuery(api.discovery.feed.getDiscoveryFeed, ...)` + exposes `recordSkip` / `recordLike` callbacks that call `useMutation(api.discovery.interactions.recordInteraction)` and optimistically remove/update the card.
  - `discover.tsx`: `isModuleEnabled` guard → scrollable list of `ContentCard` with skip (swipe or button) + like button. Token from `useAuth()` (guest-safe). Tokens only, no hardcoded colors.
  - Add `reason` label strings to `src/i18n/locales/{en,fr}/discover.ts`.
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(discover): Discover screen with scored feed`.

---

### Task 8: Wire interaction signals from existing surfaces (Jest-first)

**Files:** `src/components/content/content-card.tsx`; `app/article/[id].tsx`; `app/episode/[id].tsx`; `app/video/[id].tsx`; `src/features/media/persistent-episode-player.tsx`; `__tests__/interaction-wiring.test.tsx`.

- [ ] **Step 1 (Jest, TDD):**
  - `ContentCard` calls `onView` callback when it becomes visible (mock `useOnScreen` / `onLayout`).
  - Article detail screen calls `recordInteraction(type: "open")` on mount (mock Convex mutation).
  - Episode player calls `recordInteraction(type: "finish")` when `playbackProgress` reaches ≥ 90 % of `durationSeconds`.
  - All calls are no-ops when `tokenIdentifier` is absent (guest).
- [ ] **Step 2:** implement.
  - Add `onView?: () => void` prop to `ContentCard`; trigger via `onLayout` + `IntersectionObserver`-equivalent (Expo's `onLayout` + scroll context, or a simple timeout heuristic).
  - In detail screens, call `recordInteraction` via `useEffect` on mount.
  - In `persistent-episode-player.tsx`, extend the existing progress tracking to fire `recordInteraction(type: "finish")` once when progress crosses 90 %.
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(discovery): wire view/open/finish interaction signals`.

---

### Task 9: Verify the whole slice (standard verification — always)

- [ ] **Step 1 — Convex tests:** `npm run test:convex` → PASS.
- [ ] **Step 2 — RN tests:** `npm test` → PASS (discover screen + interaction wiring + regression).
- [ ] **Step 3 — TypeScript:** `npx tsc --noEmit` and `npx tsc --noEmit -p convex` → PASS.
- [ ] **Step 4 — hardcoded-color scan:** none in changed mobile files.
- [ ] **Step 5 — manual smoke** per `docs/agents/ui-visual-testing.md`:
  - Discover tab visible (module on) / hidden (module off).
  - Feed loads on guest and on authenticated member.
  - Skip removes card; like updates preference (verify via a second session showing changed ranking).
  - `reason` labels appear correctly.
  - Verify `midnight` palette and iPad layout.
- [ ] **Step 6:** `git status --short` clean.

---

## Self-Review

- **Hexagon is real, seam ships now:** the `ContentProvider` port is in place with `cmsProvider` as its first adapter. WikipediaProvider (Slice 7) plugs into the same port without touching the feed — the seam is a deliberate architectural commitment (ADR 0003 + `CONTEXT.md` › Principes d'Architecture), not an adapter-count accident.
- **ScoringPolicy is the deep module:** weights, factors, boosts, bucket mix all behind one pure interface in `convex/discovery/scoring.ts`. `interactions.ts` and `feed.ts` are thin callers. The policy is tested as pure functions — no convex-test harness, no `convex → src` import (the original `src/.../interaction-weights.ts` leak is gone).
- **One ScoringKey identity:** affinities and content share `normalizeScoringKey`, so a taste never fragments on casing/accents.
- **One ContentVisibility gate:** the editorial `Feed` and the discovery feed cross the same premium predicate — gated content can't leak into Discover.
- Scoring stays deterministic + no ML: weighted affinities + bucketed mix, all in Convex queries.
- Entity-level scoring deferred cleanly: no `entityIds` on `contents` yet, so `entityAffinity` is safely out of scope without breaking the model.
- Guest path is a first-class concern: no `tokenIdentifier` → editorial+random mix, no preference writes.
- `Bookmark` stays autonomous: interaction `type` enum has no `"bookmark"` value — signal is the `bookmarks` table.
- `"discover"` follows the strict module allowlist pattern from Slice 4/5: default-on via `defaultTenant`, gatable per tenant.
- Feed mix proportions are tested, not just assumed.

## After This Slice

Natural follow-ups: `WikipediaProvider` (external content ingestion into `contents`), `Entity` content model + `entityAffinity` scoring, recommendation explanation ("Recommandé car vous avez aimé plusieurs contenus sur l'économie"), and a CMS analytics view for content engagement stats.
