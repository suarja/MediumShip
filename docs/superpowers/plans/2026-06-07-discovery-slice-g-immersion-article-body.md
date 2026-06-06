# Discovery Slice G — Immersion v1 : corps d'article réel (JIT, sans hypertexte)

> **Letter nomenclature** (parallel numeric slices run by other agents). Builds on Slices D–F. Branch from the latest discovery branch (or `dev` once merged).

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Vitest-first for `convex/**`, Jest-first for `app/`+`src/`. UI tasks → invoke `frontend-design`. Read `convex/_generated/ai/guidelines.md` before `convex/`. Steps use `- [ ]`.

**Goal:** tapping a Wikipedia card opens the **full article body**, not the extract. The body is fetched **just-in-time** on open and **cached** into `contents.articleBody`, then rendered. **No hyperlink navigation yet** (full `/wiki/` link-rewrite + JIT graph = a later slice).

**Generic / white-label:** the detail screen stays generic — it renders `articleBody` for any `Content`. Only the **fetch** of a missing body is provider-specific (Wikipedia implements it; CMS content already has its body). A YouTube-only tenant never triggers the Wikipedia path.

**Scope of the fetch (simple):** full **plaintext** via MediaWiki `extracts&explaintext=1` **without** `exintro` (the whole article, not the intro). No HTML rendering, no links — that keeps v1 contained. Hyperlinks/JIT graph come in Immersion v2.

**End-to-end proof:** tap a Wikipedia card → brief loading → the **full article text** renders (paragraphs), not just the 2-line extract; re-open the same article → instant (cached in `articleBody`); CMS articles unchanged.

---

## Read First

- `docs/adr/0004-content-discovery-engine.md` §5 (Immersion) — note: v1 here is **deliberately the simple subset** (no link inversion/JIT graph).
- `convex/discovery/providers/wikipedia.ts` — existing MediaWiki fetch helpers (`mediaWikiFetch`, extracts params, User-Agent); add a full-body fetch.
- `convex/content/queries.ts` (`getPublishedById` — the reactive detail query), `convex/schema.ts` (`contents.articleBody` already exists).
- `app/article/[id].tsx` — the article detail screen (covers Wikipedia, kind `article`); how it renders `articleBody` today.
- `src/features/content/*` selectors/types.
- `convex/_generated/ai/guidelines.md`, `CLAUDE.md`.

Standing rules: no hardcoded colors (tokens + `withAlpha`, `midnight`); responsive; modular i18n; remove dead code in the same change.

---

## Scope Guard

Includes:

- Provider full-body fetch: `fetchWikipediaArticleBody(pageId|title)` → full plaintext (`explaintext=1`, no `exintro`).
- A Convex **action** `fetchArticleBody({ contentId })` that, for a `wikipedia` content with no `articleBody`, fetches + **patches** `contents.articleBody` (cache). Idempotent / no-op if body already present or content not wiki.
- Article detail screen: on open, if `articleBody` is missing and the content is a fetchable provider, call the action; show a loading state; render the body (reactive query surfaces it once patched).
- Generic rendering of `articleBody` as readable paragraphs.

Does **not** include:

- Hyperlink rewriting (`/wiki/...` → internal routes), JIT link resolution, graph persistence (Immersion v2).
- HTML rendering (v1 is plaintext).
- Any change to the feed, scoring, ingestion, or other content kinds.

---

## File Structure

- `convex/discovery/providers/wikipedia.ts` — add `fetchWikipediaArticleBody` (+ test).
- `convex/discovery/immersion.ts` — `fetchArticleBody` action (dispatch by `source`; patch `articleBody`) (+ test).
- `app/article/[id].tsx` — JIT body fetch on open + loading state + paragraph rendering.
- Tests: `convex/discovery/providers/wikipedia.test.ts` (extend), `convex/discovery/immersion.test.ts`, `__tests__/article-detail-immersion.test.tsx`.

---

### Task 1: Wikipedia full-body fetch (Vitest-first)

**Files:** `convex/discovery/providers/wikipedia.ts`; `convex/discovery/providers/wikipedia.test.ts`.

- [ ] **Step 1 (Vitest, mocked fetch):** `fetchWikipediaArticleBody(pageId)` requests `extracts&explaintext=1` **without** `exintro`, returns the full plaintext; trims; empty/malformed → empty string. Asserts the request omits `exintro` and carries the User-Agent.
- [ ] **Step 2:** implement, reusing `mediaWikiFetch` + the existing params (drop `exintro`, drop `pithumbsize` etc. — body only).
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): fetch full Wikipedia article body (plaintext)`.

---

### Task 2: `fetchArticleBody` action — JIT + cache (Vitest-first)

**Files:** `convex/discovery/immersion.ts`; `convex/discovery/immersion.test.ts`.

- [ ] **Step 1 (Vitest, convex-test):**
  - For a `wikipedia` content with no `articleBody`: the action fetches (mocked) and **patches** `contents.articleBody`; returns it.
  - Already has `articleBody` → no fetch, no-op (cache hit).
  - Non-wikipedia content (e.g. `cms`) → no fetch (the detail already has its body).
  - Unknown/unpublished content → safe no-op.
- [ ] **Step 2:** implement the action: load the content (`runQuery`/`ctx.runQuery`), dispatch by `source`, fetch via Task 1, `runMutation` to patch `articleBody`. Background-safe; never throws to the UI on a fetch failure (returns empty + leaves a retry path).
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): JIT fetch+cache article body action`.

---

### Task 3: Article detail Immersion (Jest-first + `frontend-design`)

**Files:** `app/article/[id].tsx`; `__tests__/article-detail-immersion.test.tsx`.

- [ ] **Invoke `frontend-design`** for the reading layout (paragraphs, typography, loading state).
- [ ] **Step 1 (Jest, TDD):**
  - Opening a `wikipedia` article with no `articleBody` calls `fetchArticleBody` once (mock the action) and shows a loading state; when the reactive content query returns the patched body, the **full text** renders (multiple paragraphs).
  - A content that already has `articleBody` renders immediately, no fetch.
  - CMS articles unchanged (regression).
  - Guests can read (no auth required to fetch a public body).
- [ ] **Step 2:** implement — `useEffect` on open: if `articleBody` missing → `useAction(fetchArticleBody)`; render `articleBody` split into paragraphs; tokens only.
- [ ] **Step 3:** Jest → PASS; `tsc` clean. **Commit** — `feat(article): Immersion v1 — render full fetched body`.

---

### Task 4: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` → PASS.
- [ ] Hardcoded-color scan clean on changed files.
- [ ] **Live smoke** (dev): tap a Wikipedia card → loading → full article text; re-open → instant (cached); CMS article unchanged; `midnight` + iPad.
- [ ] `git status --short` clean.

---

## Self-Review

- **Real content:** tapping a Wikipedia card now shows the article, not the extract — answers "ça prend la place mais ça n'avance pas".
- **Generic:** the detail renders `articleBody` for any provider; only the body-fetch is provider-dispatched; Wikipedia is the demo implementer.
- **Cheap + cached:** fetched once, persisted to `articleBody`; re-opens are instant and the corpus enriches.
- **Contained:** plaintext only; hyperlink/JIT-graph deferred to Immersion v2.

## After This Slice

- **Immersion v2** — HTML body + `/wiki/` link rewrite to internal routes + JIT resolution & persistence (ADR 0004 §5, full).
- **Onboarding** — generic tenant-taxonomy interest selection to seed cold-start affinities.
