# ADR 0004 — Moteur d'agrégation : provider externe Wikipedia, ingestion par FetchDemand, et feed exploratoire

## Statut

Accepté

## Date

2026-06-06

## Contexte

L'ADR 0003 a posé le **Content Discovery Engine** : un port `Provider` (hexagonal), un corpus canonique `contents` (tenant-scoped), des `Affinity` par membre, une `ScoringPolicy` pure, et un feed mixé. Le premier adapter est `CmsProvider` (contenu interne).

Cet ADR décide comment **alimenter le moteur avec une source externe abondante — Wikipedia** — pour (a) obtenir du vrai contenu de test plutôt que du faux, et (b) valider que le port a un **second adapter réel**. Il intègre une recherche en amont sur l'API MediaWiki et reconcilie une réflexion initiale (rédigée sous forme de brouillon « moteur d'agrégation / graphe ») avec l'architecture déjà construite.

Le brouillon initial proposait un modèle de graphe dédié (`pages` + `edges`), un score ad hoc, et un buffer client déclenchant des fetch per-session. Le présent ADR **tranche ces points** après un grilling de conception (voir CONTEXT.md pour les termes : `Provider`, `Affinity`, `ScoringPolicy`, `ScoringKey`, `ContentVisibility`, `Engagement`, `FetchDemand`).

## Recherche — primitives de l'API MediaWiki (conservées)

Trois méthodes couvrent le cycle de vie de la donnée :

- **`action=query&list=categorymembers`** — *cold start* : lister les pages d'une catégorie. Sert à amorcer le corpus à partir des catégories seed du tenant.
- **`action=query&generator=search&prop=extracts|pageimages|info`** (`explaintext=1`) — *alimentation enrichie en batch* : en **une requête**, titre + extrait épuré + image pour plusieurs pages. Le filtrage (exclusions d'IDs déjà ingérés) se fait côté applicatif.
- **`action=parse&prop=text`** — *mode immersion* : HTML complet d'une page, avec ses liens internes. **Différé** (voir Décisions).

## Décisions

### 1. Le contenu externe est normalisé dans `contents` — pas de graphe `pages`/`edges`

Wikipedia est ingéré via le port `Provider` et **normalisé dans la table canonique `contents`** (ADR 0003), avec des champs source ajoutés (`source`, `externalId`, `canonicalUrl`). On **n'introduit pas** la table `pages` ni le graphe `edges` du brouillon.

- *Pourquoi* : tout l'existant (ScoringPolicy, feed, carte, bookmarks, ContentVisibility) classe et affiche `contents` gratuitement. Un store parallèle imposerait de tout redoubler.
- L'exploration par **voisinage de graphe** (degrés de séparation) est une *autre* approche que notre `Affinity` par dimension ; elle reste un **deepening différé** (cf. ADR 0003, Phase 4 « intelligence sémantique »), avec le **vector search** Convex.

### 2. Le scoring reste la `ScoringPolicy` — pas de seconde formule

Le barème ad hoc du brouillon (`Likes×10 + Opens×2 − Skips×5`) est **écarté**. Les `INTERACTION_WEIGHTS` + facteurs + `projectAffinities` de l'ADR 0003 restent l'unique source de vérité. Les signaux d'`Engagement` (consommation normalisée par type) nourrissent l'`Affinity` via cette même policy.

### 3. Ingestion pilotée par `FetchDemand` (cron agrégé), découplée des gestes

Ce qu'on fetch est décidé par la **`FetchDemand`** : l'agrégat des `Affinity` de l'audience du tenant + un quota de diversité + un **seed de bootstrap** (catégories configurées au tenant, pour le cold start). Une **ingestion planifiée (cron Convex)** consomme cette demande et appelle le provider ; le résultat est dédupliqué (par `externalId`) et upserté dans `contents`, **corpus partagé** réutilisable par tous les membres du tenant.

- *Pourquoi pas le buffer-refill per-session du brouillon* : déclencher un fetch en direct sur le geste/épuisement d'un membre couple A→B en temps réel, impose dédup + rate-limit à la volée, et risque des boucles de rétroaction sur petit corpus. L'effet de groupe (tendance) est conservé — mais via l'**agrégat**, en différé.
- Le **fetch on-demand** reste une évolution possible *si* le feed paraît stale, ajoutée plus tard.

### 4. Infinite scroll = mécanique de feed séparée (pagination seed-stable)

Le feed infini est de la **pagination du corpus local** (curseur, ordre déterministe par `user + sessionSeed`), distincte de l'ingestion. Le « buffer » est une file client alimentée par les pages **locales** ; le cron remplit le corpus en fond. C'est une **slice séparée**, pas Slice D.

### 5. Mode Immersion (lecture hypertexte) — différé

La lecture JIT d'une page Wikipedia (parse HTML, réécriture des liens `/wiki/...` en routes internes, résolution juste-à-temps + persistance) est une **expérience de lecture entière, spécifique Wikipedia**. C'est une **slice ultérieure**, hors du moteur d'ingestion.

### 6. Hors scope (différés)

Graphe `edges`, vector search, **pruning** du corpus, fetch on-demand, et l'**onboarding nuage-de-tags** (qui sèmera plus tard des `Affinity` initiales par membre).

## Périmètre Slice D (immédiat)

Ingestion seule : champs source sur `contents` ; `WikipediaProvider` (adapter du port, `generator=search` + `categorymembers`) ; dédup par `externalId` ; catégories seed au tenant ; `FetchDemand` (pure) ; cron d'ingestion ; isolation source pour que le contenu Wikipedia n'apparaisse **que** dans la découverte, pas dans le `Feed` éditorial (Accueil/Explore).

## Conséquences

### Positives

- Vrai contenu pour tester le moteur ; **second adapter réel** qui valide le port hexagonal.
- Zéro duplication de modèle : on réutilise `contents`/ScoringPolicy/feed/carte.
- Croissance du corpus orientée par l'intérêt collectif, sans couplage per-utilisateur ni complexité buffer/concurrence.

### Négatives / risques

- Dépendance API externe (quotas, latence, disponibilité) → providers isolés, modèle canonique stocké, source affichée, provider désactivable (ADR 0003, Risque 6).
- Sans pruning, le corpus croît : acceptable au début, à surveiller (pruning différé).
- La pertinence dépend de la qualité des catégories seed et de l'agrégat — d'où le quota de diversité.

## Supersession

Cet ADR **remplace** les propositions du brouillon initial sur : le modèle `pages`/`edges`, la formule de score ad hoc, et le buffer-refill per-session comme mécanisme primaire. Il reste **aligné** avec l'ADR 0003, qu'il étend (premier provider externe).
