# Slice 3 — Profile + Reading Continuity Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish `Profil` as the identity/account surface (not a second library), align capability navigation with slice 2 rules, refresh the guest gate to mockup fidelity, and clean placeholder/dummy copy on resume and account rows.

**Architecture:** Keep content shelves in `Bibliothèque`. `Profil` keeps identity, resume preview, stats, lightweight library/account rows, and settings access. Reuse `GateBadge`, `openPaywall`, and `/lists` routing patterns validated in slice 2. Resume/progress backend stays out of scope — the card remains a shared visual stub with honest copy and tap feedback.

**Tech Stack:** Expo Router, React Native, TypeScript, i18next, Jest, React Native Testing Library

---

## Read First

- `docs/superpowers/specs/2026-06-06-mobile-ui-supervision-slices-design.md` — **Slice 4 — Profil + continuite de lecture**
- `docs/agents/mockup-to-code-map.md`
- `docs/agents/ui-visual-testing.md`
- `docs/podapp/project/mobile-mockups/proto-screens.jsx` — `ProfileRoot` (~212-294)
- Current code:
  - `app/(app)/profile.tsx`
  - `src/components/profile/profile-identity.tsx`
  - `src/components/profile/profile-library-rows.tsx`
  - `src/components/profile/profile-stat-strip.tsx`
  - `src/components/library/resume-card.tsx`
  - `src/i18n/locales/{en,fr}/profile.ts`
  - `__tests__/guest-profile.test.tsx`
  - `__tests__/signed-in-profile.test.tsx`
- Slice 2 outcomes to stay consistent with:
  - `app/lists.tsx`
  - `app/(app)/library.tsx` premium branching

Standing rules:
- **Never hardcode colors.** Tokens + `withAlpha` only.
- **Profil ≠ Bibliothèque** for shelves; rows navigate out, they do not render shelves.
- Premium CTAs use `openPaywall(...)`; premium lists/downloads use real destinations.

## Scope Guard

Includes:

- premium-aware profile row navigation (`/lists`, paywall, `/library`)
- guest gate visual alignment (`gate-screen` pattern)
- removal of meta/domain guest copy and hardcoded dummy dates in profile strings
- resume card tap feedback stub (shared component)
- tests for guest gate + signed-in row behavior

Does **not** include:

- resume/progress Convex wiring
- history count backend
- subscription management backend
- global card overlay redesign (slice 5)
- library changes except shared `ResumeCard` if needed

---

## File Structure

- `src/components/profile/profile-library-rows.tsx`
- `app/(app)/profile.tsx`
- `src/components/library/resume-card.tsx`
- `src/i18n/locales/en/profile.ts`
- `src/i18n/locales/fr/profile.ts`
- `__tests__/signed-in-profile.test.tsx`
- `__tests__/guest-profile.test.tsx`

---

### Task 1: Premium-aware profile library rows

**Files:**
- Modify: `src/components/profile/profile-library-rows.tsx`
- Modify: `src/i18n/locales/en/profile.ts`
- Modify: `src/i18n/locales/fr/profile.ts`
- Test: `__tests__/signed-in-profile.test.tsx`

- [ ] **Step 1: Write failing tests**

For signed-in non-premium (`isMember: false`):
- tapping **My lists** calls `openPaywall("lists")`
- tapping **Downloads** calls `openPaywall("offline")`

For signed-in premium (`isMember: true`):
- tapping **My lists** calls `router.push("/lists")`
- tapping **Downloads** calls `router.push("/library")`

Mock `usePaywallSheet` and `useRouter` like library tests.

- [ ] **Step 2: Run tests to verify they fail**

- [ ] **Step 3: Implement row handlers**

Inject `onOpenLists`, `onOpenDownloads`, or inline `usePaywallSheet` + `useRouter` inside `ProfileLibraryRows`.

Update `rows.lists.sub` / `subMember` copy to vary by `isMember` (mockup: free vs premium subtitle).

Remove fallback `router.push("/premium")` on go-premium row if parent always passes `onGoPremium` (keep paywall default only as last resort).

- [ ] **Step 4: Run tests**

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(profile): add premium-aware library row navigation"
```

---

### Task 2: Guest gate mockup fidelity

**Files:**
- Modify: `app/(app)/profile.tsx`
- Modify: `src/i18n/locales/en/profile.ts`
- Modify: `src/i18n/locales/fr/profile.ts`
- Test: `__tests__/guest-profile.test.tsx`

- [ ] **Step 1: Write failing test**

Guest profile renders gate pattern copy from `guestBio` (not `guestNote`) and keeps create-account + discover-premium CTAs.

- [ ] **Step 2: Implement gate-screen layout**

Reuse the library guest visual pattern:
- crest initial from tenant/app brand (tokenized)
- `guestTitle` / `guestBio` as title + body (user-facing, not domain meta)
- drop `guestNote` from UI (remove or repurpose key)

Keep top bar title **Profil**.

- [ ] **Step 3: Run guest + signed-in profile tests**

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(profile): align guest gate with mockup gate-screen"
```

---

### Task 3: Resume stub + placeholder copy cleanup

**Files:**
- Modify: `src/components/library/resume-card.tsx`
- Modify: `src/i18n/locales/en/profile.ts`
- Modify: `src/i18n/locales/fr/profile.ts`
- Modify: `src/i18n/locales/en/library.ts` (only if resume copy moves)
- Modify: `src/i18n/locales/fr/library.ts`
- Test: `__tests__/signed-in-profile.test.tsx`

- [ ] **Step 1: Make `ResumeCard` pressable with stub feedback**

Add optional `onPress` prop; default shows a short alert using existing lists-style pending copy in `library` or new `profile.resumePending` key.

Replace unicode play glyph in the play chip with `Ionicons` (`play` icon) for consistency with profile rows.

- [ ] **Step 2: Remove hardcoded dummy dates from profile i18n**

Replace:
- `since.member` fake "mars 2024"
- `rows.subscription.sub` fake renewal date

With honest generic member copy until billing is wired.

- [ ] **Step 3: Tests + typecheck**

Assert resume card is pressable on signed-in profile (accessibility label or role).

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(profile): make resume stub tappable and remove dummy dates"
```

---

### Task 4: Verify the whole slice

- [ ] `npm test -- --runInBand __tests__/guest-profile.test.tsx __tests__/signed-in-profile.test.tsx`
- [ ] `npx tsc --noEmit`
- [ ] `rg -n "#|rgba\\(" app/(app)/profile.tsx src/components/profile src/components/library/resume-card.tsx`
- [ ] Manual checklist:
  - Guest: gate-screen, CTAs, no library shelves
  - Signed-in free: lists/downloads rows open paywall
  - Signed-in premium: lists → `/lists`, downloads → library
  - Resume tap shows stub feedback on Profil and Bibliothèque
  - No fake renewal/since dates visible
  - `midnight` palette pass

---

## Self-Review

- Respects Profil/Bibliothèque boundary from supervision spec.
- Reuses slice 2 paywall and `/lists` patterns instead of reinventing.
- Keeps resume/history backend for a later slice.

## Next Slice

**Slice 5 — Cartes, overlays et systeme visuel** (supervision slice 5 in design doc), then **Slice 6 — Verification**.

**After supervision 5–6:** `docs/superpowers/plans/2026-06-06-personal-lists-crud-member-capability.md` — personal lists CRUD (replaces `/lists` stubs).
