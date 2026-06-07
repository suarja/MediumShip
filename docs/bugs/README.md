# Bug post-mortems

Short write-ups for non-obvious bugs that burned time in development. Goal: help the next agent (or human) avoid repeating the same mistake.

Each file is dated and scoped to one root cause. Link them from `AGENTS.md` / `CLAUDE.md` when the lesson applies broadly.

| Date | Topic | Summary |
|------|--------|---------|
| 2026-06-07 | [Clerk vs Convex auth](./2026-06-07-clerk-vs-convex-auth-member-writes.md) | Member writes looked signed-in in UI but never hit the DB — `useClerkAuth` vs `useConvexAuth`. |
