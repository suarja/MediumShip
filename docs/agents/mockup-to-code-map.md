# Mockup ↔ code orientation map

Field notes for translating the HTML/CSS/JS mockups into the real app. Captures
the key files and the non-obvious things you only learn by doing it once. Read
this **before** redesigning a product surface, alongside the mockup-fidelity
rule in `CLAUDE.md`. Written after the Slice 1/2/2.5 shell+profile convergence.

## 1. The mockup is the visual source of truth — and `styles.css` is the spec

Mockups live in `docs/podapp/project/mobile-mockups/`:

| File | What it gives you |
|------|-------------------|
| `proto-screens.jsx` | Per-screen markup & copy. Each `…Root` is a screen (e.g. `ProfileRoot` ≈ lines 210-294: guest gate vs member `p2` layout). |
| `proto-app.jsx` | The shell: `TABS` array + `.tabbar` render (≈ 59-203). |
| `styles.css` | **The precise spec** — exact px, `letter-spacing`, font family, and color tones. Always read this, not just the jsx. Key blocks: `.tabbar/.tab__i/.tab__l` (300-319), `.gate*` badges (820-832), `.p2__*` unified profile (834-911). |

Gotcha: the jsx shows structure and copy; the **px sizes, weights, and tones
live in the CSS**. Pull numbers from `styles.css`, e.g. tab label is `.tab__l`
`9px` mono uppercase `letter-spacing:.08em` → in code `fontSize: 9 * scaleFont`,
`fontFamilies.mono`, `letterSpacing: 0.8`.

The mockup `.phone--lg` selector = the large/tablet breakpoint → maps to the
`isTablet` branch of `useResponsive` (e.g. `.phone--lg .p2__av { 60px }` →
`(isTablet ? 60 : 52) * scaleSpace`).

## 2. Mockup CSS vars → theme tokens (adapted, not literal)

The mockup uses CSS custom properties; the app uses theme tokens from
`src/features/theme/palette-catalog.ts`. Approximate mapping:

| Mockup var | Token (`theme.colors.*`) |
|------------|--------------------------|
| `--brand-bg` | `canvas` |
| `--brand-surface` | `surface` |
| `--brand-ink` | `heading` |
| `--brand-ink-soft` / `--brand-muted` | `textMuted` |
| `--brand-rule` | `border` |
| `--brand-accent` | `accent` |
| `--brand-accent-soft` | `accentSoft` |
| `--brand-premium` | `premium` |
| `--font-display` / `--font-mono` | `fontFamilies.display` / `.mono` |

- **Never hardcode colors.** Translucency via `withAlpha(color, a)` from
  `src/features/theme/contrast.ts`, never `rgba(...)`.
- The token set is **fixed and shared across all 7 palettes**; adding a token
  means editing every palette. There is **no green/`positive` token** — the
  mockup's green `gate--free` is mapped to `accent` (a real green token is a
  future, all-palettes change).
- `brick` is the default palette; **`midnight` is the only dark one** — always
  re-check contrast against it. `isDark` is on the theme.
- Fonts are weight-specific families (`displayBold`, `bodySemiBold`, …); set the
  weight by picking the family, not `fontWeight`. See `src/features/theme/fonts.ts`.
- **Type sizes:** use `typeScale` (`src/features/theme/type-scale.ts`) ×
  `scaleFont` from `useResponsive`. Do **not** copy mockup px literally when
  they are ≤11 — bump for legibility. Floors and roles:
  `docs/agents/typography.md`.

## 3. Reusable layout patterns already in the code

Don't reinvent these — copy the existing shape:

- **Top bar**: the `topBar / topBarSide / topBarTitle / topBarAction` styles in
  `explore.tsx` and `library.tsx` (mockup `.p2__top` / `.proto-top`). The 34pt
  side boxes keep the title optically centered; put an action glyph/button in
  one side box (kept centered with `textAlign/justifyContent: center`).
- **Responsive**: `src/features/responsive/use-responsive.ts` → `isTablet`
  (≥768), `scaleSpace` (×1.4 tablet), `scaleFont` (×1.3 tablet),
  `contentMaxWidth` (760 tablet). **Every** screen/shared component must consume
  it — the tab bar was the one surface that didn't, which was the Slice 2.5 bug.
- **Bottom spacing**: scroll content must clear the floating tab bar AND the mini
  player → add `useTabBarSpace()` + `usePersistentMediaPlayerSpace()` to
  `paddingBottom`.
- **Screen shell**: wrap screens in `Screen` (`src/components/layout/screen`).

## 4. Guest-first architecture & data hooks

The app is **guest-first**: public reading works without Clerk; Clerk only gates
member capabilities. Default route is `/home`.

- `useClerkAuth()` (`src/features/auth/use-clerk-auth.ts`) →
  `{ isLoaded, isSignedIn, userId, user, email, fullName, signOut }`. `signOut`
  just flips state — route guards react, it doesn't navigate.
- `useConvexAuth().isAuthenticated` gates Convex queries — pass `"skip"` as the
  args when not authenticated (`useQuery(api.x, isAuthenticated ? {} : "skip")`).
- Call `api.users.mutations.ensureCurrentUser({})` in an effect when authed;
  read identity via `api.users.queries.getMe`.
- `useBookmarks()` → `{ bookmarks, isMember, isMembershipLoading }`. Bookmarks are
  **free for any signed-in account**; `useDownloads({ enabled })` is local
  storage-backed and **premium-only**. Membership gate: `useIsMember()` (see the
  stable entitlement read API note in agent memory).

## 5. Navigation

Expo Router; routes under `app/(app)/`: `home, explore, library, profile,
premium, settings`. The tab bar (`src/components/navigation/app-tab-bar.tsx`)
renders only routes whose `options.href !== null` and that appear in `TAB_META`
— so `premium` and `settings` exist as routes but are **hidden** from the bar
(reached via `router.push("/premium")` / a gear linking to `/settings`).

## 6. i18n

- Modular per feature: `src/i18n/locales/{en,fr}/<feature>.ts` (never one
  monolith). A screen can load several namespaces: `useTranslation(["profile",
  "common"])` then `t("common:status.loading")`.
- **FR files use unaccented ASCII** for many strings by convention — match the
  surrounding file when adding keys.
- Plurals: i18next `_one` / `_other` suffixes + `{{count}}`.

## 7. Testing the UI

- Unit tests (jest + `@testing-library/react-native`) render a screen and mock
  `expo-router`, `convex/react`, the auth/bookmarks/downloads hooks,
  `useTabBarSpace`, `usePersistentMediaPlayerSpace`. The **theme provider is not
  mocked** — `useAppTheme()` has a working default outside a provider.
- Watch for `getByText` collisions: two nodes sharing a string (e.g. a stat
  label and a nav-row title both "Saved") make `getByText` throw — keep such
  copy distinct.
- For the pixel pass, see `docs/agents/ui-visual-testing.md`.
- Noise: a `.claude/worktrees/…` worktree is also scanned by jest, so you'll see
  duplicate `PASS` lines for some suites — expected, not a double-run bug.

## 8. Gotchas that cost time the first round

1. **Read `styles.css`, not only the jsx** — the jsx omits sizes/tones.
2. **Nav rows ≠ content shelves.** Slice 2 deliberately removed content
   *shelves* from the profile; Slice 2.5 re-added lightweight *navigation* rows
   (links into Library). They look similar but are different concepts — don't
   resurrect shelves.
3. **The profile banner-hero was an app invention** (`ProfileHero` /
   `ProfileStatCards`, now deleted) that diverged from the mockup `p2` layout,
   which has no banner. When the app and mockup disagree, the mockup wins.
4. **Signed-in & palette-switch states can't be headless-screenshotted** (Clerk
   auth + Settings persistence) — cover with tests + a manual pass.

## 9. When in doubt

Check the reference repos before inventing (per `CLAUDE.md`):
`../editia/mobile` first, then `../editia/web`, then `../Ideo/IdeoMobile`.
Roadmap baseline: `docs/plans/2026-06-03-mediumship-architecture-design.md` and
the slice plans in `docs/superpowers/plans/`.
