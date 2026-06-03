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
