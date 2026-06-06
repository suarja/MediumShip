# Mobile UI slice — verification & acceptance

Use this checklist **before declaring any mobile UI polish slice done** and
**before starting the next slice**. The human reviewer is the final gate.

Supervision reference: `docs/superpowers/specs/2026-06-06-mobile-ui-supervision-slices-design.md` (Slice 6).

---

## 1. Required reading (implementer)

Before coding a slice:

| Doc | Why |
|-----|-----|
| `CLAUDE.md` / `AGENTS.md` | Theme tokens, guest-first, delivery rules |
| `docs/agents/mockup-to-code-map.md` | Mockup CSS → tokens, layout patterns |
| Relevant `docs/podapp/project/mobile-mockups/proto-screens.jsx` screen | Visual source of truth |
| Slice plan in `docs/superpowers/plans/` | Scoped tasks + file list |
| `CONTEXT.md` | Product language |

---

## 2. Automated checks (agent runs every slice)

Run in order; all must pass before asking for human visual review.

```bash
# Jest — app/, src/
npm test

# Convex — convex/**/*.test.ts
npm run test:convex

# Types
npx tsc --noEmit
```

**Color compliance** on touched UI files:

```bash
# Expect no matches except documented literals in card-presentation.ts
rg -n "#|rgba\\(" <touched-paths>
```

Allowed documented exceptions:

- `src/features/content/card-presentation.ts` — `PREMIUM_ON_FILL`, `OVER_MEDIA`
- `src/features/theme/palette-catalog.ts` — palette source definitions only

**Slice-focused tests:** when a slice touches specific screens, also run:

```bash
npm test -- --runInBand --forceExit __tests__/<relevant>.test.tsx
```

---

## 3. Headless visual smoke (agent)

Follow `docs/agents/ui-visual-testing.md`:

1. Start Expo web on a fresh port (`CI=1 EXPO_OFFLINE=1 npx expo start --web --port …`)
2. Confirm bundle compiles
3. Screenshot **changed routes** at phone (390×844) and iPad (834×1112) widths
4. Inspect PNGs for overflow, clipping, blank frames, obvious layout breaks

Default routes for full supervision closure:

- `/home`, `/explore`, `/library`, `/profile`

Add slice-specific routes (e.g. `/lists`, `/category/…`) when touched.

---

## 4. Manual review only (human)

Cannot be driven headlessly today:

| Case | What to check |
|------|----------------|
| **Clerk auth** | Guest gate, signed-in free, premium (`settings-debug` shows `member: pro`) |
| **Palette switch** | At least `brick` (default) + **`midnight`** on every changed surface |
| **Paywall sheets** | Correct `reason` (`lists`, `offline`, `support`, …), not `/premium` route |
| **Capability semantics** | Bookmarks free · offline + lists premium · tenant capability off hides module |

Human signs off with a short “OK visuel” (or notes) before the next slice starts.

---

## 5. Reviewer checklist (visual + semantic)

### Theme & layout

- [ ] No hardcoded hex/rgba in components (`theme.colors.*`, `withAlpha` only)
- [ ] `useResponsive()` on new/changed UI (phone + iPad)
- [ ] Tab bar + bottom inset (`useTabBarSpace`, `usePersistentMediaPlayerSpace`)
- [ ] Top bars: 34×34 side slots, title optically centered
- [ ] Section headers: one title per block (no duplicate 24px + 17px titles)

### Capability gates (regression)

- [ ] Guest: public read works; library/profile gates, no member shelves
- [ ] Signed-in free: saved works; lists/offline → paywall sheet
- [ ] Premium: `/lists`, offline shelf, no spurious paywall on entitled actions

### Surfaces (supervision cycle baseline)

| Surface | Quick check |
|---------|-------------|
| Explorer | Categories, modules, trends; taxonomy labels |
| Bibliothèque | Gate badges, featured card (cover + body), locked offline/lists |
| Profil | Identity, stats, row navigation, guest gate-screen |
| Cards | Image-backed readability; no stray decorative artifacts |

---

## 6. Slice completion definition

A slice is **done** when:

1. Plan tasks committed atomically with tests
2. Section 2 automated checks green
3. Section 3 run for touched routes (or waived with reason in PR/handoff)
4. Section 4 human OK recorded
5. Handoff notes: what changed visually, what to tap, edge cases

---

## 7. After supervision closure

Next vertical work (not part of UI polish):

1. `docs/superpowers/plans/2026-06-06-mobile-polish-slice-6-verification-acceptance.md` — this protocol (done)
2. `docs/superpowers/plans/2026-06-06-personal-lists-crud-member-capability.md` — list CRUD backend + UI

Discovery engine (`docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md`) is a **separate** backend roadmap item — not supervision Slice 6.
