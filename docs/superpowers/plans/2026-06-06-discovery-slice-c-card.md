# Discovery Slice C — Reusable composable ContentCard (Discover first)

> **Letter nomenclature on purpose** (parallel numeric slices run by other agents). Repurposed: the old Slice C ("ambient signals + explanation") is **deferred** — see the backlog note at the end. **Depends on Slice B** (`discovery-slice-b-signals.md`): `recordInteraction` (like is a backend toggle), affinities, and the personalized feed exist.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. For every RN/UI task, **also invoke the `frontend-design` skill** (see Read First). Steps use `- [ ]`.

**Goal:** one **composable** `ContentCard` whose first consumer is **Découvrir**, with a bigger "feature" variant and three non-destructive controls — **Like** (toggle), **Favoris** (bookmark toggle), and **⋯** (the existing bottom-sheet: lists, download, share, and a new "Pas intéressé"). **Nothing disappears on like/bookmark.** Only an explicit **"Pas intéressé" (`hide`)** removes content, and only at the **next feed recompute** (refresh), never instantly. The inline **skip** button is removed. The card abstraction is left **composition-ready** so Accueil and Bibliothèque migrate in a later slice.

**End-to-end proof:** in Découvrir, tapping Like fills the heart and the card **stays**; tapping Favoris saves it (and it shows in the library) and the card **stays**; ⋯ → "Pas intéressé" makes the content drop out **after a pull-to-refresh**, not before. No card vanishes on like/bookmark.

**Tech Stack:** React Native, Expo Router, Convex, TypeScript, Jest.

---

## Read First

- `docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md` — spine.
- `docs/superpowers/plans/2026-06-06-discovery-slice-b-signals.md` — `recordInteraction` (like = toggle), feed, `use-discovery-feed.ts`.
- `docs/agents/mockup-to-code-map.md` · `docs/agents/ui-visual-testing.md` · `CLAUDE.md`.
- **Existing components to REUSE, not rebuild:**
  - `src/components/content/content-card.tsx` — current Discover wrapper (inline skip/like — skip to be removed).
  - `src/components/content/feed-row.tsx` — the row; already renders the ⋯ via `ContentOverflowButton` when `showOverflowActions` + a bookmarks/lists/offline capability.
  - `src/components/content/content-overflow-button.tsx` + `content-actions-sheet.tsx` + `src/features/content/content-actions-sheet-provider.tsx` — the **already-rich bottom sheet**: bookmark (`useBookmarks().toggleBookmark`), add-to-list, download, dismiss. Gated by `hasCapability`. Has a `focus` prop (`ContentActionsFocus`).
  - `src/features/bookmarks/use-bookmarks.ts` — bookmark source of truth (`bookmarks`, `toggleBookmark`, `isBookmarksLoading`).
  - `app/(app)/discover.tsx` + `src/features/discovery/use-discovery-feed.ts` — current Discover wiring (remove the `removedIds`-on-like behavior here).

### Front-end fidelity — no literal mockup

No dedicated card mockup. **Invoke the `frontend-design` skill** for every UI task. Infer the bigger "feature" card from the maquette _style_ (`docs/podapp/project/mobile-mockups/styles.css`, `proto-screens.jsx`, `variations.jsx`) and the **social-feed reference (Instagram/Facebook, not LinkedIn)**: prominent media, room for inline controls, comfortable for text **and** audio/AV formats. Reuse existing tokens, glyphs (`KIND_GLYPH`), and the premium badge from `feed-row.tsx`.

Standing rules: no hardcoded colors (tokens + `withAlpha`, verify `midnight`); responsive via `useResponsive`; modular i18n; **`Bookmark` stays the code/domain term** — only the **FR user-facing string** becomes "Favoris".

---

## Scope Guard

Includes:

- Composable `ContentCard` with a `variant` (`"compact"` = today's row; `"feature"` = bigger Discover card) and opt-in control slots (Like / Favoris / Overflow), backward-compatible with every current caller.
- Discover **feature** card: inline **Like** (toggle, non-removing) + **Favoris** (bookmark toggle, non-removing) + **⋯** overflow.
- Reuse `ContentActionsSheet`; add a **"Pas intéressé" (`hide`)** action, scoped to the discovery context via `focus`.
- Per-item **`isLiked`** (and reuse bookmark state) so the toggles reflect reality.
- Remove the inline **skip** button + the `removedIds`-on-like/skip behavior in `use-discovery-feed.ts`. Removal now happens only via `hide`, applied at the next recompute.
- FR rename: bookmark labels → "Favoris" (keep `Bookmark` in code; downloads/offline strings untouched).

Does **not** include:

- Migrating Accueil / Bibliothèque to the new card (later slice — abstraction is made ready, not applied).
- Ambient `view`/`open`/`finish` signals + recommendation explanation (deferred — see backlog note).
- Any new sheet capability beyond `hide` (lists/download already exist).

---

## File Structure

- `src/components/content/content-card.tsx` — make composable; add `variant` + control slots; drop inline skip.
- `src/components/content/content-feature-card.tsx` *(new, if cleaner than a variant branch)* — the bigger Discover card body.
- `src/components/content/content-actions-sheet.tsx` — add the `hide` ("Pas intéressé") row, gated by `focus`.
- `src/features/content/content-actions-sheet-provider.tsx` — extend `ContentActionsFocus` if needed (e.g. `"discovery"`).
- `convex/discovery/feed.ts` — add `isLiked` to authenticated feed items (reactive like state).
- `src/features/discovery/use-discovery-feed.ts` — expose `recordLike` as a **non-removing** toggle; expose `hide`; **remove** `removedIds`-on-like/skip; drop `recordSkip`.
- `app/(app)/discover.tsx` — render the feature card with Like + Favoris + ⋯.
- `src/i18n/locales/{en,fr}/library.ts` (+ `discover.ts`) — "Favoris" + "Pas intéressé" strings.
- `__tests__/content-card.test.tsx`, `__tests__/discover-screen.test.tsx` — Jest.

---

### Task 1: Make `ContentCard` composable + feature variant (Jest-first + `frontend-design`)

**Files:** `src/components/content/content-card.tsx` (+ optional `content-feature-card.tsx`); `__tests__/content-card.test.tsx`.

- [ ] **Invoke `frontend-design`**; design the `"feature"` card from the maquette style + social-feed reference (no literal mockup).
- [ ] **Step 1 (Jest, TDD):**
  - `ContentCard` with `variant="compact"` renders exactly as today (every existing caller — Accueil, explore, category, list — unchanged: regression).
  - `variant="feature"` renders the bigger layout (media-forward) and only shows the control slots it is given.
  - Control slots are opt-in: passing none renders no actions (composition — a surface shows only what it wants).
- [ ] **Step 2:** implement the composable shape (a `variant` prop + `actions`/children slot, or `ContentCard.Like` / `ContentCard.Favorite` / `ContentCard.Overflow` sub-components — pick the lighter one). Keep the public API backward-compatible. Tokens only.
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `refactor(content): composable ContentCard with feature variant`.

---

### Task 2: Like as a non-removing toggle + drop skip (Jest-first)

**Files:** `convex/discovery/feed.ts`; `src/features/discovery/use-discovery-feed.ts`; `app/(app)/discover.tsx`; `__tests__/discover-screen.test.tsx`.

- [ ] **Step 1 (Jest, TDD):**
  - Tapping Like calls `recordInteraction(type:"like")` and the card **remains** in the list (no `removedIds`).
  - The Like control reflects `isLiked` (filled vs outline) and toggles it.
  - No skip button is rendered; `recordSkip` is gone.
- [ ] **Step 2 (Vitest, convex-test):** `getDiscoveryFeed` authenticated items carry `isLiked` derived from the member's `like` interactions.
- [ ] **Step 3:** implement — add `isLiked` to the feed query; in `use-discovery-feed.ts` make `recordLike` a non-removing toggle, delete `recordSkip` + the `removedIds`-on-like/skip logic (keep `refresh()` clearing transient state). `discover.tsx` passes Like state/handler to the feature card.
- [ ] **Step 4:** Jest + Vitest → PASS; `tsc` clean. **Commit** — `feat(discover): like is a non-removing toggle; remove skip`.

---

### Task 3: Reuse the ⋯ sheet + "Pas intéressé" (hide) + Favoris (Jest-first + `frontend-design`)

**Files:** `src/components/content/content-actions-sheet.tsx`; `content-actions-sheet-provider.tsx`; `app/(app)/discover.tsx`; `src/i18n/locales/{en,fr}/library.ts` (+ `discover.ts`); `__tests__/discover-screen.test.tsx`.

- [ ] **Invoke `frontend-design`** for the Favoris control + sheet row styling.
- [ ] **Step 1 (Jest, TDD):**
  - The Discover feature card shows a **Favoris** (bookmark) toggle wired to `useBookmarks().toggleBookmark`; saving keeps the card in place and surfaces it in the library.
  - The **⋯** opens `ContentActionsSheet`; in the discovery context it shows a **"Pas intéressé"** row that calls `recordInteraction(type:"hide")` and dismisses.
  - After `hide` + a pull-to-refresh, the content is **absent** from the feed (it is present before the refresh).
  - FR strings render "Favoris" / "Pas intéressé" (en equivalents present).
- [ ] **Step 2:** implement — enable overflow on the Discover card; add the `hide` row to the sheet gated by `focus` (e.g. a `"discovery"` focus); rename the FR bookmark labels to "Favoris" in `library.ts` (leave `Bookmark` in code and downloads strings untouched).
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(discover): reuse actions sheet, add Pas intéressé, rename Favoris`.

---

### Task 4: Verify the slice (standard verification — always)

- [ ] `npm test` → PASS (content-card + discover + regression on Accueil/explore/category/list cards).
- [ ] `npm run test:convex` → PASS (`isLiked` on feed).
- [ ] `npx tsc --noEmit` + `-p convex` → PASS.
- [ ] Hardcoded-color scan clean on changed files.
- [ ] **Manual smoke** per `docs/agents/ui-visual-testing.md`: Like fills + card stays; Favoris saves + card stays + appears in library; ⋯ → "Pas intéressé" → content gone only after refresh; existing Accueil/explore/category cards unchanged; `midnight` + iPad; the feature card reads well for article, episode, and video.
- [ ] `git status --short` clean.

---

## Self-Review

- **Non-destructive marks:** like/bookmark toggle state, never remove — matches a scrollable social feed. Only explicit `hide` removes, and only at recompute.
- **Reuse over rebuild:** the ⋯ bottom sheet, bookmark source, and capability gating already exist; this slice wires them onto Discover and adds one `hide` row.
- **Composition-ready:** one `ContentCard` with opt-in control slots; Accueil/Bibliothèque migrate later without forking the component.
- **`Bookmark` stays the domain term;** "Favoris" is only the FR string.
- Slice B's premature `removedIds`-on-like/skip is corrected here.

## Deferred — old Slice C (ambient signals + explanation)

Not lost, just decoupled (it has almost no visible surface and is lower priority): wire ambient `view` (card impression) / `open` (detail mount) / `finish` (player ≥ 90 %) into `recordInteraction`, and turn the per-item `reason` into a "Recommandé car…" explanation. Pick this up as a later letter-slice once the card and a real content provider are in place.

## After This Slice

- Migrate Accueil and Bibliothèque onto the composable `ContentCard`.
- **WikipediaProvider slice** — real content + the port's second adapter. Its core is the **FetchDemand** model: aggregate per-tenant affinities + a diversity quota + a bootstrap seed → a **scheduled** ingestion (decoupled from per-user gestures). To be designed next.
