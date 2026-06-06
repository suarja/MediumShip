# Personal Lists CRUD — Member Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/lists` stub and library/profile preview placeholders with real user-owned personal lists: create, rename, delete, add/remove content, and premium-aware limits — without blurring editorial `collections` with user lists.

**When to start:** **Only after** the mobile UI supervision cycle in progress is finished:

1. **Slice 5 — Cartes, overlays et systeme visuel** (`docs/superpowers/specs/2026-06-06-mobile-ui-supervision-slices-design.md`)
2. **Slice 6 — Verification et criteres d'acceptation**

Do **not** start this plan while slice 5 or 6 is still open. The current `/lists` UI, paywall wiring, and `LibraryPersonalListRow` preview are the integration surface — polish them in supervision first.

**Architecture:** Mirror the proven `bookmarks` vertical slice: small Convex tables, auth helpers, Vitest authz tests, a client hook, then mobile screens. Gate writes and unlimited lists on **premium** (`requireMember` / `isPro`). Free signed-in members may keep **one** list (mockup rule in `proto-screens.jsx` `ListsView`). Distinct from editorial `collections` tables — never reuse collection CMS models for user lists.

**Tech Stack:** Convex, Vitest + convex-test, Expo Router, React Native, i18next, Jest

---

## Read First

- `docs/superpowers/specs/2026-06-06-mobile-ui-supervision-slices-design.md`
- `docs/FEATURES.md` — editorial collections vs user lists
- `docs/podapp/project/mobile-mockups/proto-screens.jsx` — `ListsView` (~485-521)
- `convex/bookmarks/` — reference patterns for authz + queries + mutations
- `convex/entitlements/` — `requireMember`, `getMyEntitlement`
- `app/lists.tsx` — stub to replace
- `src/components/library/library-personal-list-row.tsx`
- `app/(app)/library.tsx` / `src/components/profile/profile-library-rows.tsx` — entry points
- `convex/_generated/ai/guidelines.md`
- `CLAUDE.md`

Product rules (already validated in polish slices):

- `personalLists` capability must be enabled on the tenant (`hasCapability`)
- **Premium** unlocks unlimited lists + multi-device sync messaging
- **Free signed-in** may use **one** list; additional create attempts → `openPaywall("lists")`
- Guests never reach list CRUD (sign-in / paywall gates stay as today)

---

## Scope Guard

Includes:

- Convex schema: `personalLists`, `personalListItems`
- Authz: owner-only reads/writes; premium check for create beyond free tier limit
- Queries: list for current user, list detail with resolved public content cards
- Mutations: create, rename, delete list; add/remove/reorder items
- `usePersonalLists()` hook
- `/lists` hub wired to real data (replace `Alert` stubs)
- `/list/[id]` detail screen (mockup list open)
- Library + Profile preview row shows first list when present
- i18n `lists` namespace (split from `library` screen copy)
- Vitest authz tests + Jest hook/screen tests

Does **not** include:

- adding to list from every content surface (optional follow-up task at end if small)
- resume / `playbackProgress` wiring (separate slice)
- CMS authoring of user lists
- sharing / public lists
- offline sync of list metadata beyond Convex defaults

---

## Domain Model (proposed)

```ts
personalLists: {
  tokenIdentifier: string,
  title: string,
  visibility: "private", // only value in v1
  createdAt: number,
  updatedAt: number,
}
  .index("by_tokenIdentifier_and_updatedAt", ["tokenIdentifier", "updatedAt"])

personalListItems: {
  listId: Id<"personalLists">,
  contentId: Id<"contents">,
  position: number, // integer order key
  addedAt: number,
}
  .index("by_listId_and_position", ["listId", "position"])
  .index("by_listId_and_contentId", ["listId", "contentId"])
```

---

## File Structure

- `convex/personalLists/schema.ts` or extend `convex/schema.ts`
- `convex/personalLists/authz.ts`
- `convex/personalLists/queries.ts`
- `convex/personalLists/mutations.ts`
- `convex/personalLists/authz.test.ts`
- `src/features/personal-lists/use-personal-lists.ts`
- `src/features/personal-lists/types.ts`
- `app/lists.tsx` — hub (replace stubs)
- `app/list/[id].tsx` — detail
- `src/components/library/library-personal-list-row.tsx` — accept real list props
- `app/(app)/library.tsx` — preview from hook
- `src/components/profile/profile-library-rows.tsx` — `subMember` with real count
- `src/i18n/locales/{en,fr}/lists.ts`
- `__tests__/lists-screen.test.tsx`
- `__tests__/signed-in-library-screen.test.tsx` — update mocks

---

### Task 1: Convex schema + list CRUD authz

**Files:** `convex/schema.ts`, `convex/personalLists/*`, `convex/personalLists/authz.test.ts`

- [ ] Vitest: guest cannot list/create; free member can create one list; second create throws or returns paywall signal; premium can create many
- [ ] Implement `listMine`, `getById`, `create`, `rename`, `delete` with owner checks
- [ ] Run `npm run test:convex -- personalLists`

---

### Task 2: List items mutations

**Files:** `convex/personalLists/mutations.ts` (items), tests

- [ ] Vitest: add/remove item, idempotent add, cannot add to another user's list
- [ ] Resolve content through existing public content read helpers (guest-first read model)

---

### Task 3: Client hook

**Files:** `src/features/personal-lists/use-personal-lists.ts`

- [ ] Jest: hook shapes (loading, empty, populated) with mocked Convex
- [ ] Expose `lists`, `primaryList`, `createList`, `isAtFreeLimit`

---

### Task 4: `/lists` hub — replace stubs

**Files:** `app/lists.tsx`, `src/i18n/locales/{en,fr}/lists.ts`

- [ ] Remove `Alert` pending actions
- [ ] Create row calls `createList` or paywall when at free limit
- [ ] Render real `LibraryPersonalListRow` per list → `router.push(/list/[id])`
- [ ] Keep category-style back chrome from polish slice
- [ ] Jest: premium member sees lists from hook mock

---

### Task 5: List detail screen

**Files:** `app/list/[id].tsx`, row component reusing `FeedRow` or compact library row

- [ ] Header: title, back, optional rename/delete actions (sheet or inline)
- [ ] Items list with links to `/{kind}/{id}`
- [ ] Empty state when list has no items

---

### Task 6: Library + Profile integration

**Files:** `library.tsx`, `profile-library-rows.tsx`, `library-personal-list-row.tsx`

- [ ] Library lists section: show first list preview when `primaryList` exists; else keep current preview/locked card semantics
- [ ] Profile lists row subtitle: pluralized count from hook
- [ ] Update signed-in library/profile tests

---

### Task 7: Verify slice

- [ ] `npm run test:convex`
- [ ] `npm test` (Jest)
- [ ] `npx tsc --noEmit`
- [ ] Manual: guest, free (1 list), premium (multiple), paywall on second create, midnight palette

---

## Self-Review

- Starts only after supervision slices 5–6 to avoid fighting transverse card/overlay work.
- Reuses bookmarks auth patterns instead of inventing a parallel stack.
- Keeps editorial `collections` and user `personalLists` separate per `FEATURES.md`.

## Sequencing Relative To Other Roadmap Items

| Track | Item | Relationship |
|-------|------|----------------|
| **Now (in progress)** | Supervision slice 5 — cards/overlays | Finish first |
| **Next** | Supervision slice 6 — verification protocol | Finish second |
| **Then** | **This plan** — personal lists CRUD | Replaces `/lists` stubs |
| Later | Resume / `playbackProgress` | Sibling member-capability slice |
| Later | Slice 5 CMS (`2026-06-06-slice-5-cms-authoring-avatar-capabilities.md`) | Editorial collections; capability toggles already gate `personalLists` UI |

---

## Acceptance Criteria

- Premium member can create multiple lists, open detail, add/remove items (via detail flow minimum).
- Free signed-in member can maintain exactly one list; second create opens paywall.
- No stub `Alert` on create/open list.
- Profile and Library entry points reflect real counts/titles.
- All authz rules covered in Vitest; primary screens covered in Jest.
