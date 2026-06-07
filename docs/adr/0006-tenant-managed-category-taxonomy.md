# ADR 0006 — Taxonomie de `Category` gérée par le tenant

## Statut

Proposé

## Date

2026-06-07

## Contexte

Aujourd'hui, une `Category` n'est pas une entité gérée : elle existe sous deux formes implicites et disjointes.

1. **Dérivée du contenu** : l'écran Explore liste les catégories via `listPublishedCategories`, qui compte les valeurs du champ libre `contents.category` des contenus publiés. → seules apparaissent les catégories **qui ont déjà du contenu**.
2. **Amorçage découverte** : `tenants.discoverySeedCategories` (tableau de chaînes, ex. `["Science", "Philosophy"]`) sert uniquement à amorcer le fetch du `WikipediaProvider`.

Aucune des deux n'est une **taxonomie possédée par le tenant** : une liste qu'il définit, étend, et assigne à son contenu — y compris des catégories **sans contenu encore**. Or le produit en a besoin :

- **Notre client = le `Tenant`/`Creator`** veut définir les rubriques de **son** univers (ex. les catégories de sa chaîne YouTube) et les assigner à son contenu.
- **Le fan = le `Member`** veut **choisir parmi ces catégories** (nuage d'onboarding) pour personnaliser son feed.
- Le tenant voit/utilise **toutes** les catégories ; le fan en sélectionne un sous-ensemble.

## Décision

Promouvoir `Category` au rang de **taxonomie de premier ordre, gérée par le tenant**, et en faire la **source de vérité unique** pour l'architecture d'information.

- **Possession & gestion** : une liste de catégories **possédée par le tenant**, amorcée par une **liste par défaut au setup**, **extensible** (le tenant ajoute / édite / retire), avec métadonnées éditoriales (libellé, clé normalisée via `ScoringKey`, éventuellement icône/ordre).
- **Assignation** : le contenu référence une catégorie **de cette taxonomie** (le champ `category` devient une référence à une catégorie gérée, pas une chaîne libre).
- **Source de vérité unique** pour :
  - l'axe d'Explore (au lieu du dérivé-du-contenu) ;
  - l'amorçage de la découverte (la taxonomie **remplace** `discoverySeedCategories`) ;
  - le **nuage d'onboarding** dans lequel le `Member` pioche.
- **Personnalisation** : le `Member` sélectionne un sous-ensemble → sème ses `Affinity`. Le `Tenant`/`Creator` possède la liste complète (catégories vides incluses).
- **Catégories sans contenu** : la taxonomie peut contenir des catégories sans contenu (utiles pour l'intention de fetch et l'onboarding) ; Explore peut toujours afficher des compteurs, mais l'**axe** vient de la taxonomie.

**Générique / white-label** : la taxonomie est le **vocabulaire de contenu du tenant**. Pour un tenant « chaîne YouTube », ce sont ses rubriques ; les catégories Wikipedia (démo) y sont mappées. Provider-agnostic.

## Conséquences

### Positives

- Propriété claire : le tenant possède ses catégories ; le fan personnalise depuis une vraie liste.
- Unifie les deux notions disjointes (dérivée + seed) en une seule source de vérité.
- Débloque le **nuage d'onboarding** et fiabilise l'amorçage de la découverte.

### Négatives / risques

- Travail schéma + CMS (gestion de la taxonomie, assignation à la création de contenu).
- **Migration** des valeurs `category` en chaîne libre existantes vers des catégories gérées.
- Les clés de taxonomie doivent rester alignées avec les clés d'`Affinity` (`ScoringKey`) pour ne pas casser le scoring.

## Relation aux autres ADR & séquencement

- Étend l'ADR 0003 (glossaire `Category`) ; **remplace** l'usage ad hoc de `discoverySeedCategories` (ADR 0004) par la taxonomie.
- **Séquencement** : une slice « taxonomie de catégories » (schéma + gestion CMS + assignation + branchement découverte) est **prérequis** au nuage d'onboarding. Slice H (largeur/fraîcheur) est indépendante et peut avancer en parallèle.

## Hors scope (noté pour plus tard)

- **Politique de recherche / fetch multi-providers** : aujourd'hui la recherche porte sur la table unifiée `contents` (toutes sources). Quand plusieurs providers coexisteront, la règle « quel provider sert quelle demande, et la recherche couvre-t-elle tous les providers » fera l'objet d'un ADR dédié.
