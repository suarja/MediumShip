# Perf Slice A — Feed : pool de candidats borné et ciblé (fin du scan total)

> **Slice backend** (`convex/**`), vertical et testable de bout en bout. Brancher depuis `dev` (à jour). Vague **Perf / coût Convex** (`docs/superpowers/backlog.md`). Supprime le scan du corpus publié entier dans `getDiscoveryFeed` (mesuré **~14 MB / appel** sur 10 868 lignes, à ~13 % de la limite dure 16 MB → échec imminent + coût bandwidth). Remplace le `.collect()` total par un **pool de candidats borné (~600 lignes, ~0,8 MB) assemblé par index ciblés**, **sans changer la logique de personnalisation**.

> **For agentic workers:** REQUIRED SUB-SKILL : `superpowers:executing-plans`. **Backend `convex/**` → lire `convex/_generated/ai/guidelines.md` ; tests Vitest + convex-test (`npm run test:convex`) ; consommateurs RN → Jest (`npm test`).** **Modèle d'implémentation : sous-agent Claude Sonnet 4.6.** Cette slice est **peu sensible** (filet : invariant des fonctions pures, voir ci-dessous) → bonne candidate pour le sous-agent. L'orchestrateur (Opus) **vérifie la conformité au plan** avant merge. Steps use `- [ ]`.

**Goal :** `getDiscoveryFeed` ne lit plus jamais tout le corpus. Il charge un **pool borné** = fenêtre de récence + tranches des catégories d'affinité/intérêt du membre + tranche archive ciblée + échantillon aléatoire profond (sérendipité). Le feed reste **identique fonctionnellement** (perso, mix de buckets, pagination, isolation de source) ; seul l'ensemble d'entrée est borné. Coût de lecture **constant** quelle que soit la croissance du corpus.

## Décisions verrouillées

- **Invariant directeur (filet de sécurité) :** les fonctions **pures** restent **strictement inchangées** : `scoreContent`, `bucketFeed` (`convex/discovery/scoring.ts`), `buildOrderedDiscoveryFeed`, `paginateOrderedFeed` (`convex/discovery/feed.ts`). On ne modifie **que** la couche qui produit `visible` (aujourd'hui le `.collect()` total, ligne ~298). → la personnalisation est *prouvablement identique*, les tests de scoring restent verts sans changement.
- **Préserver la perso = fetch ciblé par catégorie**, pas une simple fenêtre de récence. La perso est dominée par l'affinité **catégorie** (facteur 1.0) + les boosts d'intérêts explicites (`INTEREST_CATEGORY_BOOST` +80), tous deux **category-keyed** → on les pêche via l'index catégorie même si leurs meilleurs articles sont **anciens**. Compromis résiduel accepté : matchs **tag-only** dans des catégories sans affinité (signal le plus faible) non considérés. Imperceptible.
- **Sérendipité all-time conservée** (décision produit 2026-06-11) : un **échantillon aléatoire profond** (seuil `publishedAt` aléatoire dérivé de `feedSeed` + range-scan borné) alimente le bucket `random` avec du contenu vieux/cross-catégorie. Le bucket `random` ne se limite donc PAS au récent.
- **Contrat de pagination client INCHANGÉ** : `buildOrderedDiscoveryFeed` → liste ordonnée, `paginateOrderedFeed` slice par offset, juste sur ~600 items. `seekingFresh` + refill (`use-discovery-feed.ts`) gèrent l'épuisement du pool (cas heavy-seen) sans changement.
- **Guest** (pas d'affinités) : fenêtre de récence + échantillon aléatoire uniquement → mix `editorial`/`random` actuel.
- Tokens/responsive : N/A (backend). **Dead code retiré** dans le même change (l'ancien `.collect()` supprimé, pas commenté).

---

## Read First

**Protocole agent :** `CLAUDE.md` ; `docs/agents/slice-workflow.md` ; `docs/agents/commit-workflow.md` ; `convex/_generated/ai/guidelines.md`.

**Fichiers cœur :**
- `convex/discovery/feed.ts` — `getDiscoveryFeed` (handler l.287-356), `loadAffinities` (l.181), helpers hidden/seen/liked. **C'est ici que vit le `.collect()` total à remplacer.**
- `convex/discovery/scoring.ts` — fonctions pures **NE PAS TOUCHER** (lecture pour comprendre le scoring : affinité catégorie/tag/type + `INTEREST_*_BOOST` + `FRESHNESS_BOOST`/`ARCHIVE_BOOST`).
- `convex/categories/interests.ts` — `loadMemberCategoryInterests` (déjà appelé par le feed, source des catégories d'intérêt Settings).
- `convex/schema.ts` — table `contents` (l.79), index existants l.129-142 (dont `by_tenant_and_status_and_category` réutilisé ; `by_tenant_and_status` ordonné par `_creationTime`, **insuffisant pour la récence par `publishedAt`**).
- `convex/discovery/visibility.ts` — `isContentVisible` (filtre modules, inchangé).

**Consommateur (doit rester intact) :** `src/features/discovery/use-discovery-feed.ts` — pagination par cursor, `DISCOVERY_PAGE_SIZE=10`, refill au low-watermark. **Aucun changement attendu côté hook.**

**Tests à garder verts :** `convex/discovery/feed.test.ts` (guest/auth/source-isolation/pagination), `convex/discovery/scoring.test.ts` (inchangé), `npm run test:convex`, `npm test`.

---

## Scope Guard

**Inclut :**
- Nouvel index `by_tenant_and_status_and_publishedAt`.
- Helper `loadFeedCandidates` (couche DB bornée) remplaçant le `.collect()` total.
- Constantes nommées de bornage en tête de `feed.ts`.
- Tests Vitest du helper + ajustement des fixtures de `feed.test.ts` qui supposaient « tout le corpus est candidat ».

**N'inclut PAS :**
- Toute modification des fonctions pures de scoring (interdit — invariant).
- Tout changement du hook `use-discovery-feed.ts` ou du contrat de pagination.
- Les counts de catégories (= Perf Slice B, indépendant).
- Le ranking matérialisé par cron (option C, parqué).

---

## File Structure

- `convex/schema.ts` — +1 index sur `contents` (MODIFIÉ).
- `convex/discovery/feed.ts` — `loadFeedCandidates` + constantes ; `getDiscoveryFeed` câblé dessus ; ancien `.collect()` supprimé (MODIFIÉ).
- `convex/discovery/feed.test.ts` — fixtures ajustées + nouveaux cas de bornage/ciblage (MODIFIÉ).
- `convex/discovery/scoring.ts`, `scoring.test.ts` — **inchangés**.

**Constantes de départ (ajustables, en tête de `feed.ts`) :**
```
RECENCY_WINDOW = 250          // N — fenêtre des plus récents (publishedAt desc)
AFFINITY_CATEGORIES_MAX = 6   // top catégories d'affinité/intérêt considérées
PER_CATEGORY_RECENT = 40      // K — récents par catégorie ciblée
PER_CATEGORY_ARCHIVE = 10     // Kₐ — anciens par catégorie ciblée (bucket archive)
DEEP_RANDOM_SAMPLE = 30       // R — échantillon aléatoire profond (sérendipité)
// Pool brut max ≈ N + AFFINITY_MAX*(K+Kₐ) + R ≈ 580 ; ~0,8 MB vs 14 MB.
```

---

### Task 1 : Index de récence (prérequis schéma, dans la slice)

- [ ] **Step 1 :** `convex/schema.ts` — ajouter `.index("by_tenant_and_status_and_publishedAt", ["tenantSlug", "status", "publishedAt"])` sur `contents`. `npx convex codegen` (ou `convex dev` une passe) pour régénérer.
- [ ] **Step 2 :** `npx tsc --noEmit` clean. **Commit** — `feat(schema): index contents by tenant/status/publishedAt for bounded feed`.

### Task 2 : Helper `loadFeedCandidates` (Vitest-first)

- [ ] **Step 1 (Vitest) :** écrire d'abord les tests dans `feed.test.ts` (ou un `feedCandidates.test.ts` dédié) :
  - membre avec **forte affinité catégorie X dont les meilleurs articles sont anciens** → ces articles **apparaissent** dans le pool (preuve que la perso archive survit au bornage).
  - **guest** → pool = récence + échantillon aléatoire, pas de fetch par catégorie.
  - **pool borné** : sur un corpus large simulé, `loadFeedCandidates` retourne ≤ plafond (≈580), **jamais** tout le corpus.
  - **sérendipité** : l'échantillon aléatoire varie avec `feedSeed` et peut inclure du contenu hors fenêtre récente.
  - **isolation de source / visibilité** : `isContentVisible` toujours appliqué, contenu d'autres tenants exclu.
- [ ] **Step 2 :** implémenter `loadFeedCandidates(ctx, { tenantSlug, affinities, interestCategories, feedSeed, enabledModules })` :
  1. **Récence** : `by_tenant_and_status_and_publishedAt` `.order("desc").take(RECENCY_WINDOW)`.
  2. **Catégories ciblées** = top `AFFINITY_CATEGORIES_MAX` de `affinities` (targetType `category`, tri score desc) ∪ `interestCategories`. Pour chacune : `by_tenant_and_status_and_category` `.order("desc").take(PER_CATEGORY_RECENT)` **et** `.order("asc").take(PER_CATEGORY_ARCHIVE)`.
  3. **Échantillon aléatoire profond** : seuil `publishedAt` pseudo-aléatoire dérivé de `feedSeed` → range-scan `by_tenant_and_status_and_publishedAt` `.take(DEEP_RANDOM_SAMPLE)`.
  4. **Union + dédup par `_id`** → `isContentVisible(content, enabledModules)` → retourne le tableau (= l'ancien `visible`).
  - Note bornage/heavy-seen : le filtrage hidden/seen reste **dans** `buildOrderedDiscoveryFeed` (inchangé). Si un gros consommateur a tout vu dans le pool, `seekingFresh` déclenche le refill + nouveau `feedSeed` (mécanisme existant) → nouvel échantillon. Couvrir par un test « user heavy-seen → seekingFresh true, pas de crash, pool varie au seed suivant ».
- [ ] **Step 3 :** `npm run test:convex` PASS. **Commit** — `feat(feed): bounded targeted candidate loader (no full-corpus scan)`.

### Task 3 : Câbler `getDiscoveryFeed` (Vitest)

- [ ] **Step 1 :** dans `getDiscoveryFeed`, **remplacer** le bloc `.collect()` (l.298-307) par `const visible = await loadFeedCandidates(ctx, { tenantSlug, affinities, interestCategories, feedSeed, enabledModules })`. Charger `affinities`/`interestCategories` **avant** (réordonner : ils alimentent le loader). Supprimer l'ancien `.collect()` + filtre inline (dead code).
- [ ] **Step 2 :** ajuster les fixtures de `feed.test.ts` qui posaient peu d'items (souvent < pool) → restent verts ; ajouter une assertion « sur corpus large, le feed reste correct et borné ». Vérifier que guest/auth/pagination/source-isolation passent **sans changement de logique**.
- [ ] **Step 3 :** `npm run test:convex` + `npm test` + `npx tsc --noEmit` clean. **Commit** — `refactor(feed): serve discovery feed from bounded candidate pool`.

### Task 4 : Vérification du slice (standard — toujours)

- [ ] `npm run test:convex` PASS ; `npm test` PASS ; `npx tsc --noEmit` clean ; `git status --short` clean.
- [ ] **Preuve de coût** : via le MCP Convex (`runOneoffQuery` ou un log temporaire), confirmer que `getDiscoveryFeed` ne déclenche plus le warning « Many bytes read » sur le déploiement dev (corpus ~11k). Lecture attendue ≪ 1 MB.
- [ ] **Smoke fonctionnel** (non headless pour l'auth) : feed guest + membre dans l'app — perso plausible, scroll/pagination OK, pull-to-refresh varie le contenu, pas de boucle de feed.

---

## Self-Review

- **Perso préservée par construction** : fonctions pures intactes + fetch ciblé par catégorie (la dimension dominante) → seul l'ensemble d'entrée change.
- **Coût constant** : ~0,8 MB borné vs 14 MB croissant ; supprime l'échec imminent à 16 MB.
- **Sérendipité protégée** : échantillon aléatoire profond conservé.
- **Zéro changement client** ; dead code (`.collect()` total) retiré.

## After This Slice

- **Perf Slice B** (counts catégories via Aggregate) — indépendant, supprime le 2ᵉ scan de 14 MB.
- **Option C** (ranking matérialisé par cron) — seulement si plusieurs clients simultanés en prod rendent l'invalidation réactive coûteuse ; parqué.
