# Discovery Slice C — Discover deepens (ambient signals + explanation)

> **Letter nomenclature on purpose** (parallel numeric slices run by other agents). Third of three vertical slices — see the spine `2026-06-06-slice-6-discovery-engine.md`. **Deferrable:** Slices A + B are the core; this one is a deepening. **Depends on Slice B** (`discovery-slice-b-signals.md`): tables, `recordInteraction`, affinities, and the personalized feed must exist.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. For the RN/UI tasks, **also invoke the `frontend-design` skill**. Steps use `- [ ]`.

**Goal:** browsing the app passively shapes the Discover feed (view impressions, opening a detail, finishing an episode/video all feed the affinity profile), and each card explains *why* it surfaced beyond a bare label.

**End-to-end proof:** finish an episode in one category, with no explicit like → that category's affinity rises and Discover reflects it; opening articles nudges the profile; a card reads "Recommandé car vous avez écouté plusieurs contenus sur l'économie". Guests are unaffected.

**Tech Stack:** React Native, Convex, Jest, Vitest + convex-test.

---

## Read First

- `docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md` — spine (signal types, `reason` model).
- `docs/superpowers/plans/2026-06-06-discovery-slice-b-signals.md` — `recordInteraction` + affinity model already in place.
- `docs/adr/0003-content-discovery-engine.md` — interaction weights (view/open/finish), recommendation-explanation rationale ("confiance utilisateur").
- `docs/agents/mockup-to-code-map.md` · `docs/agents/ui-visual-testing.md` · `convex/_generated/ai/guidelines.md` · `CLAUDE.md`.
- Existing surfaces to wire: `src/components/content/content-card.tsx`; `app/article/[id].tsx`; `app/episode/[id].tsx`; `app/video/[id].tsx`; `src/features/media/persistent-episode-player.tsx` (existing progress tracking); `convex/playbackProgress/*` (the 90 %-completion source of truth).

### Front-end fidelity — no literal feed mockup

No mockup for the explanation copy/placement. **Invoke the `frontend-design` skill** for Task 2 and infer the explanation treatment from the maquette style; keep it a small, token-driven kicker/caption on the card, not a new surface.

Standing rules: no hardcoded colors (tokens + `withAlpha`, `midnight`); responsive; modular i18n; test where the code lives.

---

## Scope Guard

Includes:

- Ambient signal wiring → `recordInteraction`: `view` (card impression), `open` (detail mount), `finish` (player ≥ 90 %).
- Visibility detection for `onView` (reuse an existing hook/util if present; otherwise a simple `onLayout` + scroll heuristic).
- Recommendation explanation: turn the `reason` enum into a human sentence keyed off the member's top affinity, via modular i18n.

Does **not** include:

- New signal types beyond view/open/finish.
- `Entity`/`source` affinity; semantic/embedding work (numeric roadmap, far later).
- CMS analytics dashboard for engagement.

---

## File Structure

- `src/components/content/content-card.tsx` — `onView` prop + visibility trigger.
- `app/article/[id].tsx`, `app/episode/[id].tsx`, `app/video/[id].tsx` — `recordInteraction("open")` on mount.
- `src/features/media/persistent-episode-player.tsx` — fire `recordInteraction("finish")` once at ≥ 90 %.
- `src/features/discovery/use-discovery-feed.ts` — expose `recordView` / explanation helper.
- `src/i18n/locales/{en,fr}/discover.ts` — explanation strings.
- `__tests__/interaction-wiring.test.tsx`; `__tests__/discover-screen.test.tsx` (extend) — Jest.

---

### Task 1: Wire ambient view/open/finish signals (Jest-first)

**Files:** `src/components/content/content-card.tsx`; `app/{article,episode,video}/[id].tsx`; `src/features/media/persistent-episode-player.tsx`; `__tests__/interaction-wiring.test.tsx`.

- [ ] **Step 1 (Jest, TDD):**
  - `ContentCard` calls `onView` when it becomes visible (mock the visibility hook / `onLayout`).
  - Each detail screen calls `recordInteraction("open")` on mount (mock the mutation).
  - The episode player fires `recordInteraction("finish")` once when progress crosses ≥ 90 % of `durationSeconds`.
  - All are no-ops when `tokenIdentifier` is absent (guest).
- [ ] **Step 2:** implement. Add `onView?: () => void` to `ContentCard` (reuse an existing visibility util if one exists; else `onLayout` + scroll context). `useEffect`-mount `open` in detail screens. Extend the player's existing progress tracking to fire `finish` once at the 90 % crossing (debounced to one emit).
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(discovery): wire ambient view/open/finish signals`.

---

### Task 2: Recommendation explanation (Jest-first + `frontend-design` skill)

**Files:** `src/features/discovery/use-discovery-feed.ts`; `app/(app)/discover.tsx`; `src/i18n/locales/{en,fr}/discover.ts`; `__tests__/discover-screen.test.tsx`.

- [ ] **Invoke the `frontend-design` skill**; infer the explanation treatment from the maquette style (small caption on the card, no new surface).
- [ ] **Step 1 (Jest, TDD):**
  - A `personalized` item renders an explanation naming the driving dimension ("Recommandé car vous avez écouté plusieurs contenus sur **{category}**").
  - `archive` → "Archive remise en avant"; `random` → "Sélection surprise"; `editorial` → "Sélection éditoriale".
  - Falls back to the bare label when no affinity is available (guest / cold start).
- [ ] **Step 2:** implement — derive the explanation from `reason` + the member's top contributing affinity (returned by `getDiscoveryFeed` or computed client-side from the item's category vs affinities). Strings in modular i18n. Tokens only.
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(discover): recommendation explanations`.

---

### Task 3: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` → PASS.
- [ ] Hardcoded-color scan clean on changed mobile files.
- [ ] **Manual smoke** per `docs/agents/ui-visual-testing.md`: finish an episode (no explicit like) → its category rises in Discover; opening articles nudges ranking; explanations read correctly per `reason`; guest unaffected; `midnight` + iPad.
- [ ] `git status --short` clean.

---

## Self-Review

- Vertical: passive consumption visibly shapes Discover — end-to-end, no infra-only step.
- Ambient signals reuse the same thin `recordInteraction` path; no new scoring math (the deep `ScoringPolicy` is untouched).
- Explanation builds trust (ADR "confiance utilisateur") without an opaque ranker.
- Guest path still writes nothing.

## After This Slice

The Discovery Engine core is complete. Numeric-roadmap follow-ups (separate slices, other agents): `WikipediaProvider` adapter behind the existing port, `Entity` + `entityAffinity`, CMS engagement analytics.
