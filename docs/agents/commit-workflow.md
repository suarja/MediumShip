# Commit Workflow

Use regular, small, atomic commits as work progresses through the repo.

## Rules

- Commit early and often when a unit of work is coherent and reviewable.
- Keep each commit scoped to one logical change.
- Do not mix unrelated changes in the same commit.
- Prefer a sequence of clean incremental commits over one large catch-up commit.
- If a task spans several steps, commit at stable checkpoints rather than waiting for the entire task to finish.
- If a slice is already implemented and verified locally, commit it before moving on to the next major area instead of letting validated work pile up in the tree.
- Prefer commits that land a testable vertical slice over commits that only add invisible plumbing.
- When adding a new platform or backend brick such as Clerk or Convex, try to pair it with the smallest possible end-to-end test surface in the same short sequence of work.

## Intent

This repo should advance in steady, readable steps so history stays easy to review, revert, and continue from.

It should also advance through slices that can be exercised quickly in the running app, not only through abstract infrastructure milestones.
