# Discovery / Product — Backlog (parking lot)

Idées soulevées mais non planifiées. Rangées ici pendant que **Slice H** (largeur + fraîcheur) est en cours, pour ne rien perdre. À prioriser ensemble plus tard.

---

## 🐞 Bugs (priorité)

- **[P0] CMS — boucle infinie sur la recherche de contenu.** Rechercher dans la liste de contenu du CMS boucle. Probablement la même classe que la boucle feed mobile déjà corrigée (query réactive / effet qui se re-déclenche). À investiguer côté `apps/cms` + la query de recherche (`convex/content/queries.ts` `searchPublished` / l'écran CMS). **Indépendant de Slice H (autre surface) → corrigeable en parallèle.**

---

## 🎯 Richesse du feed / scoring

- **imageBoost** (inspiré du README de Xikipedia : valeurs par défaut par post). Bonifier le score d'un `Content` qui a une `heroImageUrl`, pour que le feed remonte plus d'articles illustrés (~70 % des articles Wikipedia ingérés n'ont pas d'image aujourd'hui). Petit tweak dans la `ScoringPolicy`. Candidat à une passe « tuning du scoring ».

---

## 🗂️ CMS

- **Pagination** de la liste de contenu (377+ items, ça va grossir).
- **Filtre par provider / source** (cms vs wikipedia) dans la liste CMS.
- (La recherche porte déjà sur tout le contenu — confirmé.)

---

## ⚙️ Config tenant / personnalisation de l'app

- **Ordre + affichage des sections de feed configurables par tenant** (dans la config / preview tenant) : ordonner les « tables »/sections, les afficher ou non. S'appuie sur `feedSections` / `enabledModules` existants.
- **Couche méta « développeur » au-dessus du tenant** : des flags `is_enabled` par module (collections, agenda, …) contrôlés par **le développeur (nous)**, un cran **au-dessus** de la config du tenant. À distinguer du `enabledModules` du tenant. Nécessite une décision de design : **hiérarchie de config** développeur → tenant → membre. (Candidat ADR.)

---

## ✅ Déjà tracé ailleurs (cross-ref, pas du backlog)

- **Re-personnalisation à chaque loadMore** : c'est **déjà le design** (le serveur re-score chaque page avec les affinités courantes), renforcé par Slice H. Pas du backlog.
- **Taxonomie de `Category` gérée par le tenant** → `docs/adr/0006-tenant-managed-category-taxonomy.md`.
- **Largeur de découverte** (tags réels, sérendipité, frontière, graphe) → `docs/adr/0005-discovery-breadth.md`.
- **Nuage d'onboarding** (le fan pioche dans la taxonomie → affinités) → slice après la taxonomie.
- **Politique recherche / fetch multi-providers** → ADR futur (noté dans ADR 0006).
