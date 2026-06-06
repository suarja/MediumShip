# Slice 5 (Supervision) — Cards, Overlays & Visual System Fidelity

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix transverse mobile visual issues called out in supervision: readable image-backed cards, removal of stray decorative artifacts (the library featured “circle”), and consistent navigation icon sizing — without a broad design-system rewrite.

**Architecture:** Introduce one small shared scrim helper for image-backed editorial cards, apply it where copy sits on photography, delete the redundant glow orb. Audit chrome glyphs (tab bar, top-bar search, back) against `styles.css` via `useResponsive()`. Keep `OVER_MEDIA` literals in `card-presentation.ts` for controls on arbitrary artwork; use theme tokens + `withAlpha` for palette-aware scrims.

**Tech Stack:** React Native, Expo Router, TypeScript, Jest, i18next

---

## Read First

- `docs/superpowers/specs/2026-06-06-mobile-ui-supervision-slices-design.md` — **Slice 5**
- `docs/agents/mockup-to-code-map.md`
- `docs/agents/ui-visual-testing.md`
- `docs/podapp/project/mobile-mockups/styles.css` — `.tab__i` (16px), image card treatments
- `src/components/library/library-collection-section.tsx` — `featuredGlow` artifact
- `src/components/content/detail-hero.tsx`, `feed-hero-card.tsx`, `feed-row.tsx`
- `src/features/content/card-presentation.ts` — `OVER_MEDIA`, `KIND_GLYPH`
- `src/components/navigation/app-tab-bar.tsx`
- `app/(app)/explore.tsx`, `app/(app)/library.tsx` — top-bar `⌕`
- `CLAUDE.md`

Standing rules:
- **Never hardcode colors** in components (except existing documented `OVER_MEDIA` / `PREMIUM_ON_FILL` literals).
- Verify **`midnight`** after overlay changes.
- Phone **and** iPad widths.

## Prerequisite

Supervision slices 2–4 (Explorer, Library, Profile polish) are complete.

## Scope Guard

Includes:

- library featured card overlay fix + glow removal
- shared bottom scrim for image-backed cards with on-image copy
- tab bar + top-bar search + back button size alignment to mockup
- tests for scrim helper + library featured structure
- visual smoke checklist

Does **not** include:

- CMS palette work (note only if gaps found)
- global font system refactor
- discovery engine
- personal lists CRUD

---

## File Structure

- `src/components/content/content-image-scrim.tsx` — reusable bottom gradient overlay
- `src/components/library/library-collection-section.tsx`
- `src/components/navigation/app-tab-bar.tsx`
- `app/(app)/explore.tsx`, `app/(app)/library.tsx`, `app/lists.tsx` (top-bar glyphs if touched)
- `__tests__/content-image-scrim.test.tsx`
- `__tests__/library-collection-section.test.tsx` (extend)

---

### Task 1: Shared image scrim + remove library featured glow

**Files:**
- Create: `src/components/content/content-image-scrim.tsx`
- Modify: `src/components/library/library-collection-section.tsx`
- Test: `__tests__/content-image-scrim.test.tsx`, extend `__tests__/library-collection-section.test.tsx`

- [ ] **Step 1: Failing test** — scrim renders; featured section no longer renders `featuredGlow` testID

- [ ] **Step 2: Implement `ContentImageScrim`**

Absolute-fill bottom-weighted gradient using `withAlpha(theme.colors.heading, …)` stops (stronger at bottom). Props: `strength?: "default" | "strong"`.

- [ ] **Step 3: Wire library featured card**

When `featured.imageUrl`:
- render cover `Image`
- `ContentImageScrim` + existing `featuredOverlay` merged/simplified (one scrim path)
- **Remove** `featuredGlow` circle entirely
- keep badge + bottom copy readable on `midnight`

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit**

```bash
git commit -m "fix(library): replace featured glow with shared image scrim"
```

---

### Task 2: Navigation chrome icon sizing

**Files:**
- Modify: `src/components/navigation/app-tab-bar.tsx`
- Modify: `app/(app)/explore.tsx`, `app/(app)/library.tsx` (search glyph)
- Test: existing tab bar / explore tests if present

- [ ] **Step 1: Align tab icons to mockup `.tab__i` 16px** (`16 * scaleFont`)

- [ ] **Step 2: Align decorative top-bar `⌕` on Explore/Library** to match Explore search card icon scale (single target size, e.g. 18–19px mockup proto-top)

- [ ] **Step 3: Confirm category/lists back buttons stay 24px glyph in 34×34 box** (already correct — add comment or test only if drift found)

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(nav): align tab bar and top-bar icon sizing to mockup"
```

---

### Task 3: Feed hero + detail hero image readability pass

**Files:**
- Modify: `src/components/content/feed-hero-card.tsx` (only if cover + future on-image text)
- Modify: `src/components/content/detail-hero.tsx`
- Test: extend hero tests if they exist

- [x] **Step 1: Detail hero** — when `canRenderImage` and overlays (premium/duration) sit on photo, ensure contrast remains acceptable; add light top/side scrim only if needed (minimal)

- [x] **Step 2: Feed hero** — no on-image title today; skipped (text sits below image band; premium pill has solid fill). QA note: revisit only if on-image copy is added later.

- [ ] **Step 3: Commit if changes**

```bash
git commit -m "fix(content): improve detail hero overlay contrast on photos"
```

---

### Task 4: Verify the whole slice

- [ ] `npm test` (Jest) + `npx tsc --noEmit`
- [ ] Color scan on touched files
- [ ] Visual smoke (`docs/agents/ui-visual-testing.md`): phone + iPad, `brick` + `midnight`
- [ ] Manual checklist:
  - Library saved/offline **featured card**: no circle artifact top-right; title readable on photo
  - Tab bar icons balanced
  - Explore search `⌕` not oversized vs tab bar
  - Back buttons on category/lists unchanged/good

---

## Self-Review

- Addresses supervision slice 5 without reopening Explorer/Library/Profile feature work.
- Defers CMS palette parity to a note unless a missing token blocks readability.

## Next Slice

**Slice 6 (Supervision) — Verification et criteres d'acceptation**, then `docs/superpowers/plans/2026-06-06-personal-lists-crud-member-capability.md`.
