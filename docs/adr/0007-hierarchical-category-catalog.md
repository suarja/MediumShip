# ADR 0007 — Catalogue global hiérarchique & UX recherche / nuage

## Statut

Proposé

## Date

2026-06-07

## Contexte

L’ADR 0006 promeut `Category` en taxonomie de premier ordre **plate**, gérée par le tenant. La **Slice I** branche cette taxonomie dans les intérêts membre (`categoryInterests`), le scoring feed et l’ingestion — picks **additifs**, sans héritage implicite.

Le produit a besoin d’aller plus loin :

1. **Réservoir global** — un catalogue platform de catégories hiérarchiques (référence partagée), distinct de la taxonomie tenant, pour que les créateurs construisent leur vocabulaire sans tout inventer.
2. **Hiérarchie** — arbre à plusieurs niveaux (ex. Économie → Investissements → ETF), pas une liste plate.
3. **UX recherche-first** — le créateur **ne browse pas** une longue liste ; il **cherche** (ex. « Économie ») et voit le nœud **plus ses dérivés**. Même patron pour le membre, sur la taxonomie tenant.
4. **Nuage orbital** — au tap, les enfants apparaissent autour du nœud focus (constellation éditoriale), drill limité à **3 niveaux**.
5. **Picks explicites** — seuls les nœuds cochés par le membre comptent ; **pas** de boost implicite sur les descendants non choisis.

Décisions produit verrouillées (2026-06-07) :

| Sujet | Décision |
|-------|----------|
| Granularité des picks | Explicites uniquement — pas d’héritage de branche |
| Réservoir | Global platform (`categoryCatalog`) |
| UX créateur | Barre de recherche sur le catalogue ; hybrid optionnel : racines niveau 1 |
| UX membre | Même patron (recherche + racines + nuage) dans **Réglages → Centres d’intérêt** ; pas d’onboarding dédié pour l’instant |
| Profondeur nuage | 3 niveaux max de drill |
| Source du réservoir | **IPTC Media Topics** (import one-shot) + nœuds custom platform si besoin |

## Décision

Introduire **trois couches** de vocabulaire catégoriel, sans casser Slice I :

```
categoryCatalog (platform, global, arbre)
        │  recherche CMS créateur → « ajouter à ma taxonomie »
        ▼
categories (tenant, arbre, isSelectable)
        │  recherche + nuage membre → picks explicites
        ▼
categoryInterests (membre, clés normalisées — inchangé Slice I)
```

### 1. Catalogue global (`categoryCatalog`)

- Table **platform** (pas de `tenantSlug`) — réservoir partagé.
- Arbre strict via `parentId` (un parent par nœud) ; profondeur dénormalisée (`depth`, 0 = racine).
- Champs : `externalId` (ex. `medtop:20000344`), `label`, `labelFr` (et autres locales ultérieures), `slug` (`normalizeScoringKey`), `iconKey?`, `retired?`.
- **Seed** : import IPTC Media Topics JSON (`http://cv.iptc.org/newscodes/mediatopic/?format=json`) via action Node one-shot + cron de resync optionnel.
- Wikipedia **ne sert pas** de vocabulaire membre/créateur — uniquement l’ingestion de contenu (ADR 0004).

### 2. Taxonomie tenant (`categories` — extension ADR 0006)

- Ajouter : `parentId?`, `catalogNodeId?`, `depth`, `isSelectable` (visible dans le nuage membre).
- Le créateur **copie** des nœuds depuis `categoryCatalog` (pas de lien runtime obligatoire après copie — `catalogNodeId` trace l’origine).
- Catégories existantes (Slice I) : migration `depth = 0`, `parentId = null`, `isSelectable = true`.
- Le membre ne query **jamais** `categoryCatalog` directement — seulement `categories` filtrées par tenant.

### 3. Intérêts membre (`categoryInterests` — inchangé)

- `setCategoryInterests` / `getMyCategoryInterests` restent la write/read path.
- Clés = `normalizeScoringKey(label)` des nœuds **explicitement cochés**.
- Aucun changement au modèle d’affinités (`userPreferences`) ni aux interactions.

### 4. UX unifiée recherche + nuage

**Patron commun** (composant partagé, deux modes) :

| Mode | Source de données | Action principale |
|------|-------------------|-------------------|
| CMS créateur | `searchCategoryCatalog` | Ajouter nœud (+ descendants optionnels) à la taxonomie tenant |
| Réglages membre | `searchTenantCategories` | Toggle pick → `setCategoryInterests` + reload feed |

Comportement :

- **Barre de recherche** en tête — résultats = nœud matché **+ dérivés** (enfants/descendants, cap profondeur 3).
- **Hybrid** : bandeau de **racines niveau 1** (17 top IPTC ou racines tenant) comme entrée sans recherche.
- **Tap nœud avec enfants** → nuage orbital (satellites autour du focus) ; back remonte d’un niveau.
- **Bandeau bas** (membre) : chips des picks courants + compteur.
- Tokens theme uniquement ; responsive iPhone/iPad.

Surface : **Réglages → Centres d’intérêt** (upgrade du picker Slice I). Pas d’onboarding first-run dans cette tranche.

### 5. Queries & règles de recherche

- `listCategoryCatalogRoots()` — racines platform (depth 0).
- `searchCategoryCatalog({ query, locale, maxDepth: 3 })` — match label + arbre descendants.
- `listCategoryCatalogChildren({ parentId })` — satellites nuage (catalogue).
- `listTenantCategoryRoots({ tenantSlug })` — racines tenant.
- `searchTenantCategories({ tenantSlug, query, maxDepth: 3 })` — idem sur taxonomie tenant, filtré `isSelectable`.
- `listTenantCategoryChildren({ tenantSlug, parentId })` — satellites nuage (membre).
- `addCategoryFromCatalog({ tenantSlug, catalogNodeId, includeDescendants? })` — CMS mutation.

Recherche : normalisation accent-insensible (`normalizeScoringKey` ou équivalent prefix) ; résultats ordonnés label puis profondeur.

## Conséquences

### Positives

- Réservoir réutilisable (IPTC ≈ 1200 termes, FR/EN, stable) sans dépendance runtime Wikipedia.
- UX intuitive créateur **et** membre — une seule métaphore (recherche + constellation).
- Slice I intacte : intérêts, boost feed, ingestion demand restent branchés sur les clés pickées.
- Prêt pour promouvoir le même composant en onboarding plus tard.

### Négatives / risques

- Import IPTC + migration schéma `categories` (travail one-shot).
- Recherche sur arbre : index ou cache à surveiller (Convex — éviter `.collect()` sur 1200 nœuds à chaque frappe ; indexer par `slug` / prefix ou charger catalogue en mémoire côté action).
- IPTC ≠ vocabulaire parfait pour tous les tenants white-label — le custom platform + custom tenant reste nécessaire.
- Profondeur 3 = troncature arbitraire — documenter le comportement au-delà (masquer ou flatten).

## Relation aux autres ADR & séquencement

- **Étend** ADR 0006 (taxonomie tenant) avec hiérarchie + lien catalogue.
- **Préserve** ADR 0003/0004 (scoring, ingestion) — les clés `ScoringKey` restent le pivot.
- **Slice I** (livré) : `categoryInterests` + picker flat — **remplacé visuellement** en Slice L, pas en data.
- **Tranches proposées** :
  - **Slice J** — schéma + import IPTC + queries recherche/arbre (backend) → `docs/superpowers/plans/2026-06-07-discovery-slice-j-category-catalog.md`
  - **Slice K** — CMS recherche catalogue + ajout taxonomie tenant
  - **Slice L** — upgrade mobile Réglages : recherche + racines L1 + nuage orbital 3 niveaux

## Hors scope

- Pick branche implicite (boost descendants non cochés).
- Réservoir par tenant (le catalogue reste global platform).
- Onboarding first-run dédié (composant Réglages réutilisable plus tard).
- Graphe DAG multi-parents (`categoryEdges`).
- FK stricte `contents.category` → id catégorie (reste match clé normalisée).
- Resync IPTC automatique en production (manual/cron dev suffit en v1).
