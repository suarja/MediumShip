# Perf Slice B — Counts de catégories via le composant Aggregate (fin du 2ᵉ scan total)

> **Slice backend** (`convex/**`), vertical et testable de bout en bout. Brancher depuis `dev` (à jour). Vague **Perf / coût Convex** (`docs/superpowers/backlog.md`). Supprime le 2ᵉ scan du corpus publié entier : `listPublishedCategories` fait aujourd'hui un `.collect()` de **toutes** les lignes publiées (~14 MB) juste pour **compter par catégorie**, à chaque ouverture d'Explore + chaque invalidation d'ingestion. Convex n'a **pas** de `count` natif → la seule vraie solution est de **dénormaliser**. On utilise le composant béni **`@convex-dev/aggregate`** (`docs/convex-components-descriptions.md` #44) pour des counts **temps réel en O(log n)**.

> **For agentic workers:** REQUIRED SUB-SKILL : `superpowers:executing-plans`. **Backend `convex/**` → lire `convex/_generated/ai/guidelines.md` + le composant (`https://www.convex.dev/components/aggregate/llms.txt`) ; tests Vitest + convex-test (`npm run test:convex`) ; consommateur RN → Jest (`npm test`).** **Modèle d'implémentation : sous-agent Claude Sonnet 4.6 pour le mécanique (install, déf, réécriture query, backfill).** ⚠️ **Partie SENSIBLE = câblage des write-paths `contents` (Task 2)** : un insert/patch/delete oublié = **count en drift**, et ça touche le chemin d'ingestion haute fréquence. L'orchestrateur (Opus) **revoit lui-même la couverture exhaustive des write-paths** (grep + relecture) avant merge. Steps use `- [ ]`.

**Goal :** `listPublishedCategories` lit les counts via `aggregate.count()` borné par préfixe `[tenantSlug, "published", category]` — **plus aucun `.collect()` du corpus**. Les counts restent **exacts et temps réel** car l'aggregate est synchronisé par les mutations qui écrivent `contents`. La forme de retour de la query est **inchangée** (le hook `use-categories.ts` ne change pas).

## Décisions verrouillées

- **Composant existant > build custom** (règle CLAUDE.md) : `@convex-dev/aggregate`, installé comme `agent`/`r2` le sont déjà (`convex/convex.config.ts`).
- **Temps réel** (décision 2026-06-11) : counts synchronisés sur chaque écriture `contents` (pas un simple cron de réconciliation). Contrepartie acceptée : +1 écriture O(log n) par ligne ingérée.
- **Clé d'agrégat** = `[tenantSlug, status, category]` (count seul, pas de somme). Permet `count()` borné par préfixe `[tenant, "published"]` (total) et `[tenant, "published", category]` (par catégorie).
- **Backfill unique** des 10 868 lignes existantes (dev) via `internalMutation` paginée + auto-reschedule (guideline transactions).
- **Réconciliation de sécurité** : un cron léger (ex. 1×/jour) qui recompte et corrige tout drift résiduel — filet contre un write-path oublié. Réutilise le scan complet **1×/jour** au lieu de par-requête (le coût qu'on supprime).
- **Forme de retour de la query inchangée** ; **dead code retiré** (`publishedCategoryCounts` + son `.collect()` supprimés).

---

## Read First

**Protocole agent :** `CLAUDE.md` ; `docs/agents/slice-workflow.md` ; `docs/agents/commit-workflow.md` ; `convex/_generated/ai/guidelines.md`.

**Composant :** `docs/convex-components-descriptions.md` (#44 Aggregate) ; `https://www.convex.dev/components/aggregate/llms.txt` (API `TableAggregate`, `insert/replace/delete`, `count` borné, namespaces, backfill).

**Fichiers cœur :**
- `convex/convex.config.ts` — pattern d'enregistrement de composant (`app.use(agent)`, `app.use(r2)`).
- `convex/categories/queries.ts` — `publishedCategoryCounts` (l.10-24, **le `.collect()` à supprimer**) + `listPublishedCategories` (l.26-61, à réécrire).
- `convex/schema.ts` — table `contents` (l.79), index `by_tenant_and_status_and_category` (l.135).
- **Write-paths `contents` à câbler (liste de départ — à confirmer par grep exhaustif `ctx.db.insert("contents"|.patch|.replace|.delete` en Task 2) :**
  - `convex/discovery/ingest.ts` (gros volume — Wikipedia/YouTube/RSS).
  - `convex/cms/mutations.ts`, `convex/cms/categories.ts`.
  - `convex/tenants/seed.ts`.

**Consommateur (doit rester intact) :** `src/features/categories/use-categories.ts` (forme de retour `{ category, count, icon, iconKey }` inchangée).

**Tests à garder verts :** `convex/categories/queries.test.ts`, `convex/categories/catalog.test.ts`, `convex/discovery/ingest.test.ts`, `npm run test:convex`, `npm test`.

---

## Scope Guard

**Inclut :**
- Install + enregistrement du composant ; définition `TableAggregate` sur `contents`.
- Câblage `insert/replace/delete` dans **tous** les write-paths `contents`.
- Backfill one-shot + cron de réconciliation de sécurité.
- Réécriture de `listPublishedCategories` sur l'aggregate ; suppression de `publishedCategoryCounts`.
- Tests Vitest (counts reflètent insert/publish/archive/delete ; query sans scan) + Jest (`use-categories` inchangé).

**N'inclut PAS :**
- Le feed (= Perf Slice A, indépendant).
- Toute autre query lisant le corpus (`searchPublished`/`getTrendingTopics`/`listPublishedFeed` — parquées, à traiter plus tard si besoin).
- Un usage de l'aggregate pour autre chose que les counts (rankings/random access — parqué).

---

## File Structure

- `package.json` — `@convex-dev/aggregate` (NEW dep).
- `convex/convex.config.ts` — `app.use(aggregate, { name: "contentCategoryCounts" })` (MODIFIÉ).
- `convex/categories/aggregate.ts` — définition `TableAggregate` + helpers `incr/replace/remove` réutilisables par les write-paths (NEW).
- `convex/categories/queries.ts` — `listPublishedCategories` réécrit ; `publishedCategoryCounts` supprimé (MODIFIÉ).
- write-paths listés ci-dessus — appels de sync ajoutés (MODIFIÉ).
- `convex/categories/backfillCounts.ts` — `internalMutation` paginée one-shot (NEW).
- `convex/crons.ts` — cron de réconciliation quotidien (MODIFIÉ).
- `convex/categories/aggregate.test.ts` — tests Vitest (NEW).

---

### Task 1 : Install + définition de l'aggregate

- [ ] **Step 1 :** `npm install @convex-dev/aggregate` ; enregistrer dans `convex.config.ts` (même pattern que `agent`/`r2`).
- [ ] **Step 2 :** `convex/categories/aggregate.ts` — `defineTableAggregate`/`TableAggregate` sur `contents`, sortKey `[doc.tenantSlug, doc.status, doc.category]`, sans valeur de somme. Exporter des helpers `syncContentInsert(ctx, doc)`, `syncContentUpdate(ctx, oldDoc, newDoc)`, `syncContentDelete(ctx, doc)` enveloppant `aggregate.insert/replace/delete`.
- [ ] **Step 3 :** `npx convex codegen` ; `npx tsc --noEmit` clean. **Commit** — `feat(categories): register aggregate component for content category counts`.

### Task 2 : Câbler les write-paths `contents` (⚠️ SENSIBLE — couverture exhaustive)

- [ ] **Step 1 :** grep exhaustif des écritures `contents` :
  `grep -rn 'insert("contents"\|\.patch(\|\.replace(\|\.delete(' convex --include='*.ts' | grep -v test` puis vérifier **chaque** site qui touche `contents` (insert, changement de `status`/`category`, delete).
- [ ] **Step 2 :** à chaque site : `insert` → `syncContentInsert` ; `patch`/`replace` qui change `status` ou `category` → `syncContentUpdate(old, new)` (lire l'ancien doc avant patch) ; `delete` → `syncContentDelete`. **Aucun site manquant.**
- [ ] **Step 3 (Vitest) :** tests par mutation publique — insert published → count +1 ; patch `draft→published` → +1 ; `published→archived` → −1 ; changement de `category` → −1 ancienne / +1 nouvelle ; delete → −1. Passer **par les vraies mutations** (ingest + CMS), pas l'aggregate à la main.
- [ ] **Step 4 :** `npm run test:convex` PASS. **Commit** — `feat(categories): keep category counts in sync on every contents write`.

### Task 3 : Backfill + réconciliation

- [ ] **Step 1 :** `convex/categories/backfillCounts.ts` — `internalMutation` paginée (`.take(n)` + `ctx.scheduler.runAfter(0, …)` pour continuer, par la guideline), idempotente (clear l'aggregate avant rebuild). Lancer une fois sur dev via le MCP / dashboard.
- [ ] **Step 2 :** `convex/crons.ts` — cron quotidien (`crons.interval`) appelant un `internalMutation` de réconciliation (recompte complet + corrige). Filet anti-drift.
- [ ] **Step 3 :** `npm run test:convex` PASS ; vérifier sur dev que les counts de l'aggregate == counts réels (oneoff query de contrôle). **Commit** — `feat(categories): backfill + daily reconciliation for category counts`.

### Task 4 : Réécrire `listPublishedCategories` sur l'aggregate

- [ ] **Step 1 :** réécrire `listPublishedCategories` : pour chaque catégorie configurée (ou découverte), `count` = `aggregate.count({ bounds preffix [tenantSlug, "published", category] })`. **Supprimer** `publishedCategoryCounts` et son `.collect()` (dead code). Forme de retour `{ category, count, icon, iconKey }` **identique**.
- [ ] **Step 2 (Jest) :** `src/features/categories/use-categories.ts` consomme la query **sans changement** — spec verte. (Vitest) `listPublishedCategories` retourne les bons counts **sans** lire le corpus.
- [ ] **Step 3 :** `npm run test:convex` + `npm test` + `npx tsc --noEmit` clean. **Commit** — `refactor(categories): serve published category counts from aggregate (no full-corpus scan)`.

### Task 5 : Vérification du slice (standard — toujours)

- [ ] `npm run test:convex` PASS ; `npm test` PASS ; `npx tsc --noEmit` clean ; `git status --short` clean.
- [ ] **Preuve de coût** : via le MCP Convex, confirmer que `listPublishedCategories` ne déclenche plus le warning « Many bytes read » (lecture ≪ 1 MB).
- [ ] **Couverture write-paths revue par l'orchestrateur (Opus)** : relire la sortie du grep Task 2 vs les appels de sync ajoutés — zéro site manquant. Cron de réconciliation confirmé comme filet.
- [ ] **Smoke fonctionnel** : écran Explore affiche les counts ; créer/publier/archiver un contenu (CMS) → count se met à jour.

---

## Self-Review

- **Counts O(log n) temps réel** sans scan ; supprime le 2ᵉ pôle de coût (14 MB/appel).
- **Composant béni** (pas de build custom) ; réutilisable plus tard (rankings, random access).
- **Filets anti-drift** : tests par-mutation + cron de réconciliation quotidien.
- **Zéro changement client** ; dead code (`publishedCategoryCounts`) retiré.

## After This Slice

- **Queries résiduelles lisant le corpus** (`searchPublished` `.take(2000)`, `getTrendingTopics` `.take(1000)`, `listPublishedFeed` `.collect()`, `insights/relatedSelection`) — borner/migrer si elles pèsent au monitoring. Parqué au backlog.
