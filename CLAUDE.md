## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for this repo. Use `gh` CLI workflows as the default interface. See `docs/agents/issue-tracker.md`.

### Triage labels

This repo uses the default Matt Pocock triage label vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This repo uses a single-context layout with one root `CONTEXT.md` and ADRs in `docs/adr/`. See `docs/agents/domain.md`.

### Convex components

Before proposing, prototyping, or implementing a Convex-backed feature, review `docs/convex-components-descriptions.md` and prefer an existing component over a custom build when it fits.

### Reference repos

When implementation details are unclear, consult `docs/research/2026-06-03-reference-repositories.md` and reuse proven patterns from the reference repos before inventing a new approach.

Priority order:
- `../editia/mobile` first for production-grade mobile patterns
- `../editia/web` second when mobile topics benefit from an existing Editia web pattern, especially for i18n, design tokens, theming, and reusable product surfaces
- `../Ideo/IdeoMobile` third for additional Expo + Convex patterns
- only invent a new pattern after checking the existing Editia bases and confirming they do not fit cleanly

### Mobile foundation rules

- **Never hardcode colors. Ever.** Every color must come from the active theme tokens (`theme.colors.*` via `useAppTheme()`), never a literal hex/rgba in a component. The palette is user-selectable in Settings and includes a dark `midnight` palette, so do not assume a token is light or dark — pair backgrounds and foregrounds from tokens that move together (e.g. `heading` background ↔ `canvas` foreground, `accent` ↔ `accentContrast`). For translucent variants use the `withAlpha(theme.colors.x, a)` helper, not a literal `rgba(...)`. If a needed color is missing, add a token to every palette in `src/features/theme/palette-catalog.ts`. Verify against all palettes (especially `midnight`) before declaring done. Fonts likewise come from the centralized theme `fontFamilies`.
- For Clerk + Convex in Expo, prefer the proven `ConvexProviderWithClerk` pattern over a plain `ConvexProvider` when authenticated queries are involved.
- Keep translations modular and split by page or feature. Do not accumulate all strings in one monolithic translation file.
- Treat iPhone and iPad responsiveness as a first-pass requirement, not a later polish pass.
- For translations and design system work, start by inspecting `../editia/mobile`, then complement with `../editia/web` when useful, and adapt what is already production-proven before creating new abstractions.

### Delivery rules

- Prefer testable vertical slices over horizontal infrastructure-only progress whenever possible.
- Each new foundation brick should become manually testable quickly through a minimal end-to-end surface, even if the UI is temporary.
- For auth work, expose a small test page or flow early so Clerk wiring can be validated in the app, not only in code structure.
- For Convex work, start with a tiny schema and query/mutation path that can be exercised immediately before broadening the model.
- Build the product through small end-to-end slices that can be verified incrementally, rather than stacking several invisible backend or provider layers before testing.

### Current architecture direction

The validated architecture direction is recorded in:

- `docs/plans/2026-06-03-mediumship-architecture-design.md`
- `docs/superpowers/plans/2026-06-03-guest-first-public-read-model.md`

Treat these decisions as the current roadmap baseline unless the user explicitly revises them.

Current baseline:

- The mobile app is `guest-first`, not `auth-first`.
- Public reading should work without `Clerk`; `Clerk` is only for member capabilities such as premium, bookmarks, sync, downloads, and personalization.
- The first implementation milestone is the public read model: multi-format feed, public article/episode/video detail, and first-pass degraded network states.
- The first CMS will be a mono-tenant internal web app, likely `Next.js`, sharing the same `Convex` backend.
- Product configuration stays schema-bounded: `ThemeConfig`, `NavigationConfig`, `FeedSectionConfig`, enabled modules, and targeted feature flags.
- `Video` supports both `YouTubeVideo` and `HostedVideo`, but offline premium only applies to `Article`, `Episode`, and `HostedVideo`.
- Resilience should prefer graceful degradation, local cache, and an external incident-status channel over early multi-backend failover.

## Commit workflow

Prefer regular, small, atomic commits as the work progresses. Do not batch unrelated changes together. See `docs/agents/commit-workflow.md`.

Additional rule:
- Once a coherent slice is implemented and verified locally, commit it before starting the next major area of work. Do not accumulate several validated slices in the worktree.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
