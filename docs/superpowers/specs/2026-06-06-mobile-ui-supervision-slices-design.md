# Mobile UI Supervision Slices Design

## Goal

Define the supervision document that will guide future agentic implementation of
the next mobile polish tranche for `Explorer`, `Bibliotheque`, and `Profil`.

This document is not an implementation plan. It defines:

- the decomposition strategy to hand off to future agents
- the shared constraints that every slice must obey
- the slice structure for the future supervision document
- the verification model the human reviewer will use between slices

## Why This Document Exists

The current mobile app has several fidelity and cohesion gaps that cannot be
treated as isolated visual bugs:

- some icons are undersized relative to the rest of the UI
- some text hierarchies drift away from the mockup and from nearby screens
- some premium/member gates are visually or semantically misleading
- some cards with background imagery need a theme-aware readability treatment
- category/tag/collection concepts are not yet clearly supervised as one system
- some surfaces still contain placeholder or hardcoded copy
- the theme surface is not yet aligned between the mobile app and the CMS

If these issues are delegated as individual micro-fixes, the next agent will
likely patch symptoms without repairing the surface as a whole. The supervision
bundle must therefore group related issues into a small number of **vertical,
reviewable slices**.

## Inputs Read For This Design

Primary reference sources:

- `docs/podapp/project/mobile-mockups/`
- `docs/plans/2026-06-05-media-prototype-planning-slides.md`
- `docs/superpowers/plans/2026-06-06-slice-2_5-shell-polish-profile-fidelity.md`
- `docs/superpowers/plans/2026-06-06-slice-3-explorer-v1-and-paywall.md`

Relevant product constraints already validated elsewhere:

- mobile remains `guest-first`
- `bookmark / enregistrer` stays free for signed-in members
- `offline` and personal lists remain premium capabilities
- visual fidelity must follow the `podapp` mockups
- mobile color usage must come from theme tokens only

## Chosen Decomposition

The approved decomposition strategy is:

1. split by **product surface**
2. keep the number of slices intentionally low
3. merge thin transverse concerns into the nearest surface when possible
4. keep one explicit slice for shared visual-system and verification rules

This is preferred over:

- splitting by bug type (`icons`, `colors`, `copy`, `premium gates`)
- splitting by technical layer (`components`, `screens`, `data`, `tests`)

Those alternatives are analytically clean, but they would create thin slices and
force the implementing agent to reconstruct product meaning across several
documents.

## Deliverable Shape

The next document to write from this design is a **slice-oriented supervision
document**, not an implementation runbook.

Each slice must help a future agent answer:

- what surface is being corrected
- why this surface matters to the product experience
- which source files and mockups must be read first
- which mistakes are currently visible
- which guardrails are mandatory
- how the human reviewer will validate the result

Each slice will use the same structure:

- `But`
- `Constats`
- `References a lire`
- `Travail attendu`
- `Garde-fous`
- `Verification`

This keeps the slices useful for delegation while avoiding task-level
over-specification.

## Approved Slice Structure

The supervision bundle should contain **6 slices**.

### Slice 1 - Cadre du chantier

Purpose:

- define the scope of this polish tranche
- anchor the work in the `podapp` mockups
- set the non-negotiable cross-cutting rules

Must include:

- this is a mobile convergence/polish tranche, not a fresh feature design
- reference source of truth: `docs/podapp/project/mobile-mockups/`
- no hardcoded colors in mobile components
- all palettes/themes must remain valid, including palettes present in the app
  but not yet fully aligned with the CMS
- commits should stay atomic per validated slice
- verification requires tests, typecheck, and visual smoke
- member states must stay explicit: `guest / member / premium`

### Slice 2 - Explorer + taxonomie

Purpose:

- supervise the `Explorer` surface as a complete discovery screen
- keep taxonomy issues attached to the screen where they are felt

Must include:

- search bar fidelity, especially loupe sizing
- top title hierarchy and button sizing
- category navigation and category detail affordances
- tags shown in section headers vs actual categories of navigation
- distinction between `collections`, `categories`, and trending/tag concepts
- provenance of categories and the likely need for a category icon strategy
- fidelity check against the `Explorer` mockup, not just current app behavior

### Slice 3 - Bibliotheque + capacites

Purpose:

- supervise personal surfaces and capability gating where the user feels them

Must include:

- `Reprendre`, `Enregistres`, `Mes listes`, `Hors-ligne`
- correction of the offline state so it reads as a premium capability, not a
  generic empty state
- CTA review, especially any `Devenir membre` or similar copy that may be
  hardcoded or badly themed
- large cards for saved/offline states
- personal lists typography and component correctness
- section title alignment and locked-state clarity
- consistency with already-validated rules: bookmarks free, offline premium,
  personal lists premium

### Slice 4 - Profil + continuite de lecture

Purpose:

- supervise `Profil` as identity/account surface without reabsorbing
  `Bibliotheque`

Must include:

- the current `Reprendre` module and whether it is still placeholder-only
- removal of emojis, dummy text, or hardcoded placeholder fragments
- avatar/status/premium CTA/account actions
- verification of what is already covered by existing slice plans versus what
  still needs to enter the supervision bundle
- boundary between what remains in `Profil` and what should belong to
  `Bibliotheque`

### Slice 5 - Cartes, overlays et systeme visuel

Purpose:

- collect the shared visual issues that would otherwise leak across several
  tiny slices

Must include:

- article or content cards with background imagery and text overlay
- theme-aware readability treatment for image-backed cards
- removal or redesign of visually strange decorative artifacts such as the
  reported circle on the right
- shared icon sizing audit: tab bar, navigation bar, loupe, back buttons
- shared typography and spacing audit across touched surfaces
- theme alignment between app and CMS where palette coverage is incomplete

This slice is intentionally transverse, but it remains concrete because it is
limited to visible mobile UI fidelity rather than broad design-system refactors.

### Slice 6 - Verification et criteres d'acceptation

Purpose:

- define how each future slice will be reviewed before the next one starts

Must include:

- required reading before implementation
- expected automated checks
- `npm test`
- `npx tsc --noEmit`
- Expo web + headless Chrome protocol for phone and iPad widths
- explicit note that auth-gated states and palette switching still require
  manual review
- reviewer checklist for visual fidelity, theme compliance, and capability
  semantics

## Review Model

The human reviewer is expected to remain the final gate between slices.

Workflow:

1. a future agent receives one slice-aligned slice
2. the agent implements the slice
3. the human reviewer checks the result against both:
   - the relevant product-surface slice
   - the transverse rules from Slice 1 and Slice 6
4. only then does the next slice begin

This review loop is essential because several of the targeted issues are not
purely technical failures. They are visual, semantic, and product-language
failures that require a human check.

## Boundaries And Non-Goals

This supervision design does not yet:

- define task-by-task implementation instructions
- choose exact file edits for each future slice
- rewrite the current existing implementation plans
- commit to a full module-system redesign
- commit to a category CMS model immediately
- expand scope into unrelated features such as notifications

Those topics may appear in later implementation plans, but they are not needed
for the supervision bundle itself.

## Relationship To Existing Plans

This design should sit above the current mobile slice plans, not replace them.

It is meant to:

- consolidate scattered concerns from the existing plans
- capture newer supervision remarks that are not yet grouped coherently
- reduce orchestration overhead for future agent prompts
- give the human reviewer a compact shared language for validation

## Acceptance Criteria For This Design

This design is successful if the future supervision bundle:

- stays at roughly `6` meaningful slices rather than `10+` thin slices
- remains vertical from the point of view of product surfaces
- keeps transverse design-system concerns visible without splitting them into
  tiny isolated work items
- helps another agent understand what to fix without yet dictating every code
  change
- gives the human reviewer a clear basis for approval or rejection after each
  slice

## Next Step

After review and approval of this design document, write the actual supervision
document that follows the six-slice structure above.
