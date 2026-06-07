# Discovery / Product — Backlog (parking lot)

Idées soulevées mais non planifiées. Rangées ici pendant que **Slice H** (largeur + fraîcheur) est en cours, pour ne rien perdre. À prioriser ensemble plus tard.

---

## 🐞 Bugs (priorité)

- ~~**[P0] CMS — boucle infinie sur la recherche de contenu.**~~ **✅ Corrigé** (`0210623`) : conflit entre deux effets de sélection (ContentsTab désélectionnait sur recherche vide, le dashboard re-sélectionnait le 1er contenu global → ping-pong). Sélection désormais gérée uniquement par `ContentsTab` (filter-aware).
- **Article Wikipedia — flicker de l'extrait au chargement.** À l'ouverture d'un article, l'extrait s'affiche d'abord en gras seul, puis le contenu complet prend le relais — léger flicker visuel. Hypothèse : l'extrait sert de placeholder pendant le fetch du corps. Piste : afficher l'extrait en style light (pas bold) tant que le contenu n'est pas chargé, pour une transition plus seamless.

---

## 🧱 Architecture providers — GATE avant un 2ᵉ provider

**Inquiétude soulevée : le seam d'ingestion est-il vraiment générique / hexagonal ?** Vérification : le port `ContentProvider` est sain (registry `PROVIDERS`, adapter identité `cmsProvider`, adapter `wikipediaProvider`), **mais du Wikipédia a fui dans le cœur générique** :
- `ContentProvider.ingest()` (`convex/discovery/provider.ts`) porte un paramètre `wikipediaLocale?: WikipediaLocale` → le port partagé importe un type spécifique provider.
- L'orchestrateur générique `runDiscoveryIngestion` / `getTenantIngestionInputs` (`convex/discovery/ingest.ts`) lit `tenant.wikipediaLocale` et le pousse vers **tous** les providers.

Ça fonctionne aujourd'hui, mais ça ne scale pas : chaque nouveau provider voudrait empiler ses propres params (`youtubeChannelId`, clés API…) sur le port partagé. **C'est la dette à traiter AVANT d'ajouter un vrai 2ᵉ provider**, pour ne pas répliquer le couplage.

- **[GATE] Vérification finale + refactor du seam provider** → **planifié : `docs/superpowers/plans/2026-06-07-discovery-slice-m-provider-seam-hardening.md`** (Slice M). Rendre le port agnostique : la config spécifique (locale, channel id, credentials) est résolue **dans l'adapter** depuis un blob `providerConfigs` opaque par tenant que l'orchestrateur ne lit jamais. Prouvé par un 2ᵉ adapter réel (flux RSS, sans clé API). Bloque l'item ci-dessous.
- **Provider YouTube (chaîne du tenant).** Le 2ᵉ vrai adapter — celui qui *prouve* le seam (1 adapter = couture hypothétique, 2 = couture réelle). À ne lancer **qu'après** le GATE ci-dessus.

---

## 🌐 Langue & providers (Wikipedia)

- **Langue des articles Wikipedia alignée sur la langue app.** Aujourd'hui le provider Wikipedia pointe en dur sur `en.wikipedia.org`. Réutiliser la sélection de langue déjà présente dans Réglages (`language-item` / `useSelectedLanguage`) pour piloter les requêtes du provider (articles en français, en anglais, etc.). Pas de nouvel écran dédié pour l'instant — s'appuyer sur le groupe langue existant. Candidat onboarding plus tard (nucloud d'affinités), mais hors scope immédiat.

---

## 🎯 Richesse du feed / scoring

- **imageBoost** (inspiré du README de Xikipedia : valeurs par défaut par post). Bonifier le score d'un `Content` qui a une `heroImageUrl`, pour que le feed remonte plus d'articles illustrés (~70 % des articles Wikipedia ingérés n'ont pas d'image aujourd'hui). Petit tweak dans la `ScoringPolicy`. Candidat à une passe « tuning du scoring ».

---

## 🔌 API publique tenant — onglet Développeur (CMS)

**Inspiration :** `../editia/web` — composant **`convex-api-keys`**, routes HTTP Bearer (`/v1/…`), scopes `resource:action`, rate limits, mutations `createKey` / `listMyKeys` / `revokeKey` / `rotateKey`, handlers dans `httpHandlers/*` + `apiKeys/handlerMutations.ts`. Réf. plan Editia : `content/roadmap/plans/2026-05-09-public-api-v1-ideas.mdx` ; UI clés : `app/[locale]/settings/developers/`.

**Objectif MediumShip :** depuis l'onglet **Développeur** du CMS (aujourd'hui catalogue IPTC + langues discovery), permettre de **créer et gérer des clés API tenant** puis d'**alimenter le backend par programme** — comme si on travaillait depuis le CMS, mais via HTTP.

### Infrastructure (Phase 0)

- Installer **`convex-api-keys`** + rate limiter (cf. `editia/web/convex/convex.config.ts`).
- Namespace **`tenant:${tenantId}`** (mono-tenant CMS, pas `user:` comme Editia).
- Scopes initiaux par ressource : `content:read|write`, `category:read|write`, `collection:read|write`, `list:read|write`, `agenda:read|write` (événements), `bookmark:read|write` si exposé côté tenant.
- Pipeline handler : Bearer → `authorizeRequest` → rate limit → mutation métier (même validations que `convex/cms/**`, **sans** filtrer sur « activé pour annonce » — le tenant a le droit de créer du contenu brouillon / non publié via l'API).

### Endpoints v1 (candidats)

- **Contenu** — CRUD article / épisode / vidéo (`Content`).
- **Catégorie** — CRUD taxonomie tenant (+ lien catalogue si pertinent).
- **Collection** — CRUD collection + **ajout / retrait de contenu** dans une collection.
- **Liste** — CRUD listes éditoriales.
- **Agenda** — CRUD événements.
- *(Marqueur / favori : à trancher — plutôt surface membre ; probablement hors v1 tenant.)*

### UI CMS — onglet Développeur

- Section **Clés API** : créer (scopes cochables), lister, révoquer, rotation — token plaintext une seule fois à la création (pattern `CreateKeyModal` / `KeyRevealedModal` Editia).
- Section **Référence API** : base URL, auth Bearer, tableau scopes ↔ endpoints, exemples curl.
- Candidat ADR : auth API tenant vs Clerk CMS, quotas, audit log.

---

## 🗂️ CMS

- **Pagination** de la liste de contenu (377+ items, ça va grossir).
- **Filtre par provider / source** (cms vs wikipedia) dans la liste CMS.
- (La recherche porte déjà sur tout le contenu — confirmé.)
- **Nommer les sections de feed de l'écran d'accueil.** Dans la config CMS de l'écran home, ce qu'on sélectionne dans les tables doit pouvoir recevoir un **nom d'affichage**. Vocabulaire à figer : **Home Feed** (accueil, plus traditionnel) vs **Discover Feed** (le feed discovery perso). S'appuie sur `feedSections` (cf. item « Ordre + affichage des sections » ci-dessous).

---

## ⚙️ Config tenant / personnalisation de l'app

- **Ordre + affichage des sections de feed configurables par tenant** (dans la config / preview tenant) : ordonner les « tables »/sections, les afficher ou non. S'appuie sur `feedSections` / `enabledModules` existants.
- **Couche méta « développeur » au-dessus du tenant** : des flags `is_enabled` par module (collections, agenda, …) contrôlés par **le développeur (nous)**, un cran **au-dessus** de la config du tenant. À distinguer du `enabledModules` du tenant. Nécessite une décision de design : **hiérarchie de config** développeur → tenant → membre. (Candidat ADR.)

---

## 🏠 Home Feed / Explore — recherche & convergence

- **Recherche dans le Home Feed (nécessaire).** Afficher une **barre de recherche** (ou au minimum un **bouton** de recherche) **au-dessus des tags de filtre** dans l'accueil. C'est un requis, pas un nice-to-have.
- **Convergence Explore ↔ Home Feed (UX à trancher).** Deux pistes : (a) au tap sur la barre de recherche du Home, **afficher le contenu de la page Explore** (Explore devient le mode recherche du Home) ; ou (b) **garder Explore comme page configurable à part**. Décider la bonne UX avant d'implémenter. Lié : « qu'est-ce qui est sélectionné dans le Home Feed » vient du CMS (cf. item CMS « Nommer les sections de feed »).

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
- **Catalogue global hiérarchique + UX recherche/nuage** → `docs/adr/0007-hierarchical-category-catalog.md` ; Slice J (backend) ✅ → Slice K (CMS Développeur) ✅ → Slice L (nuage hiérarchique mobile Réglages) ✅. Couche taxonomie/catalogue/picker complète.
- **Largeur de découverte** (tags réels, sérendipité, frontière, graphe) → `docs/adr/0005-discovery-breadth.md`.
- **Nuage d'onboarding** (le fan pioche dans la taxonomie → affinités) → réutilise le composant nuage des Réglages, à brancher dans un flux d'onboarding (pas encore tracé).
- **Politique recherche / fetch multi-providers** → ADR futur (noté dans ADR 0006).
