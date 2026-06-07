# Discovery / Product — Backlog (parking lot)

Idées soulevées mais non encore planifiées en slice. Rangées par **priorité** : la **Vague en cours** (haut) est ce qu'on attaque maintenant — **CMS config + Mobile UI**. Tout le reste est parqué dessous (« Plus tard »), à prioriser plus tard. État baseline : slices A→M mergées dans `dev` (seam provider durci et prouvé).

---

## 🎯 Vague en cours — Config tenant & Mobile UI

> Focus actuel : la config de l'app côté CMS (sections de feed, modules) **et** le polish UI mobile (Bibliothèque, cartes, recherche Home). Pas de clés API pour l'instant (parqué plus bas).

### ⚙️ Config tenant / personnalisation de l'app

- **Ordre + affichage des sections de feed configurables par tenant** (dans la config / preview tenant) : ordonner les « tables »/sections, les afficher ou non. S'appuie sur `feedSections` / `enabledModules` existants.
- **Nommer les sections de feed de l'écran d'accueil.** Dans la config CMS de l'écran home, ce qu'on sélectionne dans les tables doit pouvoir recevoir un **nom d'affichage**. Vocabulaire à figer : **Home Feed** (accueil, plus traditionnel) vs **Discover Feed** (le feed discovery perso). S'appuie sur `feedSections`.
- **Icône de module configurable** : permettre au tenant (CMS) de choisir l'icône d'un module, sur le même modèle que les catégories. (Croise le polish modules mobile ci-dessous.)

### 🏠 Home Feed / Explore — recherche & convergence

- **Recherche dans le Home Feed (nécessaire).** Afficher une **barre de recherche** (ou au minimum un **bouton** de recherche) **au-dessus des tags de filtre** dans l'accueil. C'est un requis, pas un nice-to-have.
- **Convergence Explore ↔ Home Feed (UX à trancher).** Deux pistes : (a) au tap sur la barre de recherche du Home, **afficher le contenu de la page Explore** (Explore devient le mode recherche du Home) ; ou (b) **garder Explore comme page configurable à part**. Décider la bonne UX avant d'implémenter. Lié : « qu'est-ce qui est sélectionné dans le Home Feed » vient du CMS (cf. « Nommer les sections de feed »).

### 📱 Mobile — Bibliothèque & UI

Retours terrain après usage réel (favoris enregistrés, navigation Bibliothèque).

**Favoris / Enregistrés**
- **Renommer « Enregistrés » → « Favoris »** partout dans l'app (Profil, Bibliothèque, stats, i18n).
- **Retirer le badge « Gratuit »** sur la section Favoris : quand la feature est gratuite, ne pas afficher de tag de gate à côté du titre.
- **Liste complète des favoris** : la page Bibliothèque n'affiche qu'un aperçu (≈ 4 items) alors que l'utilisateur peut en avoir bien plus. Ajouter une page dédiée « Tous mes favoris » accessible depuis la section (chevron / « Voir tout »).

**Fichiers hors-ligne**
- **Liste complète des téléchargements** : même pattern que les favoris — aperçu limité sur Bibliothèque (≈ 3 items), page dédiée pour la liste complète.

**Bibliothèque — polish**
- **Retirer la loupe** alignée à droite du titre de page sur les écrans Bibliothèque / explore (ex. « Tu as le droit d'explorer ») : pas de recherche inline sur ces pages pour l'instant.

**Modules**
- **Revoir le layout du grid de modules** dans l'app mobile : disposition actuelle un peu bizarre à corriger.

**Cartes « À découvrir »**
- **Summary plus long quand présent** : passer de 2 lignes max à ~4 lignes de summary sur les cartes « À découvrir », pour un aperçu plus riche quand le contenu en a un.

**Retour haptique (app-wide)**
- **Retour haptique sur toute l'application.** S'inspirer de **`../editia/mobile/lib/utils/haptics.ts`** : service central `HapticsService` (`expo-haptics`) avec intensités sémantiques (`light`, `medium`, `heavy`) et patterns (`success`, `error`, `warning`, `selection`), no-op sur web. Editia branche déjà le service dans les composants partagés (`Button`, `Chip`, tab bar, toggles…) — reproduire le même pattern : installer `expo-haptics`, créer le service, puis l'appliquer progressivement aux primitives UI et aux interactions clés (navigation, favoris, filtres, actions primaires/secondaires, confirmations).

---

## 🐞 Bugs

- **Article Wikipedia — flicker de l'extrait au chargement.** À l'ouverture d'un article, l'extrait s'affiche d'abord en gras seul, puis le contenu complet prend le relais — léger flicker visuel. Hypothèse : l'extrait sert de placeholder pendant le fetch du corps. Piste : afficher l'extrait en style light (pas bold) tant que le contenu n'est pas chargé, pour une transition plus seamless.

---

## 🔭 Plus tard (parqué)

### 📺 Providers

- **Provider YouTube (chaîne du tenant).** Le prochain vrai adapter produit, **débloqué** par le GATE (seam durci, Slice M) : se branche sur le seam prouvé via `providerConfigs.youtube`, sans réintroduire de paramètres spécifiques dans le port partagé. Touche le modèle `Video` (ADR : `YouTubeVideo` vs `HostedVideo`).
- **Langue des articles Wikipedia alignée sur la langue app (membre).** La locale Wikipédia est aujourd'hui une config **tenant** (CMS, `providerConfigs.wikipedia.locale`). Reste à voir si on l'aligne aussi sur la sélection de langue **membre** (`language-item` / `useSelectedLanguage`) pour le fetch perso. Candidat onboarding plus tard. Hors scope immédiat.

### 🎯 Richesse du feed / scoring

- **imageBoost** (inspiré du README de Xikipedia : valeurs par défaut par post). Bonifier le score d'un `Content` qui a une `heroImageUrl`, pour que le feed remonte plus d'articles illustrés (~70 % des articles Wikipedia ingérés n'ont pas d'image aujourd'hui). Petit tweak dans la `ScoringPolicy`. Candidat à une passe « tuning du scoring ».

### 🗂️ CMS — infra

- **Pagination** de la liste de contenu (1500+ items aujourd'hui, ça grossit).
- **Filtre par provider / source** (`cms` / `wikipedia` / `rss`) dans la liste CMS. (La recherche porte déjà sur tout le contenu — confirmé.)
- **Backfill `source` des vieux contenus** : ~16 contenus historiques ont `source` absent (`undefined`). Les passer à `source: "cms"` pour que le futur filtre par source soit propre.

### 🧱 Couche méta « développeur » (au-dessus du tenant) — candidat ADR

- Des flags `is_enabled` par module (collections, agenda, …) contrôlés par **le développeur (nous)**, un cran **au-dessus** de la config du tenant. À distinguer du `enabledModules` du tenant. Nécessite une décision de design : **hiérarchie de config** développeur → tenant → membre.

### 🔌 API publique tenant — clés API (onglet Développeur CMS) — PARQUÉ (pas maintenant)

> Volontairement repoussé : on priorise d'abord la config tenant + l'UI mobile.

**Inspiration :** `../editia/web` — composant **`convex-api-keys`**, routes HTTP Bearer (`/v1/…`), scopes `resource:action`, rate limits, mutations `createKey` / `listMyKeys` / `revokeKey` / `rotateKey`, handlers dans `httpHandlers/*` + `apiKeys/handlerMutations.ts`. Réf. plan Editia : `content/roadmap/plans/2026-05-09-public-api-v1-ideas.mdx` ; UI clés : `app/[locale]/settings/developers/`.

**Objectif :** depuis l'onglet **Développeur** du CMS, créer/gérer des **clés API tenant** puis **alimenter le backend par programme** via HTTP.

- **Infra (Phase 0)** : installer `convex-api-keys` + rate limiter (cf. `editia/web/convex/convex.config.ts`) ; namespace `tenant:${tenantId}` (mono-tenant) ; scopes par ressource (`content:read|write`, `category:*`, `collection:*`, `list:*`, `agenda:*`, `bookmark:*`) ; pipeline Bearer → `authorizeRequest` → rate limit → mutation métier (mêmes validations que `convex/cms/**`, **sans** filtrer sur publié — le tenant peut créer du brouillon via l'API).
- **Endpoints v1 (candidats)** : Contenu (CRUD article/épisode/vidéo), Catégorie (CRUD taxonomie + lien catalogue), Collection (CRUD + ajout/retrait de contenu), Liste (CRUD), Agenda (CRUD). *(Marqueur/favori : plutôt surface membre, probablement hors v1 tenant.)*
- **UI CMS — onglet Développeur** : section **Clés API** (créer avec scopes cochables, lister, révoquer, rotation — token plaintext une seule fois, pattern `CreateKeyModal`/`KeyRevealedModal`) ; section **Référence API** (base URL, auth Bearer, table scopes ↔ endpoints, exemples curl).
- Candidat ADR : auth API tenant vs Clerk CMS, quotas, audit log.

---

## ✅ Fait / tracé ailleurs (cross-ref)

- **[GATE] Seam provider durci** → **✅ Slice M** (`docs/superpowers/plans/2026-06-07-discovery-slice-m-provider-seam-hardening.md`, mergée dans `dev`) : port réduit à `{ tenantSlug, demand }`, `providerConfigs` opaque par source/tenant, locale Wikipédia auto-résolue dans l'adapter, migration du champ legacy, 2ᵉ adapter réel `rss` branché. Vérifié live (wikipedia 1508 + rss 25 en base).
- **[P0] CMS — boucle infinie recherche de contenu** → ✅ Corrigé (`0210623`) : sélection désormais gérée uniquement par `ContentsTab` (filter-aware).
- **Re-personnalisation à chaque loadMore** : déjà le design (re-score serveur par page), renforcé par Slice H. Pas du backlog.
- **Taxonomie `Category` gérée par le tenant** → `docs/adr/0006-tenant-managed-category-taxonomy.md`.
- **Catalogue global hiérarchique + UX recherche/nuage** → `docs/adr/0007-hierarchical-category-catalog.md` ; Slice J (backend) ✅ → Slice K (CMS Développeur) ✅ → Slice L (nuage hiérarchique mobile Réglages) ✅. Couche taxonomie/catalogue/picker complète.
- **Largeur de découverte** (tags réels, sérendipité, frontière, graphe) → `docs/adr/0005-discovery-breadth.md`.
- **Nuage d'onboarding** (le fan pioche dans la taxonomie → affinités) → réutilise le composant nuage des Réglages, à brancher dans un flux d'onboarding (pas encore tracé).
- **Politique recherche / fetch multi-providers** → ADR futur (noté dans ADR 0006).
