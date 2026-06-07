# Discovery Slice N — YouTubeProvider : whitelist éditoriale + chaîne tenant

> **Letter nomenclature on purpose** (parallel numeric slices run by other agents). Backend ingestion slice — voir ADR 0004 YouTube (`docs/adr/0004-youtube-channel-provider.md`) et la spine `2026-06-06-slice-6-discovery-engine.md`. **Dépend de Slice D** (Wikipedia provider — `provider.ts`, `ingest.ts`, `upsertIngested`, `FetchDemand`, cron). Indépendant des slices UI. Brancher depuis `dev` une fois Slice D mergé.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou superpowers:executing-plans. **Vitest-first pour tout `convex/**`.** Lire `convex/_generated/ai/guidelines.md` avant de toucher `convex/`. Steps use `- [ ]`.

**Goal:** brancher **YouTube** comme troisième adapter réel du port `ContentProvider`. La whitelist de 17 chaînes francophones curatées (`youtube-whitelist.ts`) alimente le feed de découverte sans aucune configuration tenant. Un créateur peut en plus configurer sa propre chaîne YouTube depuis le CMS (champ `channelId`). Les vidéos sont ingérées dans `contents` comme `kind: "video"` avec `videoSource: { kind: "youtube" }` — le player mobile les lit sans modification.

**End-to-end proof:** lancer `runDiscoveryIngestion` sur le déploiement dev → des vidéos `source: "youtube"` apparaissent dans `contents` ; elles remontent dans `getDiscoveryFeed` (Découvrir) ; elles n'apparaissent pas dans `listPublishedFeed` (feed éditorial) ; re-lancer → zéro doublon (dedup sur `externalId`).

**Tech Stack:** Convex (action `"use node"`, mutation interne, cron existant), `convex-youtube-cache` (composant déjà installé), `YOUTUBE_DATA_API_KEY` (déjà en env), TypeScript, Vitest + convex-test.

---

## Read First

- `docs/adr/0004-youtube-channel-provider.md` — **les décisions que ce slice implémente** (playlist-first, dual source, normalisation, réutilisation cache, extension validator).
- `docs/adr/0003-content-discovery-engine.md` — isolation provider (Risk 6), modèle canonique.
- `docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md` — spine.
- `docs/superpowers/plans/2026-06-06-discovery-slice-d-wikipedia-provider.md` — **patron exact à miroir** (structure provider, normalize, upsertIngested, source isolation).
- `convex/_generated/ai/guidelines.md` — **lire avant tout `convex/`** (actions vs mutations, `ctx.runQuery`/`ctx.runMutation`, `"use node"`, composants).
- `convex/discovery/providers/youtube-whitelist.ts` — whitelist déjà créée (17 chaînes FR, liste EN vide).
- `convex/youtube/helpers.ts` — `parseDurationSeconds`, `extractYoutubeVideoId` (déjà disponibles, réutiliser).
- `convex/youtube/enrich.ts` — exemple d'usage de `YouTubeMetadataCache` + `"use node"` + `getEnv("YOUTUBE_DATA_API_KEY")`.
- `convex/discovery/providers/wikipedia.ts` — patron de normalisation et de structure provider (copier le style, pas le contenu).
- `convex/discovery/ingest.ts` — `upsertIngested`, `ingestedContentValidator`, `runDiscoveryIngestion`, `PROVIDERS` à étendre.
- `convex/discovery/provider.ts` — registre `PROVIDERS`, interface `ContentProvider`.
- `convex/discovery/providerConfig.ts` — `getTenantProviderConfig` / `setTenantProviderConfig` (pattern pour lire `providerConfigs.youtube`).
- `apps/cms/components/cms/tenant-settings-form.tsx` — formulaire tenant existant à étendre (Task 5).
- `CLAUDE.md`

Standing rules : **test where the code lives** — Convex → Vitest/convex-test (`npm run test:convex`). Fonctions pures (normalisation, résolution des channelIds) → testées sans convex-test. Actions réseau → `fetch` mocké via `vi.fn()`. Quota YouTube : regrouper les appels `videos.list` par lots de 50.

---

## Scope Guard

Inclut :

- Extension de `ingestedContentValidator` dans `ingest.ts` : `"youtube"` dans l'union `source` ; `videoSource` et `durationSeconds` en champs optionnels.
- `convex/discovery/providers/youtube.ts` : types `NormalizedYouTubeVideo`, fonctions pures `normalizeYouTubeVideo` / `extractYouTubeTags` / `resolveChannelIds`, fonctions réseau `fetchUploadsPlaylistId` / `fetchPlaylistVideoIds` / `batchFetchVideoMetadata`, `youtubeProvider` implémentant `ContentProvider`.
- Enregistrement de `youtubeProvider` dans `PROVIDERS` (le cron existant le ramasse automatiquement).
- Source isolation : vidéos YouTube visibles dans `getDiscoveryFeed`, exclues de `listPublishedFeed`.
- CMS UI : champ "YouTube channel URL" dans `tenant-settings-form.tsx` — saved dans `providerConfigs.youtube.channelId` + `locale`.

N'inclut **pas** :

- `search.list` YouTube par catégorie (rejeté dans ADR 0004 — quota).
- OAuth Google (vidéos privées, analytics — hors scope prototype).
- UI CMS de gestion de la whitelist globale (la whitelist est statique dans le code pour l'instant).
- Modifications du player mobile (`videoSource.kind = "youtube"` déjà géré).
- Ajout de chaînes EN à `YOUTUBE_WHITELIST_EN` (placeholder laissé dans `youtube-whitelist.ts`).
- Nouveau schéma Convex — `videoSource` et `durationSeconds` sont déjà dans `contents` ; seul le validator `ingestedContentValidator` est étendu.

---

## File Structure

**Convex — domaine + adapter :**

- `convex/discovery/ingest.ts` — étendre `ingestedContentValidator` + union `source`.
- `convex/discovery/providers/youtube.ts` (+ `.test.ts`) — adapter complet.
- `convex/discovery/provider.ts` — enregistrer `youtubeProvider` dans `PROVIDERS`.

**CMS UI :**

- `apps/cms/components/cms/tenant-settings-form.tsx` — champs YouTube.

---

### Task 1 : Étendre `ingestedContentValidator` (Vitest-first)

**Files :** `convex/discovery/ingest.ts` ; `convex/discovery/ingest.test.ts` (ou fichier de test existant).

- [ ] **Step 1 (Vitest) :** spec — `upsertIngested` accepte un item avec `source: "youtube"`, `videoSource: { kind: "youtube", youtubeVideoId: "abc123", youtubeUrl: "https://youtube.com/watch?v=abc123" }`, et `durationSeconds: 312` ; l'item est inséré et retrouvé via `by_tenant_source_external`.
- [ ] **Step 2 :** dans `ingestedContentValidator`, ajouter :
  - `source : v.union(..., v.literal("youtube"))` — ajouter le nouveau literal à l'union existante.
  - `videoSource : v.optional(v.union(v.object({ kind: v.literal("youtube"), youtubeVideoId: v.string(), youtubeUrl: v.string() }), v.object({ kind: v.literal("hosted"), uploadKey: v.string(), playbackUrl: v.string() })))` — optionnel, absent pour articles/épisodes.
  - `durationSeconds : v.optional(v.number())` — optionnel si non déjà présent.
- [ ] **Step 3 :** `tsc -p convex` clean. Vitest → PASS. **Commit** — `feat(ingest): extend validator for youtube source + videoSource`.

---

### Task 2 : Fonctions pures YouTube (Vitest-first, sans réseau)

**Files :** `convex/discovery/providers/youtube.ts` ; `convex/discovery/providers/youtube.test.ts`.

- [ ] **Step 1 (Vitest) — types et normalisation :**
  - `extractYouTubeTags(rawTags: string[] | undefined, maxTags = 8): string[]` normalise via `normalizeScoringKey`, déduplique, tronque à `maxTags`. Tags vides ou trop courts (`< 3 chars`) → filtrés.
  - `buildYouTubeSlug(title: string, videoId: string): string` → `normalizeScoringKey(title).slice(0, 40) + "-" + videoId.slice(0, 6)`.
  - `truncateSummary(description: string, maxChars = 300): string` → premier paragraphe non vide, tronqué, suffixe "…" si coupé.
  - `resolveChannelIds(providerConfig: Record<string, unknown> | null, locale: string): string[]` — merge whitelist (`YOUTUBE_WHITELIST[locale]`) + tenant `channelId` ; déduplique ; respecte `disableWhitelist`.
  - `normalizeYouTubeVideo(raw: YouTubeVideoRaw, args: { tenantSlug, defaultCategory }): NormalizedYouTubeVideo` — mapping complet (title, summary, category, tags, heroImageUrl, durationSeconds, videoSource, publishedAt, slug, externalId, canonicalUrl).
- [ ] **Step 2 :** implémenter toutes les fonctions. Aucune dépendance `ctx` ou réseau — pur TypeScript.
- [ ] **Step 3 :** Vitest → PASS. **Commit** — `feat(youtube): pure normalization helpers`.

---

### Task 3 : Fonctions réseau + `youtubeProvider` (Vitest-first, fetch mocké)

**Files :** `convex/discovery/providers/youtube.ts` (suite) ; `convex/discovery/providers/youtube.test.ts` (suite).

Toutes les fonctions réseau prennent `fetchImpl: typeof fetch = fetch` (mockable en test, exactement comme Wikipedia).

- [ ] **Step 1 (Vitest, fetch mocké) :**
  - `fetchUploadsPlaylistId(channelId, apiKey, fetchImpl): Promise<string | null>` — GET `channels.list?part=contentDetails&id=<channelId>&key=<apiKey>` → retourne `contentDetails.relatedPlaylists.uploads` ou `null`.
  - `fetchPlaylistVideoIds(playlistId, apiKey, fetchImpl, maxPages = 3): Promise<string[]>` — GET `playlistItems.list` paginé (`pageToken`), retourne la liste de `videoId`, plafonnée à `maxPages × 50`.
  - `batchFetchVideoMetadata(videoIds, cache, ctx): Promise<YouTubeVideoRaw[]>` — appelle `cache.getVideo(ctx, { videoId })` par lot, filtre les `null`.
  - `youtubeProvider.ingest(ctx, { tenantSlug, demand })` :
    - Lit `providerConfigs.youtube` via `getTenantProviderConfig`.
    - Résout les `channelIds` via `resolveChannelIds`.
    - Pour chaque channelId → `fetchUploadsPlaylistId` → `fetchPlaylistVideoIds` → `batchFetchVideoMetadata` → `normalizeYouTubeVideo` → `upsertIngested`.
    - Retourne `{ upserted: number }`.
    - Si aucun `channelId` résolu (whitelist vide + pas de config tenant) → retourne `{ upserted: 0 }` sans erreur.
  - **Spec dedup :** deux runs successifs avec les mêmes `videoId` → `upserted = 0` au second run.
  - **Spec quota :** 55 videoIds → `batchFetchVideoMetadata` fait exactement 2 appels (lots de 50 + 5).
- [ ] **Step 2 :** implémenter. Déclarer `"use node"` en tête du fichier (l'action utilise `components.youtubeMetadata` comme dans `enrich.ts`). Récupérer la clé via `getEnv("YOUTUBE_DATA_API_KEY")` — retourner `{ upserted: 0 }` avec un log si absente (même pattern que `enrich.ts`).
- [ ] **Step 3 :** Vitest → PASS. **Commit** — `feat(youtube): YouTubeProvider adapter (fetch + normalize + upsert)`.

---

### Task 4 : Enregistrement dans `PROVIDERS` + isolation source (Vitest-first)

**Files :** `convex/discovery/provider.ts` ; `convex/content/queries.ts` ; tests existants.

- [ ] **Step 1 (Vitest) :**
  - `PROVIDERS` contient désormais `cmsProvider`, `wikipediaProvider`, `rssProvider`, `youtubeProvider`.
  - `listPublishedFeed` **exclut** `source === "youtube"` (vidéos YouTube hors feed éditorial, exactement comme Wikipedia).
  - `getDiscoveryFeed` **inclut** `source === "youtube"` (visibles dans Découvrir).
- [ ] **Step 2 :** ajouter `youtubeProvider` à `PROVIDERS` dans `provider.ts`. Étendre le filtre source dans `content/queries.ts` pour exclure `"youtube"` des surfaces éditoriales (traiter `undefined` comme `"cms"`).
- [ ] **Step 3 :** Vitest → PASS. **Commit** — `feat(discovery): register YouTubeProvider + source isolation`.

---

### Task 5 : CMS UI — champ YouTube tenant settings

**Files :** `apps/cms/components/cms/tenant-settings-form.tsx`.

- [ ] Ajouter une section **"YouTube"** dans le formulaire tenant existant :
  - Champ texte `YouTube channel URL` — placeholder `https://youtube.com/@votre-chaine` ou `https://youtube.com/channel/UCxxxx`.
  - Champ select `Langue de la whitelist` (`fr` / `en`, défaut `fr`).
  - Case à cocher `Désactiver la whitelist éditoriale` (`disableWhitelist`).
  - À la sauvegarde : extraire le `channelId` de l'URL via `extractYoutubeVideoId`-like logic (ou regex sur `/channel/UC` et `/@handle` + appel `channels.list` pour résoudre le handle → ID) ; upsert dans `providerConfigs.youtube` via `setTenantProviderConfig`.
- [ ] Pas de Jest requis pour ce champ (formulaire CMS Next.js, pas de composant RN). Smoke manuel dans le browser : saisir une URL de chaîne → sauvegarder → vérifier dans Convex dashboard que `providerConfigs.youtube.channelId` est bien écrit.
- [ ] **Commit** — `feat(cms): youtube channel config in tenant settings`.

---

### Task 6 : Vérification du slice (standard — toujours)

- [ ] `npm run test:convex` → PASS (provider helpers, ingest validator, source isolation).
- [ ] `npx tsc --noEmit -p convex` + `npx tsc --noEmit` → PASS.
- [ ] **Smoke live (dev)** :
  - Lancer `runDiscoveryIngestion` (ou appeler `youtubeProvider.ingest` directement depuis le dashboard Convex).
  - Vérifier dans `contents` : des rows `source: "youtube"` avec `kind: "video"`, `videoSource.kind: "youtube"`, `durationSeconds > 0`, `heroImageUrl` non nul.
  - Vérifier dans `getDiscoveryFeed` : ces vidéos remontent dans le feed Découvrir.
  - Vérifier dans `listPublishedFeed` : aucune vidéo `source: "youtube"` présente.
  - Re-lancer `runDiscoveryIngestion` → `upserted = 0` (zéro doublon).
  - (Optionnel si CMS déployé) : configurer une chaîne tenant → re-lancer → vidéos de cette chaîne présentes en plus de la whitelist.
- [ ] `git status --short` clean.

---

## Self-Review

- **Hexagon étendu :** trois adapters réels (`wikipedia`, `rss`, `youtube`) derrière un port stable — la seam du ADR 0003 est validée.
- **Playlist-first respecté :** zéro appel `search.list` — quota préservé.
- **Dual source propre :** `resolveChannelIds` est pure et testée ; whitelist et config tenant sont mergeables ou exclusives via `disableWhitelist`.
- **Cache réutilisé :** `convex-youtube-cache` (déjà installé, déjà testé dans `enrich.ts`) évite tout appel `videos.list` redondant.
- **Player mobile inchangé :** `videoSource.kind = "youtube"` existait dans le schéma avant ce slice.
- **Source isolation cohérente :** même pattern que Wikipedia — éditorial = `source === "cms"` seulement ; découverte = toutes sources.
- **Dedup idempotent :** `by_tenant_source_external` (tenantSlug, source, externalId) — index déjà en place.

## After This Slice

Suites naturelles : remplir `YOUTUBE_WHITELIST_EN` (quelques chaînes EN éducatives) ; UI CMS de gestion de la whitelist globale (table `youtubeChannelWhitelist` au lieu d'une constante) ; `PodcastRSSProvider` comme quatrième adapter ; analytics de contenu redécouvert par source.
