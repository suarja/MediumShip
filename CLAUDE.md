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
- `../Ideo/IdeoMobile` second for additional Expo + Convex patterns
- web references only when the mobile repos do not already answer the question

### Mobile foundation rules

- For Clerk + Convex in Expo, prefer the proven `ConvexProviderWithClerk` pattern over a plain `ConvexProvider` when authenticated queries are involved.
- Keep translations modular and split by page or feature. Do not accumulate all strings in one monolithic translation file.
- Treat iPhone and iPad responsiveness as a first-pass requirement, not a later polish pass.

## Commit workflow

Prefer regular, small, atomic commits as the work progresses. Do not batch unrelated changes together. See `docs/agents/commit-workflow.md`.
