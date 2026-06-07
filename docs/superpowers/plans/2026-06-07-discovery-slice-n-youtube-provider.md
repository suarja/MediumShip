# Discovery Slice N — YouTubeProvider : whitelist éditoriale + chaîne tenant

> **Letter nomenclature on purpose** (parallel numeric slices run by other agents). Backend ingestion slice — voir ADR 0009 YouTube (`docs/adr/0009-youtube-channel-provider.md`) et la spine `2026-06-06-slice-6-discovery-engine.md`. **Dépend de Slice D** (Wikipedia provider — `provider.ts`, `ingest.ts`, `upsertIngested`, `FetchDemand`, cron). Indépendant des slices UI. Brancher depuis `dev` une fois Slice D mergé.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou superpowers:executing-plans. **Vitest-first pour tout `convex/**`.** Lire `convex/_generated/ai/guidelines.md` avant de toucher `convex/`. Steps use `- [ ]`.

> **⚠️ Un premier jet existe déjà sur la branche et est CASSÉ** — il utilise `convex-youtube-cache` (qui ne renvoie pas les tags) et colle la catégorie de la chaîne à chaque vidéo. Ce plan le **réécrit** : tags par vidéo via `videos.list` direct, idempotence, runtime V8. Garder les bonnes fonctions pures (`buildYouTubeSlug`, `truncateSummary`, `resolveChannelIds`, `fetchPlaylistVideoIds`).

**Goal:** brancher **YouTube** comme troisième adapter réel du port `ContentProvider`. La whitelist de 17 chaînes francophones (`youtube-whitelist.ts`) alimente le feed de découverte sans configuration tenant. Un créateur peut en plus configurer sa propre chaîne (suivi CMS, hors scope ici). **Chaque vidéo porte ses propres tags** (`snippet.tags`) — la personnalisation est granulaire, comme pour Wikipedia. Les vidéos sont ingérées dans `contents` comme `kind: "video"` avec `videoSource: { kind: "youtube" }` — le player mobile les lit sans modification.

**End-to-end proof:** lancer `runDiscoveryIngestion` sur le déploiement dev → des vidéos `source: "youtube"` apparaissent dans `contents`, **avec des tags variés d'une vidéo à l'autre d'une même chaîne** ; elles remontent dans `getDiscoveryFeed` ; elles n'apparaissent pas dans `listPublishedFeed` ; re-lancer → zéro doublon.

**Tech Stack:** Convex (action V8 — **pas** `"use node"`, mutation interne, cron existant), `YOUTUBE_DATA_API_KEY` (déjà en env), TypeScript, Vitest + convex-test. **`convex-youtube-cache` n'est PAS utilisé par le provider** (il reste pour `enrich.ts`).

---

## Read First

- `docs/adr/0009-youtube-channel-provider.md` — **les décisions que ce slice implémente** (playlist-first, dual source, tags par vidéo, idempotence, runtime V8, extension validator).
- `docs/adr/0003-content-discovery-engine.md` — isolation provider (Risk 6), modèle canonique.
- `docs/superpowers/plans/2026-06-06-discovery-slice-d-wikipedia-provider.md` — **patron exact à miroir** (structure, normalize, upsertIngested, source isolation, `extractWikipediaTags` ≈ `extractYouTubeTags`).
- `convex/_generated/ai/guidelines.md` — **lire avant tout `convex/`**.
- `convex/discovery/providers/rss.ts` — adapter config-driven le plus proche (lecture `providerConfigs` opaque, retour `{upserted:0}` sans config).
- `convex/discovery/providers/wikipedia.ts` — patron de normalisation (`extractWikipediaTags`, fetch `fetchImpl`).
- `convex/discovery/providers/youtube-whitelist.ts` — whitelist (17 chaînes FR avec `defaultCategory`).
- `convex/youtube/helpers.ts` — `parseDurationSeconds`, `extractYoutubeVideoId` (réutiliser).
- `convex/youtube/enrich.ts` — usage du cache **côté CMS** (à NE PAS toucher, et à NE PAS imiter dans le provider).
- `convex/discovery/ingest.ts` — `upsertIngested`, `ingestedContentValidator`, `runDiscoveryIngestion`, `PROVIDERS`.
- `convex/content/source.ts` — `ContentSource`, `isEditorialContent` (le seam d'isolation).
- `convex/discovery/providerConfig.ts` — `getTenantProviderConfig`.
- `CLAUDE.md`

Standing rules : **test where the code lives** — Convex → Vitest/convex-test. Fonctions pures → testées sans convex-test. Réseau → `fetch` mocké via `fetchImpl` param. **Quota** : `videos.list` par lots de 50, filtre d'idempotence avant tout fetch.

---

## Scope Guard

Inclut :

- Extension du modèle `source` en **3 endroits** : `schema.ts` (`contents.source`), `ingest.ts` (`ingestedContentValidator.source` + `videoSource` + `durationSeconds`), `content/source.ts` (`ContentSource`).
- Internal query `filterNewExternalIds` dans `ingest.ts` (filtre d'idempotence).
- Réécriture de `convex/discovery/providers/youtube.ts` : `extractYouTubeTags`, `normalizeYouTubeVideo` (tags par vidéo), `resolveChannelIds`, `uploadsPlaylistId` (pur, UU trick), `fetchPlaylistVideoIds` (early-exit), `batchFetchVideoMetadata` (`videos.list` direct), `youtubeProvider`.
- `youtubeProvider` enregistré dans `PROVIDERS` (déjà fait — vérifier).
- Source isolation via `content/source.ts` (YouTube auto-exclu de l'éditorial).

N'inclut **pas** :

- `convex-youtube-cache` dans le provider, ni `"use node"`.
- `channels.list` (remplacé par le mapping `UU`).
- `search.list`, OAuth Google.
- UI CMS chaîne créateur / whitelist (suivi — la whitelist prouve le slice).
- Remplir `YOUTUBE_WHITELIST_EN`.
- Modifs du player mobile (`videoSource.kind = "youtube"` déjà géré) ou de `content/queries.ts`.
- Nouveau schéma `contents` (`videoSource`/`durationSeconds` déjà présents).

---

## File Structure

- `convex/schema.ts` — `"youtube"` dans `contents.source`.
- `convex/discovery/ingest.ts` — `ingestedContentValidator` étendu + `filterNewExternalIds`.
- `convex/content/source.ts` — `"youtube"` dans `ContentSource` (vérifier).
- `convex/discovery/providers/youtube.ts` (+ `.test.ts`) — adapter réécrit.
- `convex/discovery/provider.ts` — `youtubeProvider` dans `PROVIDERS` (vérifier).

---

### Task 1 : Modèle `source` + idempotence (Vitest-first)

**Files :** `convex/schema.ts` ; `convex/discovery/ingest.ts` ; `convex/content/source.ts` ; tests.

- [ ] **Step 1 (Vitest) :** spec — `upsertIngested` accepte un item `source: "youtube"`, `videoSource: { kind: "youtube", youtubeVideoId, youtubeUrl }`, `durationSeconds: 312`, inséré et retrouvé via `by_tenant_source_external`. Spec `filterNewExternalIds({ tenantSlug, source, externalIds })` → renvoie uniquement les ids ABSENTS.
- [ ] **Step 2 :**
  - `schema.ts` : ajouter `v.literal("youtube")` à l'union `contents.source`.
  - `ingest.ts` : `"youtube"` dans `ingestedContentValidator.source` ; `videoSource: v.optional(v.union(youtube, hosted))` ; `durationSeconds: v.optional(v.number())`. Ajouter l'internal query `filterNewExternalIds` (loop `by_tenant_source_external`, renvoie le sous-ensemble non présent).
  - `content/source.ts` : `"youtube"` dans `ContentSource` (probablement déjà fait).
- [ ] **Step 3 :** `tsc -p convex` clean. Vitest → PASS. **Commit** — `feat(ingest): youtube source + idempotence filter`.

---

### Task 2 : Fonctions pures YouTube (Vitest-first, sans réseau)

**Files :** `convex/discovery/providers/youtube.ts` ; `.test.ts`.

- [ ] **Step 1 (Vitest) :**
  - `YouTubeVideoRaw` inclut `tags?: string[]` et `categoryId?: string`.
  - `extractYouTubeTags(rawTags, maxTags = 8)` → `normalizeScoringKey` chacun, drop `< 3 chars`, dedup, cap 8. **(jumeau de `extractWikipediaTags`)**
  - `buildYouTubeSlug(title, videoId)` → `normalizeScoringKey(title).slice(0,40) + "-" + videoId.slice(0,6)`.
  - `truncateSummary(description, 300)` → premier paragraphe, tronqué, suffixe `…`.
  - `uploadsPlaylistId(channelId)` → `"UU" + channelId.slice(2)` (pur, testé).
  - `resolveChannelIds(providerConfig, locale)` → merge whitelist + tenant `channelId` (+ `defaultCategory`), dedup, respecte `disableWhitelist`.
  - `normalizeYouTubeVideo(raw, { tenantSlug, channel })` :
    - `tags = extractYouTubeTags(raw.tags)`
    - `category = tags[0] ?? channel.defaultCategory ?? normalizeScoringKey(raw.channelTitle)`
    - `heroImageUrl = thumbnails.maxres?.url ?? high?.url ?? medium?.url`
    - reste : summary, durationSeconds, videoSource, publishedAt, slug, externalId, canonicalUrl, source.
  - **Spec granularité** : deux `raw` de la même chaîne avec des `tags` différents → `category`/`tags` différents.
- [ ] **Step 2 :** implémenter. **Supprimer** `resolveEditorialCategory` et tout import de `convex-youtube-cache`. Aucune dépendance `ctx`/réseau.
- [ ] **Step 3 :** Vitest → PASS. **Commit** — `feat(youtube): per-video tag normalization (no cache)`.

---

### Task 3 : Réseau + `youtubeProvider` (Vitest-first, fetch mocké) — V8, pas de cache

**Files :** `convex/discovery/providers/youtube.ts` (suite) ; `.test.ts` (suite).

Toutes les fonctions réseau prennent `fetchImpl: typeof fetch = fetch`.

- [ ] **Step 1 (Vitest, fetch mocké) :**
  - `fetchPlaylistVideoIds(playlistId, apiKey, fetchImpl, maxPages = 3, knownIds?)` — `playlistItems.list` paginé ; **early-exit** dès qu'un `videoId ∈ knownIds`.
  - `batchFetchVideoMetadata(videoIds, apiKey, fetchImpl)` — **`videos.list?part=snippet,contentDetails&id=<≤50>`** direct, par lots de 50 ; parse `snippet.tags`, `categoryId`, `thumbnails`, `contentDetails.duration` → `YouTubeVideoRaw[]`. **Spec quota** : 55 ids → exactement 2 appels.
  - `youtubeProvider.ingest(ctx, { tenantSlug, demand })` (demand ignoré) :
    - lit `providerConfigs.youtube` via `getTenantProviderConfig` ; résout channels ;
    - par channel : `uploadsPlaylistId` (pur) → `fetchPlaylistVideoIds` → `filterNewExternalIds` (ne garder que les nouveaux) → `batchFetchVideoMetadata` → `normalizeYouTubeVideo` → accumuler ;
    - `upsertIngested` ; retourne `{ upserted }`.
    - aucun channel / pas de clé API → `{ upserted: 0 }` sans erreur.
  - **Spec dedup** : 2e run, mêmes videoIds → `filterNewExternalIds` renvoie `[]` → **zéro appel `videos.list`** → `upserted: 0`.
- [ ] **Step 2 :** implémenter. **Pas de `"use node"`** — plain `fetch`, runtime V8 comme wikipedia/rss. Clé via `getEnv("YOUTUBE_DATA_API_KEY")`.
- [ ] **Step 3 :** Vitest → PASS. **Commit** — `feat(youtube): provider with videos.list direct + idempotent fetch`.

---

### Task 4 : `PROVIDERS` + isolation source (Vitest-first)

**Files :** `convex/discovery/provider.ts` ; `convex/content/source.ts` ; tests existants. **PAS `content/queries.ts`.**

- [ ] **Step 1 (Vitest) :**
  - `PROVIDERS` = `cmsProvider, wikipediaProvider, rssProvider, youtubeProvider`.
  - `listPublishedFeed` **exclut** `source === "youtube"` (via `isEditorialContent` qui ne laisse passer que `"cms"`).
  - `getDiscoveryFeed` **inclut** `source === "youtube"`.
- [ ] **Step 2 :** vérifier `youtubeProvider` dans `PROVIDERS` (déjà fait) et `"youtube"` dans `ContentSource`. L'isolation est gratuite via `isEditorialContent` — **ne pas** ajouter de filtre ad hoc dans `queries.ts`.
- [ ] **Step 3 :** Vitest → PASS. **Commit** — `feat(discovery): youtube source isolation via content/source`.

---

### Task 5 : CMS UI chaîne créateur — **HORS SCOPE (suivi)**

Différé : après la refonte, `tenant-settings-form.tsx` = Identity + Palette, et la surface provider-config CMS n'est pas tranchée (RSS n'en a pas non plus). La whitelist prouve le slice end-to-end sans config tenant. À reprendre quand la surface provider-config est décidée.

---

### Task 6 : Vérification du slice (standard — toujours)

- [ ] `npm run test:convex` → PASS (helpers purs, validator, idempotence, isolation, dedup).
- [ ] `npx tsc --noEmit -p convex` + `npx tsc --noEmit` → PASS.
- [ ] **Smoke live (dev)** :
  - `npx convex dev --once` (pousser le code), puis lancer `runDiscoveryIngestion`.
  - `contents` : rows `source: "youtube"`, `kind: "video"`, `videoSource.kind: "youtube"`, `durationSeconds > 0`, `heroImageUrl` non nul, **et `tags` variés entre deux vidéos d'une même chaîne** (vérifier la granularité explicitement).
  - `getDiscoveryFeed` les inclut ; `listPublishedFeed` non.
  - Re-lancer → `upserted = 0`, et **aucun appel `videos.list`** émis (idempotence).
- [ ] `git status --short` clean.

---

## Self-Review

- **Hexagon étendu :** trois adapters réels (`wikipedia`, `rss`, `youtube`) derrière un port stable.
- **Personnalisation granulaire :** tags par vidéo via `snippet.tags` — `extractYouTubeTags` ≈ `extractWikipediaTags`. Une chaîne alimente plusieurs centres d'intérêt.
- **Playlist-first + zéro `channels.list` :** uploads dérivée par `UU` trick.
- **Quota maîtrisé sans cache :** `videos.list` direct (1 u/50) + filtre d'idempotence + early-exit → ~34 u/jour en régime permanent. Le cache reste pour `enrich.ts`.
- **Runtime homogène :** plain `fetch`, V8, pas de `"use node"`.
- **Source isolation cohérente :** `isEditorialContent` (`=== "cms"`) — gratuit.
- **Dedup idempotent :** `by_tenant_source_external` + `filterNewExternalIds`.

## After This Slice

Suites naturelles : UI CMS chaîne créateur (Task 5 différée) ; `YOUTUBE_WHITELIST_EN` ; UI CMS de gestion de la whitelist globale (table au lieu d'une constante) ; `PodcastRSSProvider` comme quatrième adapter.
