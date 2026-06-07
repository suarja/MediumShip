# Discovery Slice M — Durcissement du seam provider (GATE avant YouTube)

> **Letter nomenclature** (parallel numeric slices). Hardens the ingestion **Provider seam** affirmed by ADR 0004 so it stays provider-agnostic before a second real provider lands. Builds on A–L. Branch from `feat/discovery-slice-k-cms-catalog-picker` (or `dev` once merged).

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Vitest-first for `convex/**` (this slice is backend-only — no mobile UI). Read `convex/_generated/ai/guidelines.md` before touching `convex/`. Steps use `- [ ]`.

**Goal:** make the generic ingestion seam **provider-agnostic** so a second provider drops in without empiling provider-specific args on the shared port — then **prove the seam is real** by adding a second, genuinely-different adapter (an RSS/feed provider). Today `wikipediaLocale` (a Wikipedia-only concept) leaks into the generic `ContentProvider.ingest()` port and into the generic orchestrator (`runDiscoveryIngestion` / `runRefillIngestion` / `getTenantIngestionInputs`). After this slice: **the port is `ingest(ctx, { tenantSlug, demand })`** and each adapter **self-resolves its own config** from an opaque, per-tenant, per-source config blob the orchestrator never reads.

**The leak, concretely (the thing we are removing):**
- `convex/discovery/provider.ts` — `ContentProvider.ingest()` carries `wikipediaLocale?: WikipediaLocale` and imports `WikipediaLocale` into the shared port.
- `convex/discovery/ingest.ts` — `getTenantIngestionInputs` returns `wikipediaLocale`; `runDiscoveryIngestion` + `runRefillIngestion` read `tenant.wikipediaLocale` and thread it to **every** provider.

**Scope of the rule:** the seam that must stay agnostic is the **ingestion orchestrator ↔ providers** boundary in `convex/discovery/**`. The **CMS authoring surface is allowed to know provider specifics** — configuring "Wikipedia has a locale" is exactly the CMS's job. So the CMS langue panel and `convex/cms/catalog.ts` legitimately know about a Wikipedia locale; they just write it into the generic per-tenant provider-config blob instead of a bespoke tenant column.

**Not Wikipedia-specific:** `catalogLocale` is a **CMS display** concern (IPTC label language), not a provider concept — it **stays a tenant field**, untouched. Only `wikipediaLocale` moves.

**Proof of the seam (2 adapters = real seam):** add a minimal but **real** RSS/feed adapter — config is just a list of feed URLs in the tenant's provider-config blob, fetch is injectable (testable with a fake), entries map to `contents` via `upsertIngested` with `source: "rss"`. The generic orchestrator hands `{ tenantSlug, demand }` to both `wikipedia` and `rss`; each self-resolves its config; `rss` no-ops when the tenant has no feeds configured. No API key, no external credentials. (Full **YouTube** provider is the next slice — see `docs/superpowers/backlog.md`.)

---

## Read First

- `docs/adr/0004-aggregation-engine.md` — affirms the hexagonal **Provider** seam (Wikipedia → `contents`, single `ScoringPolicy`, `FetchDemand`). This slice realigns the seam with that decision and records the "adapter self-resolves config" rule in its Consequences.
- `CONTEXT.md` — **Provider** / **FetchDemand** glossary entries (keep language consistent).
- **The seam today:** `convex/discovery/provider.ts` (port + `PROVIDERS` registry + `cmsProvider`), `convex/discovery/ingest.ts` (`getTenantIngestionInputs`, `runDiscoveryIngestion`, `runRefillIngestion`, `upsertIngested` + its `source` validator, `getCategoryOffset`/`advanceCategoryOffset`), `convex/discovery/providers/wikipedia.ts` (`wikipediaProvider`, `ingestWikipediaDemand`, `wikipediaApiUrlForLocale`), `convex/discovery/fetchDemand.ts`.
- **Config sites to migrate:** `convex/schema.ts` (`tenants.wikipediaLocale`, `contents.source` union), `convex/cms/catalog.ts` (`updateLocales` mutation + the getter that returns `wikipediaLocale`), `apps/cms/components/cms/developer-tab.tsx` (CMS langue panel — UX unchanged).
- `convex/categories/catalogLocale.ts` — `WikipediaLocale`, `wikipediaApiUrlForLocale` (stay; only the *plumbing* of locale moves).
- `convex/_generated/ai/guidelines.md`, `CLAUDE.md`.

Standing rules: remove dead code in the same change (the legacy `wikipediaLocale` field/refs go once migrated — `plus tard = jamais`); backend-only, so the hardcoded-color / responsive rules don't apply here.

---

## Scope Guard

Includes:

- **Provider-agnostic port:** `ContentProvider.ingest(ctx, { tenantSlug, demand })` — drop `wikipediaLocale` and the `WikipediaLocale` import from `convex/discovery/provider.ts`.
- **Orchestrator stops knowing about locale:** `getTenantIngestionInputs` no longer returns it; `runDiscoveryIngestion` + `runRefillIngestion` no longer read/thread it.
- **Opaque per-tenant provider config:** `tenants.providerConfigs` (a `record<string, any>` keyed by `source`), which the orchestrator **never reads**. A generic `getTenantProviderConfig({ tenantSlug, source })` internal query that adapters call.
- **Wikipedia adapter self-resolves its locale** from `providerConfigs.wikipedia.locale` inside its own `ingest` (fallback `"en"`).
- **Migration:** move existing `tenants.wikipediaLocale` → `providerConfigs.wikipedia.locale`, unset the legacy field, remove it from the schema and from `convex/cms/catalog.ts` (which now reads/writes through `providerConfigs`). CMS langue panel UX unchanged.
- **Second real adapter (RSS/feed):** `rssProvider` reading `providerConfigs.rss.feeds` (URLs), injectable fetch, entries → `contents` via `upsertIngested` with `source: "rss"`, registered in `PROVIDERS`, no-op when unconfigured. Extends `contents.source` + `upsertIngested` source union to include `"rss"`.
- Record the "adapter self-resolves config; port stays `{ tenantSlug, demand }`" decision in ADR 0004 Consequences.

Does **not** include:

- The full **YouTube** provider (next slice; Data API, quotas, video mapping).
- Any change to the feed **read** path / scoring (locale only affects ingestion).
- Changing the CMS langue panel UX (it keeps two selectors; only its write target moves).
- A real RSS scheduling/polling policy beyond "ingest configured feeds each run, bounded."

---

## File Structure

- `convex/schema.ts` — add `tenants.providerConfigs` (`v.optional(v.record(v.string(), v.any()))`); add `"rss"` to `contents.source`; remove `tenants.wikipediaLocale` (after migration).
- `convex/discovery/providerConfig.ts` (+ test) — generic `getTenantProviderConfig({ tenantSlug, source })` internal query (returns the opaque blob or `null`); a one-off `migrateWikipediaLocaleToProviderConfig` internal mutation.
- `convex/discovery/provider.ts` — agnostic `ContentProvider` port; register `rssProvider`.
- `convex/discovery/ingest.ts` (+ test) — drop locale from `getTenantIngestionInputs` / `runDiscoveryIngestion` / `runRefillIngestion`; extend `upsertIngested` source union.
- `convex/discovery/providers/wikipedia.ts` (+ test) — `wikipediaProvider.ingest` self-resolves locale via `getTenantProviderConfig`.
- `convex/discovery/providers/rss.ts` (+ test) — new `rssProvider`.
- `convex/cms/catalog.ts` (+ test if present) — `updateLocales` writes `providerConfigs.wikipedia.locale`; getter reads from there (fallback `"en"`).
- `docs/adr/0004-aggregation-engine.md` — Consequences note.

---

### Task 1: Opaque provider config storage + generic read (Vitest-first)

**Files:** `convex/schema.ts`; `convex/discovery/providerConfig.ts` (+ test).

- [ ] **Step 1 (Vitest, convex-test):** `getTenantProviderConfig({ tenantSlug, source })` returns the tenant's `providerConfigs[source]` blob (or `null` when absent/unknown source); it reads nothing else. A tenant with `providerConfigs: { wikipedia: { locale: "fr" } }` returns `{ locale: "fr" }` for `source:"wikipedia"` and `null` for `source:"rss"`.
- [ ] **Step 2:** add `tenants.providerConfigs` (`v.optional(v.record(v.string(), v.any()))`) to the schema; implement the internal query.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): opaque per-tenant provider config storage`.

---

### Task 2: Make the port agnostic — drop locale from the seam (Vitest-first)

**Files:** `convex/discovery/provider.ts`; `convex/discovery/ingest.ts` (+ test).

- [ ] **Step 1 (Vitest):** assert the orchestrator no longer carries locale — `getTenantIngestionInputs` returns only `{ aggregatedAffinities, seedCategories }`; `runDiscoveryIngestion` / `runRefillIngestion` call `provider.ingest(ctx, { tenantSlug, demand })` with **no** `wikipediaLocale`. (Use a stub provider in the registry, or assert via type + behavior that ingestion still upserts.)
- [ ] **Step 2:** remove `wikipediaLocale` from `ContentProvider.ingest` and the `WikipediaLocale` import in `provider.ts`; drop locale from `getTenantIngestionInputs`'s return + both orchestrator actions. Wikipedia ingestion will temporarily default to `"en"` until Task 3 — keep the suite green.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `refactor(discovery): provider-agnostic ingestion port (drop wikipediaLocale from the seam)`.

---

### Task 3: Wikipedia adapter self-resolves its locale + migrate config (Vitest-first)

**Files:** `convex/discovery/providers/wikipedia.ts` (+ test); `convex/discovery/providerConfig.ts`; `convex/cms/catalog.ts` (+ test if present); `convex/schema.ts`; `apps/cms/components/cms/developer-tab.tsx` (write target only).

- [ ] **Step 1 (Vitest):** `wikipediaProvider.ingest` resolves locale from `getTenantProviderConfig(source:"wikipedia").locale` (fallback `"en"`); a tenant configured `fr` hits the `fr.wikipedia.org` API URL; unconfigured → `en`. `updateLocales` persists the Wikipedia locale into `providerConfigs.wikipedia.locale` (and still persists `catalogLocale` as a tenant field); the getter reads locale back from `providerConfigs` (fallback `"en"`).
- [ ] **Step 2:** implement adapter self-resolution; point `convex/cms/catalog.ts` read/write at `providerConfigs.wikipedia.locale`; add the one-off `migrateWikipediaLocaleToProviderConfig` internal mutation (per tenant: copy `wikipediaLocale` → `providerConfigs.wikipedia.locale`, then unset the legacy field); **remove `tenants.wikipediaLocale` from the schema** and every remaining reference (dead code goes now). CMS langue panel UX unchanged — only its write target moved.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `refactor(discovery): Wikipedia adapter self-resolves locale from provider config`.

---

### Task 4: Second real adapter — RSS/feed provider proves the seam (Vitest-first)

**Files:** `convex/discovery/providers/rss.ts` (+ test); `convex/discovery/provider.ts`; `convex/discovery/ingest.ts` (source union); `convex/schema.ts` (`contents.source`).

- [ ] **Step 1 (Vitest, fake fetch):** `rssProvider` (`source: "rss"`) reads `providerConfigs.rss.feeds` (array of URLs); with no config → `{ upserted: 0 }` (no-op, no fetch); with feeds → parses entries (title, link, summary, publishedAt) via an **injectable fetch**, maps each to a `contents` row (`source:"rss"`, `externalId` = entry guid/link, `canonicalUrl` = link), and upserts via `upsertIngested` (dedup by `by_tenant_source_external`). It interprets `demand` loosely — a feed pulls its own entries, it does **not** require `demand.categories` — proving the port doesn't assume Wikipedia's category-driven model.
- [ ] **Step 2:** extend `contents.source` (schema) and `upsertIngested`'s source validator with `"rss"`; implement the adapter; register `rssProvider` in `PROVIDERS`. Confirm `runDiscoveryIngestion` drives both `wikipedia` and `rss` generically (same `{ tenantSlug, demand }`), `rss` no-oping when unconfigured.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(discovery): RSS feed provider — second adapter proving the seam`.

---

### Task 5: Verify the slice (standard verification — always)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `npx tsc -p convex --noEmit` → PASS.
- [ ] `grep -rn "wikipediaLocale" convex/discovery` → **no hits in the generic seam** (`provider.ts`, `ingest.ts`); the only locale handling lives inside the Wikipedia adapter and the CMS authoring surface.
- [ ] **Live smoke** (`npx convex dev --once` / `npx convex run`): run `migrateWikipediaLocaleToProviderConfig`; set the demo tenant to `fr` via the CMS langue panel → confirm `providerConfigs.wikipedia.locale = "fr"` and a manual `runRefillIngestion` fetches French articles; configure a test `providerConfigs.rss.feeds` URL → `runDiscoveryIngestion` upserts `source:"rss"` contents; with no rss config, ingestion still succeeds and `rss` upserts 0.
- [ ] Record the decision in `docs/adr/0004-aggregation-engine.md` Consequences: *port stays `{ tenantSlug, demand }`; provider-specific config is opaque per-tenant and resolved inside the adapter.*
- [ ] Update `docs/superpowers/backlog.md`: mark the **GATE** done; unblock the **YouTube provider** item.
- [ ] `git status --short` clean.

---

## Self-Review

- **The seam is agnostic:** the port is `{ tenantSlug, demand }`; no provider type appears in `provider.ts` or the orchestrator. The deletion test passes — removing the Wikipedia adapter removes all Wikipedia knowledge from `convex/discovery`.
- **Config is opaque + per-tenant + per-source:** the orchestrator never reads `providerConfigs`; each adapter self-resolves. YouTube will add `providerConfigs.youtube` without touching the port.
- **Two real adapters** (`wikipedia`, `rss`) exercise the seam generically → the couture is real, not hypothetical.
- **CMS specificity is allowed:** authoring "Wikipedia has a locale" stays in the CMS; only the ingestion seam is agnostic.
- **No dead code:** the legacy `wikipediaLocale` field and every reference are gone after migration.

## After This Slice

- **YouTube provider** (the real product 2nd provider) — now drops into the proven seam via `providerConfigs.youtube`.
- Real RSS scheduling/relevance policy (currently "ingest configured feeds each run, bounded").
- Multi-provider search/fetch policy → future ADR (noted in ADR 0006).
