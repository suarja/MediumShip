# Working workflow — slices & agents

How we ship. Short on purpose; every agent should know this.

## Roles

- **Orchestrator agent (planning) — NEVER implements.** It brainstorms, plans a slice, keeps the backlog current, hands off, then verifies + merges. No production code edits by the orchestrator.
- **Implementing agent — writes the code.** Routing by model:
  - a **Claude sub-agent** (spawned by the orchestrator) → **Sonnet 4.6**;
  - **Cursor Composer** (driven by the user) → **Composer 2.5**.

## The loop

1. **Brainstorm** the idea with the user. The orchestrator **activates the relevant skills itself**:
   - architecture / deepening decisions → `improve-codebase-architecture`;
   - sharpening domain terms, grilling a design, ADRs → `grill-with-docs`.
2. **Read the whole backlog first** (`docs/superpowers/backlog.md`) and reconcile the request with what's already planned. Don't implement verbal asks in isolation.
3. **Plan the slice** as a doc in `docs/superpowers/plans/` following the house template (Read First with the agent-protocol docs + a standard final verification task). Tell the implementing agent which skills to use:
   - backend `convex/**` → read `convex/_generated/ai/guidelines.md`, Vitest + convex-test;
   - frontend `app/` + `src/` → skill `frontend-design`, mockups in `docs/podapp/project/mobile-mockups/` as source of truth, Jest.
4. **Hand off** a *concise* prompt: branch a **local branch from `dev`** (never an isolated worktree — it blocks the agent's Bash; never cherry-pick), follow the plan, atomic commits, don't merge.
5. **Verify** the agent's work (tsc + the right test suite + a review/smoke), then **merge to `dev`**.

## Invariants

- **`dev` must be current before any handoff** — an implementing agent branches from `dev`; merge all prerequisites first. ([[dev-current-before-spawning-agents]])
- **Update the backlog after shipping** — mark items done, add what surfaced. ([[consult-backlog-before-slicing]])
- **Test where code lives** — Jest for `app/`+`src/`, Vitest + convex-test for `convex/**`.
- **No hardcoded colors/sizes** (theme tokens + responsive), **clean dead code in the same change**.
