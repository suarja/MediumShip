# Slice 2 — Library Capabilities + Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Realign `Bibliothèque` with the mockup and product rules for personal capabilities: clear gate badges, premium-locked surfaces (not generic empty states), mockup-faithful list/offline promo cards, and consistent section hierarchy/typography.

**Architecture:** This is a polish + capability-UX slice on top of the already-shipped Library route. Keep tenant capability gating (`hasCapability`) for whether a module appears at all. Within a visible module, distinguish `signed-in free` vs `premium` with paywall sheet triggers — never route premium CTAs to hardcoded `/premium` when the contextual paywall exists. Reuse gate-badge tokens already proven in `ProfileLibraryRows`. Split section chrome (title + gate badge) from section content so headers are not duplicated at 24px inside `LibraryCollectionSection`.

**Tech Stack:** Expo Router, React Native, TypeScript, i18next, Jest, React Native Testing Library

---

## Read First

- `docs/superpowers/specs/2026-06-06-mobile-ui-supervision-slices-design.md` — **Slice 3 — Bibliotheque + capacites** (product contract; this is supervision slice 2 in the execution sequence)
- `docs/agents/mockup-to-code-map.md`
- `docs/agents/ui-visual-testing.md`
- `docs/podapp/project/mobile-mockups/proto-screens.jsx` — `LibraryRoot` member state (~161-206)
- `docs/podapp/project/mobile-mockups/styles.css` — `.sh__t`, `.gate*`, `.pcoll*`, `.comm__card`
- Current code:
  - `app/(app)/library.tsx`
  - `src/components/library/library-collection-section.tsx`
  - `src/components/library/saved-library-section.tsx`
  - `src/components/library/downloaded-library-section.tsx`
  - `src/components/profile/profile-library-rows.tsx` (existing `GateBadge` pattern)
  - `src/features/paywall/paywall-sheet-provider.tsx`
  - `src/i18n/locales/{en,fr}/library.ts`
  - `__tests__/guest-library-screen.test.tsx`
  - `__tests__/signed-in-library-screen.test.tsx`
- `CLAUDE.md`

Standing rules:
- **Never hardcode colors.** Tokens + `withAlpha` only; verify `midnight`.
- **Responsive everywhere** via `useResponsive()`.
- **Bookmarks stay free** for signed-in accounts.
- **Offline + personal lists stay premium.**
- Premium CTAs open `usePaywallSheet().openPaywall("offline" | "lists")`, not `/premium`.

## Prerequisite note

Slice 1 left an uncommitted spacing fix in `app/(app)/explore.tsx` (section grouping). Do not touch it in this slice unless the human asks to commit it separately.

## Scope Guard

Includes:

- mockup-faithful section headers with inline gate badges (`Gratuit` / `Premium`)
- premium-locked promo cards for `Mes listes` and `Hors-ligne` when signed-in but not premium
- paywall wiring for those locked surfaces
- typography/spacing alignment for library sections and list rows
- deduplicated section titles between `library.tsx` and `LibraryCollectionSection`
- tests for guest gate, signed-in sections, and premium-locked affordances

Does **not** include:

- personal lists CRUD/backend
- real resume/progress wiring
- library search behavior
- Profile changes (next supervision slice)
- image-overlay redesign across the app (later slice)

---

## File Structure

- `src/components/library/gate-badge.tsx` — extract reusable gate badge from profile pattern
- `src/components/library/library-section-header.tsx` — mockup-faithful section title + optional gate badge
- `src/components/library/library-personal-list-row.tsx` — `pcoll__item` preview row
- `src/components/library/library-offline-locked-card.tsx` — `comm__card` premium promo row
- `src/components/library/library-collection-section.tsx` — add `hideHeader` / content-only mode; typography tune
- `src/components/library/saved-library-section.tsx` — use content-only collection section under parent header
- `src/components/library/downloaded-library-section.tsx` — premium branch: locked card vs real shelf
- `app/(app)/library.tsx` — compose headers, locked rows, spacing groups
- `src/i18n/locales/{en,fr}/library.ts` — locked-state copy updates
- `__tests__/signed-in-library-screen.test.tsx` — expand for gates + locked cards
- `__tests__/guest-library-screen.test.tsx` — keep guest gate expectations

---

### Task 1: Section headers, gate badges, and library shell spacing

**Files:**
- Create: `src/components/library/gate-badge.tsx`
- Create: `src/components/library/library-section-header.tsx`
- Modify: `src/components/profile/profile-library-rows.tsx` (import shared `GateBadge`, no visual change)
- Modify: `app/(app)/library.tsx`
- Test: `__tests__/signed-in-library-screen.test.tsx`

- [ ] **Step 1: Write failing tests for gate badges on saved/lists/offline headers**

Extend `__tests__/signed-in-library-screen.test.tsx` to assert, in EN:
- `Saved` section shows gate text `Free`
- `Lists` section shows gate text `Premium`
- `Offline` section shows gate text `Premium`

Mock `useIsMember` as non-premium signed-in user where needed.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/signed-in-library-screen.test.tsx`
Expected: FAIL — gate labels not rendered yet.

- [ ] **Step 3: Implement shared gate badge + library section header**

Create `gate-badge.tsx` by extracting the existing private `GateBadge` from `profile-library-rows.tsx` (same tones: `free|member|premium` → `accent` or `premium` tokens).

Create `library-section-header.tsx`:
- title at `17 * scaleFont` (`fontFamilies.display`)
- optional gate badge to the right of title (same row, wrap allowed on tiny widths)
- `paddingBottom: 8` (match Explore section fix)

Update `library.tsx`:
- replace inline `SectionHeader` usages with `LibrarySectionHeader`
- pass `gate="free"` for saved, `gate="premium"` for lists/offline
- group each section block as `{ header + content }` in one wrapper (avoid extra scroll gaps)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --runInBand __tests__/signed-in-library-screen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/library/gate-badge.tsx src/components/library/library-section-header.tsx src/components/profile/profile-library-rows.tsx "app/(app)/library.tsx" __tests__/signed-in-library-screen.test.tsx
git commit -m "feat(library): add mockup-faithful section headers with gate badges"
```

---

### Task 2: Premium-locked lists and offline promo cards

**Files:**
- Create: `src/components/library/library-personal-list-row.tsx`
- Create: `src/components/library/library-offline-locked-card.tsx`
- Modify: `app/(app)/library.tsx`
- Modify: `src/components/library/downloaded-library-section.tsx`
- Modify: `src/i18n/locales/en/library.ts`
- Modify: `src/i18n/locales/fr/library.ts`
- Test: `__tests__/signed-in-library-screen.test.tsx`

- [ ] **Step 1: Write failing tests for locked surfaces**

Add tests with `useIsMember` mocked as `{ isMember: false, isLoading: false }`:
- pressing the lists row calls `openPaywall("lists")` (mock `usePaywallSheet`)
- offline locked card renders mockup title copy (EN: `Download to listen without a network`)
- offline locked card does **not** render generic empty-state CTA `Become a member` linking to `/premium`

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --runInBand __tests__/signed-in-library-screen.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement locked rows/cards**

`LibraryPersonalListRow` — mimic mockup `pcoll__item`:
- stacked cover placeholders on the left (tokenized gradients via `theme.colors.*` + `withAlpha`, no hex)
- title `13.5–14 * scaleFont`, meta `9.5–10 * scaleFont`
- chevron on the right
- whole row pressable

`LibraryOfflineLockedCard` — mimic mockup `comm__card`:
- title row + download icon affordance
- body copy below
- pressable; calls `openPaywall("offline")`

In `library.tsx`:
- replace `PlaceholderCard` lists block with `LibraryPersonalListRow`
- for non-premium signed-in users, render `LibraryOfflineLockedCard` instead of `DownloadedLibrarySection`
- for premium users, keep `DownloadedLibrarySection`

In `downloaded-library-section.tsx`:
- remove `/premium` fallback from `emptyCtaHref` for non-premium; parent now owns locked card
- keep true empty state only for premium users with zero downloads

Update i18n copy to remove "next slice" placeholder tone; use locked/premium language from mockup.

- [ ] **Step 4: Run tests**

Run: `npm test -- --runInBand __tests__/signed-in-library-screen.test.tsx __tests__/guest-library-screen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/library/library-personal-list-row.tsx src/components/library/library-offline-locked-card.tsx "app/(app)/library.tsx" src/components/library/downloaded-library-section.tsx src/i18n/locales/en/library.ts src/i18n/locales/fr/library.ts __tests__/signed-in-library-screen.test.tsx
git commit -m "feat(library): add premium-locked lists and offline promo cards"
```

---

### Task 3: Collection section typography and header deduplication

**Files:**
- Modify: `src/components/library/library-collection-section.tsx`
- Modify: `src/components/library/saved-library-section.tsx`
- Modify: `src/components/library/downloaded-library-section.tsx`
- Test: `__tests__/signed-in-library-screen.test.tsx`

- [ ] **Step 1: Add failing test that saved section does not duplicate the large 24px title when parent header exists**

When mocks return saved items, assert the screen does not contain duplicated `Saved` heading nodes beyond the section header (use `queryAllByText("Saved")` length check documented in test).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runInBand __tests__/signed-in-library-screen.test.tsx`
Expected: FAIL due to duplicate titles from `LibraryCollectionSection`.

- [ ] **Step 3: Refactor collection section to content-only mode**

Add prop `variant: "full" | "contentOnly"` (default `"full"` for backward safety).

In `contentOnly`:
- skip the internal 24px title/subtitle header
- keep featured card + rows + empty state
- tune row title to ~`14 * scaleFont`, meta to ~`10 * scaleFont` to approach mockup `Row` / `pcoll` scale
- soften or remove the decorative `featuredGlow` circle if it reads as a visual artifact; prefer overlay-only readability

Update `SavedLibrarySection` and premium branch of `DownloadedLibrarySection` to use `contentOnly`.

- [ ] **Step 4: Run tests + typecheck**

Run:
```bash
npm test -- --runInBand __tests__/signed-in-library-screen.test.tsx
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/library/library-collection-section.tsx src/components/library/saved-library-section.tsx src/components/library/downloaded-library-section.tsx __tests__/signed-in-library-screen.test.tsx
git commit -m "fix(library): dedupe section headers and align collection typography"
```

---

### Task 4: Verify the whole slice

- [ ] **Step 1: Run slice-focused tests**

```bash
npm test -- --runInBand __tests__/guest-library-screen.test.tsx __tests__/signed-in-library-screen.test.tsx
npx tsc --noEmit
```

- [ ] **Step 2: Hardcoded-color scan on touched library files**

```bash
rg -n "#|rgba\\(" src/components/library "app/(app)/library.tsx"
```

Expected: no new literals.

- [ ] **Step 3: Manual / visual smoke checklist (human)**

Guest:
- `Bibliothèque` shows guest gate, sign-in CTA, continue-as-guest CTA

Signed-in (free member):
- Section headers show `Gratuit` on Saved, `Premium` on Lists/Offline
- Saved section shows real saved rows or a true empty state (not premium gate)
- Lists row looks like a personal list preview, tap opens paywall sheet
- Offline shows promo/locked card (not generic empty), tap opens paywall sheet
- No hardcoded accent-only CTA that ignores theme on `midnight`

Premium member:
- Offline section shows download shelf (featured card + rows) or true empty state
- Lists row still visible; paywall only if business rules require (non-premium only)

- [ ] **Step 4: `git status --short` clean for slice files**

---

## Self-Review

- Covers supervision slice: saved/offline/lists gates, premium-not-empty semantics, CTA theming, list component fidelity, section title alignment.
- Keeps scope out of Profile and global overlay work.
- Uses existing paywall sheet instead of reviving `/premium` route for locked taps.

## Next Slice After This One

**Slice 3 — Profil + continuite de lecture** (supervision slice 4 in the design doc).
