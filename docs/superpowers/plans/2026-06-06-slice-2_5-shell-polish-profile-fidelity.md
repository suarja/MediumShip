# Slice 2.5 — Shell Polish And Profile Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the fidelity and polish gaps left after slice 2 on already-shipped surfaces: fix the floating tab bar (label overflow, off-center, tiny icons/loupe, missing responsive scaling) and realign `Profile` to the mockup `p2` layout (simple top bar + identity + compact stats + "Ma bibliothèque" nav rows + account section), retiring the banner-hero that has no counterpart in the mockup.

**Architecture:** This is a corrective slice, not a feature slice. It touches only presentation. It does **not** add new data, queries, or member capabilities. It re-introduces lightweight *navigation* rows in `Profile` (links into `Library`), which is different from the content *shelves* slice 2 correctly removed. The mockup is the visual source of truth.

**Tech Stack:** Expo Router, React Native, TypeScript, i18next, Jest, React Native Testing Library

---

## Read First

- `docs/plans/2026-06-05-media-prototype-planning-slides.md` (Slide 8 Profil, Slide 3 Navigation)
- `docs/superpowers/plans/2026-06-06-slice-1-mobile-shell-convergence.md`
- `docs/superpowers/plans/2026-06-06-slice-2-library-profile-convergence.md`
- `docs/podapp/project/mobile-mockups/proto-screens.jsx` lines **210–290** (`ProfileRoot`)
- `docs/podapp/project/mobile-mockups/proto-app.jsx` lines **59–203** (`TABS` + `.tabbar` render)
- `docs/podapp/project/mobile-mockups/styles.css` lines **300–319** (`.tabbar/.tab__i/.tab__l`), **820–894** (`.gate`, `.p2__*`)
- `CLAUDE.md`

Also required for this slice:

- Use the `frontend-design` skill for the realigned `Profile`.
- **Never hardcode colors.** Every color comes from `theme.colors.*` via `useAppTheme()`, translucent variants via `withAlpha(...)`. Verify against `midnight` before declaring done.
- **Every screen and shared component must scale with `useResponsive()`** (`scaleFont`, `scaleSpace`, `isTablet`). The tab bar is currently the only surface that ignores it — that is part of the bug.
- Fonts come from `fontFamilies`, never literals.

## Mockup fidelity reference (do not invent UI)

Tab bar (`styles.css:300-319`): `space-around`, per-tab column `align-items:center; gap:3px`, icon `.tab__i` 16px, label `.tab__l` 9px **mono**, uppercase, `letter-spacing:.08em`, single line; active tint = `accent`.

Profile (`proto-screens.jsx:229-289`, member state):
1. Top bar: `Profil` (display) + settings gear on the right, inline and centered — same `topBar` pattern already used by `explore.tsx` / `library.tsx`.
2. `p2__id`: round avatar (52pt phone / 60pt tablet) + name + status line + "since/upgrade" line. **No banner.**
3. Resume card (static placeholder, identical visual to the one already in `library.tsx`; resume/progress wiring stays deferred).
4. Three compact stats: `Enregistrés` / `Hors-ligne` / `Historique`.
5. `p2__sec` "Ma bibliothèque": rows → `Enregistrements` (free), `Téléchargements` (premium), `Mes listes` (premium), `Historique & progression` (member), each with a gate badge + chevron, tapping routes into `/library`.
6. `p2__sec` "Compte": `Passer Premium` (or `Abonnement` when member) + `Se déconnecter`.

Gate badge tones (reuse existing tokens, **do not** add palette colors for this slice): free → `theme.colors.accent`, member → `theme.colors.accent`, premium → `theme.colors.premium`. (A dedicated `positive`/green `free` token, if ever wanted, would be added to every palette in a later slice — out of scope here.)

## Scope Guard

This slice includes:

- tab bar: responsive scaling, single-line labels, correct centering, mockup-accurate icon/label sizing, larger loupe
- library top-bar search loupe sizing
- `Profile` realigned to the mockup `p2` layout, banner-hero retired from the profile route
- compact 3-stat strip (`Enregistrés / Hors-ligne / Historique`)
- "Ma bibliothèque" + "Compte" nav rows in `Profile`
- updated `Profile` tests + tab bar test for single-line labels

This slice does **not** include:

- avatar / banner upload or edit (Slice 6)
- resume / history / progress-sync wiring (still a static card)
- library chip filtering logic (chips stay faithful static decoration, as in the mockup)
- `Explore` search / categories / collections / agenda / community behaviour (Slice 4)
- the contextual paywall sheet (Slice 3) — `Passer Premium` routes to the existing `/premium` screen for now
- deleting `ProfileHero` / `ProfileStatCards` files (they may still be used elsewhere or by web); only stop using them in the profile route, delete only if unreferenced after the change

---

## File Structure

- `src/components/navigation/app-tab-bar.tsx` — adopt `useResponsive`, single-line labels, mockup sizing, fix centering.
- `__tests__/app-tab-bar.test.tsx` — assert visible tabs still render and labels are single-line.
- `app/(app)/profile.tsx` — swap the banner-hero composition for the `p2` layout; keep auth hydration, `ensureCurrentUser`, real saved/download counts.
- `src/components/profile/profile-identity.tsx` — new: top bar + identity row (avatar/name/status), settings entry.
- `src/components/profile/profile-stat-strip.tsx` — new: compact 3-stat row matching the mockup.
- `src/components/profile/profile-library-rows.tsx` — new: "Ma bibliothèque" + "Compte" gated nav rows.
- `app/(app)/library.tsx` — bump the top-bar search loupe to a responsive, mockup-accurate size.
- `src/i18n/locales/en/profile.ts` / `src/i18n/locales/fr/profile.ts` — copy for status lines, stat labels, nav rows, gate badges, account rows.
- `__tests__/guest-profile.test.tsx` / `__tests__/signed-in-profile.test.tsx` — guest gate stays; signed-in profile shows identity + stats + library rows, no banner.

---

### Task 1: Fix the floating tab bar (overflow, centering, icon/loupe size, responsive)

**Files:**
- Modify: `src/components/navigation/app-tab-bar.tsx`
- Test: `__tests__/app-tab-bar.test.tsx`

- [ ] **Step 1: Extend the tab bar test for single-line, still-visible labels**

Keep the existing four-visible-tabs assertions. Add: each rendered label `Text` has `numberOfLines === 1`. Query the label nodes and assert their prop. (The existing test mocks `useAppTheme`; also mock `react-native`'s `useWindowDimensions` is not needed because `useResponsive` reads it — add a mock for `useResponsive` returning the phone defaults to keep the test deterministic, or mock `react-native-safe-area-context` as already done and let `useWindowDimensions` default. Prefer mocking `../src/features/responsive/use-responsive` → `{ isTablet:false, scaleFont:1, scaleSpace:1, contentMaxWidth:undefined }`.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/app-tab-bar.test.tsx`
Expected: FAIL — labels currently have no `numberOfLines`.

- [ ] **Step 3: Make the tab bar responsive and mockup-accurate**

In `app-tab-bar.tsx`:
- import and call `useResponsive()`.
- Label `Text`: add `numberOfLines={1}`; size `fontSize: 9 * scaleFont` (mockup `.tab__l` 9px mono uppercase) using `fontFamilies.mono`, `letterSpacing` ~0.8, keep `textTransform: "uppercase"`; ensure the label cannot force the tab wider than its flex slot (the `Text` is the flex child, `numberOfLines={1}` + the `flex:1` tab handles truncation/centering).
- Icon `Text`: size `fontSize: 16 * scaleFont` (mockup `.tab__i` 16px) with `lineHeight: 18 * scaleFont` and `textAlign:"center"` so the loupe `⌕` no longer reads tiny.
- Keep the column centered: `tab` already `alignItems:"center"; justifyContent:"center"; gap:4` — keep, but verify the active pill background still wraps both lines without clipping; reduce `gap` to `3 * scaleSpace` to match the mockup.
- Scale `minHeight`, `padding`, `gap` between tabs by `scaleSpace`.

Do not change the route-visibility filtering logic.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --runInBand __tests__/app-tab-bar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/navigation/app-tab-bar.tsx __tests__/app-tab-bar.test.tsx
git commit -m "fix: make the floating tab bar responsive with single-line labels"
```

---

### Task 2: Bump the Library top-bar search loupe

**Files:**
- Modify: `app/(app)/library.tsx`

- [ ] **Step 1: Enlarge the loupe to a mockup-accurate, responsive size**

In `library.tsx` the signed-in `topBarAction` renders `⌕` at `16 * scaleFont`. Raise it to `19 * scaleFont` (matching the Explore search-card loupe) and give the action box `lineHeight`/`textAlignVertical` so the glyph stays vertically centered in its 34pt box. No new behaviour — it stays a non-interactive affordance for this slice (search lands in Slice 4).

- [ ] **Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/library.tsx"
git commit -m "fix: enlarge the library search loupe to match the mockup"
```

---

### Task 3: Realign Profile to the mockup `p2` layout

**Files:**
- Create: `src/components/profile/profile-identity.tsx`
- Create: `src/components/profile/profile-stat-strip.tsx`
- Create: `src/components/profile/profile-library-rows.tsx`
- Modify: `app/(app)/profile.tsx`
- Modify: `src/i18n/locales/en/profile.ts`
- Modify: `src/i18n/locales/fr/profile.ts`
- Test: `__tests__/guest-profile.test.tsx`, `__tests__/signed-in-profile.test.tsx`

- [ ] **Step 1: Write the signed-in profile test around the new layout**

Create `__tests__/signed-in-profile.test.tsx`. Mock `expo-router` (`Link`, `useRouter`), `useClerkAuth` → signed-in, `useTabBarSpace`, `usePersistentMediaPlayerSpace`, `convex/react` (`useConvexAuth` authenticated, `useQuery`/`useMutation` stubs), `useBookmarks`, `useDownloads`. Assert:
- `screen.getByText("Profil")` (top bar title, FR) / its EN equivalent under `changeAppLanguage`
- identity name renders
- the three stat labels render (`Enregistrés`, `Hors-ligne`, `Historique`)
- a "Ma bibliothèque" row labelled `Enregistrements` renders
- `screen.queryByText(<old banner eyebrow>)` is null — i.e. the banner-hero is gone

- [ ] **Step 2: Rewrite the guest profile test for the simplified gate**

`__tests__/guest-profile.test.tsx`: the guest state keeps the existing gate (create-account CTA, guest name/title). Remove assertions that depend on the banner-hero composition. Keep `testID="profile-create-account-button"`.

- [ ] **Step 3: Run both tests to verify they fail**

Run: `npm test -- --runInBand __tests__/guest-profile.test.tsx __tests__/signed-in-profile.test.tsx`
Expected: FAIL — the new components/layout do not exist yet.

- [ ] **Step 4: Build `ProfileIdentity`**

`src/components/profile/profile-identity.tsx`: a simple inline top bar (`Profil` in `fontFamilies.display`, centered, with the settings gear button on the right — reuse the `topBar` / `topBarSide` / `topBarAction` pattern already in `explore.tsx`/`library.tsx` so the **settings button is centered in its box**, fixing the off-center floating button). Below it, the `p2__id` row: round avatar (`(isTablet?60:52)*scaleSpace`, `borderRadius` half, `theme.colors.canvasAccent` fallback, initial when no `avatarUrl`), name (`fontFamilies.displayBold`, `19*scaleFont` / `23` tablet), status line and since/upgrade line (`fontFamilies.mono` / `body`, `textMuted`). Settings gear = `Ionicons name="settings-outline"` inside a `Link href="/settings"`, sized `18*scaleFont`, centered in its pressable. All colors from tokens.

- [ ] **Step 5: Build `ProfileStatStrip`**

`src/components/profile/profile-stat-strip.tsx`: three equal compact cards in a row (`flexBasis` ~`31%`, wrap on tablet allowed), each with an `Ionicons`, a big number (`fontFamilies.display`, `20*scaleFont`), and a mono uppercase label (`9*scaleFont`). Props: `savedCount`, `offlineCount`, `historyCount`, `labels`. `historyCount` is a passed-in placeholder for now (resume/history not wired); accept it as a number prop so wiring later is a one-line change. Tones: saved → `accent`, offline → `premium`, history → `textMuted`.

- [ ] **Step 6: Build `ProfileLibraryRows`**

`src/components/profile/profile-library-rows.tsx`: two `p2__sec` sections.
- "Ma bibliothèque": rows `Enregistrements` (free badge), `Téléchargements` (premium badge), `Mes listes` (premium badge), `Historique & progression` (member badge). Each row: leading `Ionicons`, title + gate badge, sub-description, trailing chevron; the whole row is a `Pressable` routing to `/library` (`router.push("/library")`).
- "Compte": when member, an `Abonnement` info row; otherwise a `Passer Premium` row routing to `/premium` (the existing hidden screen — no paywall sheet this slice). Plus a `Se déconnecter` row: reuse the existing sign-out path (check `settings.tsx` / `useClerkAuth` for an existing `signOut`; if none is exposed cleanly, route the row to `/settings` and leave actual sign-out where it already lives — do not invent a new auth flow).
- Gate badge sub-component: mono uppercase pill, `7.5–9 * scaleFont`, tone per the mapping in "Mockup fidelity reference". All colors from tokens, translucent backgrounds via `withAlpha`.

- [ ] **Step 7: Recompose `app/(app)/profile.tsx`**

Replace the `ProfileHero` + `ProfileStatCards` + `noteCard` composition in the signed-in branch with: `<ProfileIdentity .../>`, the existing static resume card (lift the same markup/styles used in `library.tsx`; keep it static), `<ProfileStatStrip .../>`, `<ProfileLibraryRows .../>`. Keep: `isLoaded` gate, `ensureCurrentUser` effect, `getMe`, `useBookmarks`/`useDownloads` for real `savedCount`/`downloadedCount`. For the **guest** branch keep the existing gate card (create-account CTA) but render it under the same simple top bar. Stop importing `ProfileHero`/`ProfileStatCards` in this route. Drive `historyCount` from a real value if cheaply available, else `0`.

- [ ] **Step 8: Update profile i18n (en + fr)**

Add keys for: `status.memberFree` / `status.memberPremium`, `since.member` / `since.upgrade`, `stats.savedLabel` (exists), `stats.offlineLabel`, `stats.historyLabel`, section kickers `sections.myLibrary` / `sections.account`, row titles + subs (`rows.saved`, `rows.downloads`, `rows.lists`, `rows.history`, `rows.subscription`, `rows.goPremium`, `rows.signOut`), and gate badge labels `badges.free` / `badges.member` / `badges.premium`. Keep existing guest copy. Match the FR strings to the mockup wording (`proto-screens.jsx:236-289`). Mind the existing files use unaccented ASCII for some strings — follow the surrounding convention in each file.

- [ ] **Step 9: Run the profile tests**

Run: `npm test -- --runInBand __tests__/guest-profile.test.tsx __tests__/signed-in-profile.test.tsx`
Expected: PASS

- [ ] **Step 10: Delete now-unused profile components if fully unreferenced**

Run a usage check (`grep -rn "ProfileHero\|ProfileStatCards" app src __tests__`). If nothing outside their own files references them, delete `profile-hero.tsx` and `profile-stat-cards.tsx` and their tests; otherwise leave them. Do not break web.

- [ ] **Step 11: Commit**

```bash
git add "app/(app)/profile.tsx" src/components/profile src/i18n/locales/en/profile.ts src/i18n/locales/fr/profile.ts __tests__/guest-profile.test.tsx __tests__/signed-in-profile.test.tsx
git commit -m "feat: realign profile to the mockup identity + library-rows layout"
```

---

### Task 4: Verify the whole slice

**Files:**
- Test only

- [ ] **Step 1: Run the slice-focused test set**

Run: `npm test -- --runInBand __tests__/app-tab-bar.test.tsx __tests__/guest-profile.test.tsx __tests__/signed-in-profile.test.tsx __tests__/guest-library-screen.test.tsx __tests__/signed-in-library-screen.test.tsx`
Expected: PASS

- [ ] **Step 2: TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Manual smoke (phone + iPad, light + `midnight`)**

- tab bar: 4 labels on one line each, centered, no overflow on the narrowest phone; loupe icon clearly legible
- profile: simple top bar with a centered settings gear (no floating banner button); identity row, 3 stats, "Ma bibliothèque" rows route to Library, "Compte" rows present
- profile guest: gate + create-account CTA still shown
- settings still reachable from the profile gear
- verify all of the above against `midnight` for contrast

---

## Self-Review

- Spec coverage: addresses exactly the shipped-surface defects raised in slice-2 review (tab bar overflow/centering/icon size, search loupe, profile/mockup divergence, off-center settings button) without pulling in deferred features.
- Scope discipline: no avatar edit, no resume/history wiring, no chip filtering, no Explore behaviour, no paywall sheet.
- Token & responsive compliance: every new surface uses `theme.colors.*` + `useResponsive`; tab bar gains the responsive scaling it was missing.

## Next Slice After This One

Resume the validated roadmap order: **Slice 3 — contextual paywall sheet** (`docs/plans/2026-06-05-media-prototype-planning-slides.md` Slide 9 / Slice 3), then Slice 4 Explorer V1.
