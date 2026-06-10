# Discovery / Product — Backlog (parking lot)

Idées soulevées mais non encore planifiées en slice. Rangées par **priorité** : la **Vague en cours** (haut) est ce qu'on attaque maintenant — **CMS config + Mobile UI**. Tout le reste est parqué dessous (« Plus tard »), à prioriser plus tard. État baseline : slices A→M mergées dans `dev` (seam provider durci et prouvé).

---

## 🎯 Vague en cours — Config tenant & Mobile UI

> Focus actuel : **refonte/professionnalisation du shell CMS**, la config de l'app côté CMS (sections de feed, modules) **et** le polish UI mobile (Bibliothèque, cartes, recherche Home). Pas de clés API pour l'instant (parqué plus bas).

### 🖥️ CMS — refonte shell & professionnalisation (prioritaire)

> Repenser **toute la couche autour du CMS**, pas juste un onglet. Source de vérité visuelle : maquettes `docs/podapp/project/cms/`.

- **Réorganiser les onglets dans un ordre logique.** Mettre en tête le travail quotidien (Contenus, Catégories, Collections, Agenda) ; pousser plus loin la config « identité / créateur » — l'onglet **Tenant** (nom, identité de l'app, couleurs) arrive **après**, comme config avancée. **Candidat : retirer l'onglet Preview.**
- **Cohérence visuelle / « plus carré ».** Réduire le **border-radius** partout (trop arrondi aujourd'hui) pour un rendu plus carré et homogène avec le reste de l'app. Professionnaliser le shell (topbar, nav, états vides, espacements).
- **Nettoyer les résidus.** Sur la page **non connecté / landing**, du **langage domaine** fuit dans la barre de navigation / les tab bars — à retirer. Plus généralement, enlever les restes d'échafaudage.
- **Auth / accès à l'arrivée** : clarifier les états non-connecté / connecté non-admin / admin / bootstrap premier admin (gating confus aujourd'hui). *(Sign-out Clerk déjà restauré via `<UserButton>`.)*
- **Onboarding première arrivée CMS** : flux de premier lancement propre (claim du premier admin, repère visuel d'état).
- **Landing page CMS (non connecté)** : à faire d'après la maquette.
- **Rôles CMS — admin + manager.** Depuis le CMS (onglet Modules / « Nos modules » ou écran dédié), pouvoir **promouvoir d'autres comptes Clerk connectés** en **admin** ou **manager** (nouveau rôle, distinct d'admin). Les **scopes** de chaque rôle restent à définir (admin vs manager) — trancher avant implémentation. Croise ADR 0008 / auth CMS.
- **Onglet Modules — table Membres : reprendre le display du 1er module.** S'inspirer du rendu **table** du premier module tenant (plus propre que la table Membres actuelle — nommage « table » à clarifier) et appliquer ce layout à la liste des membres dans l'onglet Modules.

### 🧭 Navigation composable (tables) — gros morceau, distinct des sections de feed

> **Constat terrain (test Slice N) :** deux concepts étaient confondus. À séparer nettement.
> - **Tables / onglets de navigation** (Home, Découverte, Explore, Agenda, Communauté, Bibliothèque…) → ce que le tenant veut **ajouter / retirer / réordonner**, et **désactiver une feature doit retirer son onglet**.
> - **Sections du Home Feed** (article/épisode/vidéo *dans* le Home, avec titres + ordre) → déjà géré par l'onglet Modules (Slice N).

- **La nav mobile n'est PAS composable aujourd'hui.** `app/(app)/_layout.tsx` a un set d'onglets **en dur** (home, discover, explore, library, profile) ; seul `discover` est conditionné par `featureConfigs.discover.enabled`. Cible : la barre d'onglets est **dérivée de la config** (features activées + ordre), et désactiver une feature **retire son onglet**.
- **Réordonner / afficher-masquer les tables** depuis le CMS (onglet Modules), au-delà des seules sections de contenu. S'appuie sur `featureConfigs` (Slice N) + un ordre de navigation.
- **Groupes du `FeatureCatalog` à rendre cohérents.** Aujourd'hui le regroupement est bancal (« Navigation » contient Agenda/communauté/collection). Regrouper par sens (navigation vs contenu vs bibliothèque vs social…).
- **Nommer les sections de feed de l'écran d'accueil** (titres éditables depuis Modules — **déjà possible** mais peu évident ; vocabulaire **Home Feed** vs **Discover Feed**). Clarifier l'UX d'édition (et la sauvegarde — cf. toasts).
- **Icône de module configurable** : déjà livré côté config (Slice N) ; reste à brancher proprement dans la grille mobile (cf. polish modules).

### 🔔 Feedback — toasts CMS + haptics mobile

> **Découplé en deux slices** (décidé avec le user) : haptique mobile et toasts CMS séparés.

- **Retour haptique mobile (app-wide)** → **✅ Fait** (mergé `dev` `f4c063d`) : `HapticsService` (`src/features/haptics/haptics.ts`, no-op web) + câblage des primitives (tab bar, chips, SearchBar, favoris, actions, paywall, agenda/community/collections/category). Plan : `docs/superpowers/plans/2026-06-09-mobile-slice-haptics-app-wide.md`. Suivi : réglage utilisateur on/off.
- **Toasts de confirmation dans le CMS** *(slice CMS séparé — PAS FAIT)*. Aujourd'hui « Enregistrer » ne donne **aucun retour** → on ne sait pas si ça a marché (source de confusion réelle pendant le test Slice N : modifs perdues car non sauvées). Ajouter un système de toasts (succès/erreur) déclenché sur les mutations CMS (sauvegarde tenant/modules/contenu…).

### 🏠 Home Feed / Explore — recherche & convergence

> **Livré** (slice recherche, mergé `dev`/`main` + Convex déployé) : composant `<SearchBar>` réutilisable (éditable + bouton lecture-seule) ; **entrée recherche en haut du feed Home** → route vers Explore ; **recherche élargie à tout le contenu** (CMS + découverte Wikipedia/YouTube/RSS, plus seulement éditorial) ; **tendances réelles** (`getTrendingTopics` = tags les plus fréquents, fallback i18n statique si vide).

- ~~**Recherche dans le Home Feed.**~~ ✅ Entrée bouton au-dessus des filtres, tap → Explore.
- **Explore : affichable ou pas + où/comment.** La page **Explore doit être une table togglable** (afficher/masquer) comme les autres, et il faut décider **où et comment** elle s'affiche. Dépend de « Navigation composable » + de la décision UX ci-dessous.
- **Convergence Explore ↔ Home Feed (UX à trancher).** Deux pistes : (a) au tap sur la barre de recherche du Home, **afficher le contenu de la page Explore** (Explore devient le mode recherche du Home) — *piste amorcée : l'entrée Home route déjà vers Explore* ; ou (b) **garder Explore comme page configurable à part**. Trancher la bonne UX (+ auto-focus de la recherche à l'arrivée).
- **Polish écran Explore (PAS FAIT — prévu, oublié au 1er passage).** Top-bar avec deux **côtés vides** (vestige de la loupe retirée) à nettoyer/rééquilibrer ; revoir hiérarchie de la page ; cf. **vitalité des cartes** ci-dessous.

### 📱 Mobile — Bibliothèque & UI

Retours terrain après usage réel (favoris enregistrés, navigation Bibliothèque).

> **Livré (branche `feat/mobile-library-favoris-polish`, à vérifier)** : rename Favoris, retrait badge Gratuit, listes complètes favoris/téléchargements, retrait loupe, summary cartes À découvrir. Reste ci-dessous : layout grille modules, profil invité, deep links profil, historique/progression.

**Profil invité — gate cohérent avec Bibliothèque**
- **Invité sur Profil : même écran que Bibliothèque (connect d'abord).** Aujourd'hui Bibliothèque affiche correctement « connecte-toi » ; Profil pousse directement vers premium. Or premium **implique** d'être connecté → afficher le **même gate invité que Bibliothèque** (sign-in / continuer en invité) avant toute surface premium.

**Profil — section « Ma bibliothèque » (deep links)**
- **Rows Profil → pages ciblées, pas la Bibliothèque générique.** La section dupliquée avec la page Bibliothèque peut rester, mais chaque row doit router directement : **Favoris** → page Favoris, **Téléchargements** → page Téléchargements, etc. Aujourd'hui tout mène vers `/library`.

**Historique & progression** *(issue à part — pas juste polish)*
> **UI livrée (branche `feat/mobile-card-vitality`, à merger)** : la **page Historique** et le **composant progression** existent maintenant — mais **ni l'un ni l'autre n'est câblé** (pas de modèle backend ; « Reprendre la lecture » toujours en dur).
- **CRUD / modèle backend** pour l'historique de lecture et la progression (aujourd'hui absent ou stub) — **prérequis** pour câbler l'UI livrée.
- **Re-câbler « Reprendre la lecture » + page Historique** sur les vraies données une fois le modèle en place.
- **Chips / mini-cartes Profil** (Hors-ligne, Historique, stats) : aligner sur les compteurs réels ; aujourd'hui Favoris semble OK, **Hors-ligne et Historique ne reflètent pas la réalité** (cf. bugs ci-dessous).

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

**Polish visuel — vitalité des cartes (app-wide)** → **📋 Planifié** : `docs/superpowers/plans/2026-06-09-mobile-slice-card-vitality-explore-polish.md`
- **Les cartes se ressemblent trop / sont trop plates.** Rendu actuel « cartes blanches sur fond info », peu de distinction entre types → ça ne ressort pas assez, ça manque de vie. Donner plus de **hiérarchie, profondeur et accent**, et **différencier les types** (article / épisode / vidéo / catégorie / module) : accents de couleur par type, élévation/contraste, traitement éditorial. Cibles : cartes **Explore** (catégories + modules), cartes **« À découvrir »**, **feed rows / hero**. Source de vérité : maquettes `docs/podapp/project/mobile-mockups/`. (Inclut le layout grille modules ci-dessus.)

**Cartes « À découvrir »**
- **Summary plus long quand présent** : passer de 2 lignes max à ~4 lignes de summary sur les cartes « À découvrir », pour un aperçu plus riche quand le contenu en a un.

**Retour haptique (app-wide)** → déplacé dans « 🔔 Feedback — toasts CMS + haptics mobile ».

---

## 🐞 Bugs

- **[Profil] Stats / encart Hors-ligne incohérents.** Les chips Profil (ex. compteur Hors-ligne) et l'encart « Aucune étagère offline pour l'instant » ne reflètent pas les téléchargements réels — alors que **Tous mes téléchargements** liste bien du contenu. Les stats Profil restent à 0 / vide. Aligner compteurs, encart preview et liste complète sur la même source de vérité offline.
- **[CMS] Aperçu mobile cassé dans l'onglet Tenant.** La preview `mfeed` (`apps/cms/components/cms/tenant-settings-form.tsx:111`) est restée alors que la config feed/modules a migré vers l'onglet Modules (Slice N) → elle référence des données parties. Fix : retirer la preview de l'onglet Tenant (ou la déplacer/reconstruire dans l'onglet Modules). À traiter avec la « Navigation composable ».
- ~~**[CMS] Déconnexion cassée.**~~ **✅ Corrigé** : le bloc user en haut à droite affichait un avatar custom sans sign-out ; restauré via `<UserButton afterSignOutUrl="/">` de Clerk dans `admin-shell.tsx` (et `getViewerInitial` mort supprimé).
- **Article Wikipedia — flicker de l'extrait au chargement.** À l'ouverture d'un article, l'extrait s'affiche d'abord en gras seul, puis le contenu complet prend le relais — léger flicker visuel. Hypothèse : l'extrait sert de placeholder pendant le fetch du corps. Piste : afficher l'extrait en style light (pas bold) tant que le contenu n'est pas chargé, pour une transition plus seamless.

> CMS auth / onboarding / landing → repris dans **« 🖥️ CMS — refonte shell & professionnalisation »** (Vague en cours).

---

## 🔭 Plus tard (parqué)

### 💰 Démo & monétisation white-label (stratégie — à trancher)

> Cette app est à la fois **notre démo** (vitrine, candidate à publication store) **et** la **référence de politique** du produit white-label. Décisions de modèle à prendre avant publication.

- **Monétisation démo vs feature `premium` white-label.** Comment l'app démo se monétise (le cas échéant) et comment ça se conjugue avec le `premium` par-tenant du white-label (entitlements). Aujourd'hui `premium` passe par défaut (« premium gratuit », paiement non câblé — cf. couche Operator). Trancher : démo gratuite/vitrine, ou premium en conditions réelles ?
- **Publication store (App Store / Play) de la démo** : prévu (EAS déjà configuré). La **gestion de la publication depuis le CMS** n'est sans doute pas faisable pour la 1ʳᵉ soumission — à revoir plus tard.
- **Richesse de contenu pour une démo crédible** : dépend des providers d'ingestion (podcasts/blogs ci-dessous) — une démo avec articles + vidéos + podcasts est plus convaincante.
- **Croise** : couche Operator / câblage paiement (entitlements), providers d'ingestion.

### 📺 Providers

- **Provider YouTube (chaîne du tenant)** → **✅ Fait** (Slice N, mergé `dev`) : adapter `videos.list` (tags par vidéo), whitelist gérable depuis le CMS, isolation source, filtres shorts/embeddable + nom de chaîne.
- **Provider Podcasts (RSS audio) — PAS FAIT.** Ingérer des **podcasts** via flux RSS audio → `kind: "episode"` (`audioUrl` + durée). **Débloque le filtre/recherche « Podcasts » aujourd'hui vide** (aucun épisode en base — les providers actuels ne produisent que `article`/`video`). Se branche sur le seam provider prouvé (comme `rss`).
- **Provider Blogs (RSS/Atom) — PAS FAIT.** Élargir l'ingestion aux **blogs** (flux RSS/Atom d'articles), sources éditoriales curatées par tenant, au-delà du `rss` générique.
- **Langue des articles Wikipedia alignée sur la langue app (membre).** La locale Wikipédia est aujourd'hui une config **tenant** (CMS, `providerConfigs.wikipedia.locale`). Reste à voir si on l'aligne aussi sur la sélection de langue **membre** (`language-item` / `useSelectedLanguage`) pour le fetch perso. Candidat onboarding plus tard. Hors scope immédiat.

### 🎯 Richesse du feed / scoring

- **imageBoost** (inspiré du README de Xikipedia : valeurs par défaut par post). Bonifier le score d'un `Content` qui a une `heroImageUrl`, pour que le feed remonte plus d'articles illustrés (~70 % des articles Wikipedia ingérés n'ont pas d'image aujourd'hui). Petit tweak dans la `ScoringPolicy`. Candidat à une passe « tuning du scoring ».

### 🗂️ CMS — infra

- **Pagination** de la liste de contenu (1500+ items aujourd'hui, ça grossit).
- **Filtre par provider / source** (`cms` / `wikipedia` / `rss`) dans la liste CMS. (La recherche porte déjà sur tout le contenu — confirmé.)
- **Backfill `source` des vieux contenus** : ~16 contenus historiques ont `source` absent (`undefined`). Les passer à `source: "cms"` pour que le futur filtre par source soit propre.

### 🧱 Couche Operator (au-dessus du tenant) — modèle tranché (ADR 0008)

> Le **modèle d'accès** est désormais **décidé** (`docs/adr/0008-feature-catalog-and-access-model.md`) et **en cours d'implémentation dans Slice N élargi** : `FeatureCatalog` en code (flags `core`/`lockAccess`) → config tenant `{ enabled, access }` par feature → application mobile via les **entitlements existants** (`member`/`premium`/`free`). Ne restent parqués que les morceaux ci-dessous.

- **Câblage paiement** : brancher un provider (RevenueCat/Stripe) qui écrit la table `entitlements` → `premium` devient réellement payant. Tant que non fait, `premium` passe par défaut (« premium gratuit »). Le chemin de lecture ne change pas (règle entitlements stable).
- **Écran Operator — autorisation des features par tenant.** L'axe « quelles features ce tenant a le **droit** d'activer » (la licence/**package vendable** par tenant), au-delà des flags `core`/`lockAccess` en code. Un écran super-admin où **nous** cochons par tenant. Hiérarchie Operator → Creator → Member (déjà actée ADR 0008).
- **Notifications-as-a-package** : feature optionnelle facturable (candidat évident une fois le paiement câblé).
- **Onglet Développeur accessible aussi aux clients (tenants)** + **rôle « développeur »** assignable, pour ses **connexions API / clés API** — modèle **Be Viral / Mobile de Soi**. Croise la section parquée « API publique tenant — clés API ».

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
