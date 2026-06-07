# Discovery / Product — Backlog (parking lot)

Idées soulevées mais non planifiées. Rangées ici pendant que **Slice H** (largeur + fraîcheur) est en cours, pour ne rien perdre. À prioriser ensemble plus tard.

---

## 🐞 Bugs (priorité)

- ~~**[P0] CMS — boucle infinie sur la recherche de contenu.**~~ **✅ Corrigé** (`0210623`) : conflit entre deux effets de sélection (ContentsTab désélectionnait sur recherche vide, le dashboard re-sélectionnait le 1er contenu global → ping-pong). Sélection désormais gérée uniquement par `ContentsTab` (filter-aware).
- **Article Wikipedia — flicker de l'extrait au chargement.** À l'ouverture d'un article, l'extrait s'affiche d'abord en gras seul, puis le contenu complet prend le relais — léger flicker visuel. Hypothèse : l'extrait sert de placeholder pendant le fetch du corps. Piste : afficher l'extrait en style light (pas bold) tant que le contenu n'est pas chargé, pour une transition plus seamless.

---

## 🌐 Langue & providers (Wikipedia)

- **Langue des articles Wikipedia alignée sur la langue app.** Aujourd'hui le provider Wikipedia pointe en dur sur `en.wikipedia.org`. Réutiliser la sélection de langue déjà présente dans Réglages (`language-item` / `useSelectedLanguage`) pour piloter les requêtes du provider (articles en français, en anglais, etc.). Pas de nouvel écran dédié pour l'instant — s'appuyer sur le groupe langue existant. Candidat onboarding plus tard (nucloud d'affinités), mais hors scope immédiat.

---

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

## 📱 Mobile — Bibliothèque & UI

Retours terrain après usage réel (favoris enregistrés, navigation Bibliothèque).

### Favoris / Enregistrés

- **Renommer « Enregistrés » → « Favoris »** partout dans l'app (Profil, Bibliothèque, stats, i18n).
- **Retirer le badge « Gratuit »** sur la section Favoris : quand la feature est gratuite, ne pas afficher de tag de gate à côté du titre.
- **Liste complète des favoris** : la page Bibliothèque n'affiche qu'un aperçu (≈ 4 items) alors que l'utilisateur peut en avoir bien plus. Ajouter une page dédiée « Tous mes favoris » accessible depuis la section (chevron / « Voir tout »).

### Fichiers hors-ligne

- **Liste complète des téléchargements** : même pattern que les favoris — aperçu limité sur Bibliothèque (≈ 3 items), page dédiée pour la liste complète.

### Bibliothèque — polish

- **Retirer la loupe** alignée à droite du titre de page sur les écrans Bibliothèque / explore (ex. « Tu as le droit d'explorer ») : pas de recherche inline sur ces pages pour l'instant.

### Modules

- **Icône de module configurable** : permettre au tenant (CMS) de choisir l'icône d'un module, sur le même modèle que les catégories.
- **Revoir le layout du grid de modules** dans l'app mobile : disposition actuelle un peu bizarre à corriger.

### Cartes « À découvrir »

- **Summary plus long quand présent** : passer de 2 lignes max à ~4 lignes de summary sur les cartes « À découvrir », pour un aperçu plus riche quand le contenu en a un.

---

## ✅ Déjà tracé ailleurs (cross-ref, pas du backlog)

- **Re-personnalisation à chaque loadMore** : c'est **déjà le design** (le serveur re-score chaque page avec les affinités courantes), renforcé par Slice H. Pas du backlog.
- **Taxonomie de `Category` gérée par le tenant** → `docs/adr/0006-tenant-managed-category-taxonomy.md`.
- **Catalogue global hiérarchique + UX recherche/nuage** → `docs/adr/0007-hierarchical-category-catalog.md` ; Slice J (backend) ✅ → **Slice K (CMS Développeur)** → Slice L (mobile Settings).
- **Largeur de découverte** (tags réels, sérendipité, frontière, graphe) → `docs/adr/0005-discovery-breadth.md`.
- **Nuage d'onboarding** (le fan pioche dans la taxonomie → affinités) → après Slice L (composant Réglages réutilisable).
- **Politique recherche / fetch multi-providers** → ADR futur (noté dans ADR 0006).
