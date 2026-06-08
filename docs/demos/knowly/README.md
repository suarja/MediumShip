# Knowly

**Knowly, c’est le Gleeph des idées** — une application mobile de découverte et de suivi d’idées (texte, vidéo, bientôt audio), avec un fil personnalisé par algorithme.

Ce dossier documente **Knowly en tant que produit**, pas seulement comme argument de vente du socle white-label.

---

## Stratégie produit (lecture interne)

Knowly occupe **deux rôles distincts**. Il ne faut pas les mélanger dans le même pitch.

| | **Knowly** (ce produit) | **MediumShip** (white-label créateurs) |
| --- | --- | --- |
| **Quoi** | App **B2C** publiable sur les stores | Socle technique + config par client |
| **Public** | Curieux, apprenants, utilisateurs de Gleeph/Wikipédia/YouTube qui veulent mieux scroller | Créateurs, médias, podcasteurs qui veulent **leur** app à leur marque |
| **Promesse** | Explorer et retrouver des idées qui vous correspondent | Transformer **leur** contenu en app propriétaire monétisable |
| **Relation** | Produit à part entière | Offre commerciale séparée |

### « Démo qui va au bout »

Knowly n’est pas une maquette pour salon professionnel. C’est une **démo poussée jusqu’au produit fini** : expérience complète, publication store envisageable, métriques d’usage réelles.

- **Objectif principal** : réussir comme **application grand public** (acquisition, rétention, valeur perçue).
- **Effet secondaire stratégique** : si Knowly attire (downloads, presse, bouche-à-oreille), ça **prouve** ce que le moteur sait faire et **facilite** la vente MediumShip aux créateurs — sans que les créateurs soient la cible de Knowly.

> Knowly n’est pas vendu aux créateurs. MediumShip ne s’adresse pas aux curieux qui téléchargent Knowly. Même codebase, **deux go-to-market**.

### Ce qui est partagé vs. propre à Knowly

| Partagé (MediumShip) | Propre à Knowly |
| -------------------- | --------------- |
| Content Discovery Engine | Marque, copy store, positionnement « Gleeph des idées » |
| Providers (Wikipedia, YouTube, …) | Corpus et sélection éditoriale démo |
| Auth, bookmarks, feed, explorer | Identité App Store, ASO, support utilisateur |
| Architecture white-label *possible* | Pas d’obligation de personnalisation tenant |

---

## Documents de ce dossier

| Fichier | Public | Contenu |
| ------- | ------ | ------- |
| **[README.md](./README.md)** (ce fichier) | Équipe / stratégie | Rôles Knowly vs MediumShip, index |
| **[fiche-client.md](./fiche-client.md)** | Utilisateur final, store, communication B2C | Proposition de valeur, problème, promesse, pitch **grand public** |
| **[fiche-technique.md](./fiche-technique.md)** | Équipe produit / tech | Architecture, providers, risques, DoD store, contre-expertise |

**Règle** : la fiche client parle **à celui qui télécharge l’app**. La stratégie B2B et le lien MediumShip vivent ici (README) et en partie dans la fiche technique.

---

## Positionnement v1 (rappel)

- **Gleeph des idées** — bibliothèque, favoris, profil de curiosité, feed adaptatif.
- **Encyclopédie vivante + algorithme** — pas un réseau social en v1 (couche sociale éventuelle plus tard).
- **Sources actuelles** : Wikipedia, YouTube · **prévu** : podcast/RSS, blogs, Substack (à valider).

---

## Liens repo

- Socle technique : [`CONTEXT.md`](../../CONTEXT.md)
- Moteur discovery : [`docs/adr/0003-content-discovery-engine.md`](../../adr/0003-content-discovery-engine.md)
- Architecture : [`docs/plans/2026-06-03-mediumship-architecture-design.md`](../../plans/2026-06-03-mediumship-architecture-design.md)
