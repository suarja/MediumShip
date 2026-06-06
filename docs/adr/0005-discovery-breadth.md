# ADR 0005 — Largeur de découverte : sortir de l'univers fermé des catégories seed

## Statut

Proposé

## Date

2026-06-07

## Contexte

Le Content Discovery Engine (ADR 0003) classe le contenu par `Affinity`, et l'ingestion (ADR 0004) est pilotée par `FetchDemand` : un agrégat des affinités du tenant + les catégories seed + un quota de diversité, consommé par un cron + un refill on-demand. Le `WikipediaProvider` (démo) fetch en recherche plein-texte avec un offset persisté par catégorie, ce qui donne de la **profondeur** (des milliers de pages par thème).

En usage réel, un constat est remonté : *on fetch toujours plus de contenu dans les mêmes catégories ; on ne découvre jamais de catégorie nouvelle.*

## Problème

**L'univers thématique découvrable est un cercle fermé, borné par les catégories seed.**

Analyse de `computeFetchDemand` :

- En cold start : `categories = seeds`.
- Sinon : top des catégories d'`Affinity` + des slots « diversité » remplis **depuis les seeds ou d'autres affinités déjà connues**.
- Une `Affinity` ne naît que d'une interaction avec un contenu **déjà présent** dans le corpus.

Donc l'ensemble des catégories fetchées ⊆ {seeds ∪ catégories déjà publiées}. Aucun mécanisme n'introduit une catégorie **hors** de cet ensemble. La query donne de la **profondeur**, pas de la **largeur**.

Deux niveaux de « découverte » à distinguer :

- **Découverte au niveau du feed** (dans le corpus) : fonctionne — le scoring mixe perso + archive + random/sérendipité.
- **Découverte au niveau du corpus** (de nouveaux thèmes entrent) : **n'existe pas** aujourd'hui. C'est le manque.

**Gâchis aggravant :** le contenu ingéré est stocké avec `tags: []` et `category` = le simple **label seed** sous lequel il a été fetché. Les vraies catégories / liens de la source (un article Wikipedia en a 5–15, plus des liens) sont **jetés** — or c'est précisément la matière première d'une frontière de découverte.

## Décision

Adopter une stratégie d'**élargissement de la frontière de découverte**, **générique et découplée du provider** (Wikipedia n'est que la démo ; pour un provider YouTube, l'équivalent = ses propres catégories / vidéos liées). Mise en œuvre **étagée**, du moins cher au plus profond :

1. **Extraction des dimensions réelles à l'ingestion.** Chaque `Content` ingéré capture les catégories / mots-clés / liens fournis par sa source dans `tags` (et conserve la catégorie de fetch). → `Affinity` plus fine **et** une frontière de thèmes adjacents.
2. **Quota de sérendipité à l'ingestion.** Un petit pourcentage de contenu **réellement aléatoire** (ex. l'API *random* de Wikipedia), **indépendant des affinités**, entre dans le corpus → nouveauté pure, anti-bulle au niveau du corpus (et non plus seulement du feed).
3. **Promotion de frontière.** Les dimensions adjacentes extraites (étape 1) vers lesquelles l'audience **dérive** (engagement) sont promues dans `FetchDemand` → de **nouveaux thèmes** sont ingérés organiquement.
4. **Exploration de graphe (différée).** Suivre les liens/relations à N degrés (les `edges` de l'ADR 0004) → découverte adjacente riche. Couplable plus tard à la recherche vectorielle.

**Invariants :**

- La largeur est un problème de **corpus (ingestion)**, pas de **feed (scoring)** — le feed sait déjà exposer ce qui existe.
- La sérendipité et la promotion de frontière restent **bornées par un quota** pour ne pas noyer la pertinence.
- L'`onboarding` (slice à part) adresse la largeur **au démarrage à froid** (choisir plus de seeds depuis la taxonomie du tenant) ; il **ne remplace pas** l'expansion organique décrite ici.

## Conséquences

### Positives

- De la **vraie découverte** : de nouveaux thèmes entrent dans le corpus au fil de l'usage, pas seulement plus de profondeur.
- `Affinity` plus fine (tags réels) → meilleur classement.
- Reste générique : tout provider qui expose des catégories/liens + un tirage aléatoire alimente la frontière.

### Négatives / risques

- Plus de complexité d'ingestion ; risque de pertinence si la sérendipité/frontière n'est pas bornée → quotas + qualité éditoriale.
- Dépend de la richesse des métadonnées du provider (un provider pauvre en catégories limite l'étape 1).
- L'extraction de tags réels change le sens de `tags` pour le contenu importé → à versionner proprement.

## Relation aux autres ADR

Étend l'ADR 0003 (Affinity/ScoringPolicy) et l'ADR 0004 (FetchDemand/providers). Les étapes 1–3 sont candidates à une slice « discovery breadth » ; l'étape 4 reste alignée avec le `edges`/vector différé de l'ADR 0004.
