# MediumShip

Socle produit mobile white-label pour transformer une audience existante en média propriétaire premium. Le produit est pensé pour le prototypage rapide, la réutilisation de branding, la relation directe avec l'audience, et un modèle de contenu où la vidéo est une capacité cœur.

## Direction Produit

MediumShip est un cadre d'application média mobile-first pour médias indépendants, créateurs, podcasts, newsletters et communautés éditoriales engagées. Chaque client doit pouvoir publier, organiser un univers éditorial, activer une relation directe avec ses membres, et monétiser certains accès sans reconstruire le produit à chaque fois.

Le produit n'est pas centré exclusivement sur la vidéo. `Article`, `Episode` et `Video` sont des types de contenu de premier rang dans le modèle produit. La vidéo est indispensable pour la crédibilité marché, mais elle ne doit pas écraser la proposition de valeur multi-format éditoriale.

## Positionnement

- Pas un réseau social
- Pas un remplaçant de Discord
- Pas un clone générique de YouTube, Patreon ou Substack
- Pas une plateforme politique par défaut
- Conçu pour la distribution propriétaire, l'accès premium et la réutilisation white-label

## Règles White-Label

- Garder séparés le cœur produit et la configuration branding/fonctionnelle du client.
- Traiter contenu, contrôle d'accès et structure éditoriale comme des primitives réutilisables entre tenants.
- Préférer la configuration au branching lorsqu'on adapte l'application pour un nouveau client.
- Permettre à un tenant de changer l'apparence, les priorités de navigation et les modules activés sans modifier le modèle métier central.

## Fonctionnalités Cœur Du MVP

- App shell avec routing Expo et tokens de thème
- Authentification via Clerk
- Configuration tenant portée par Convex
- Feed d'accueil mêlant plusieurs types de contenus
- Parité de traitement entre articles, épisodes et vidéos dans le modèle éditorial
- Détail d'article
- Détail d'épisode avec lecture audio basique
- Détail vidéo avec support des vidéos d'origine YouTube et des vidéos hébergées
- Écran premium et états de contenu gated
- Écran profil
- Préparation des notifications push

## Contraintes Techniques

- Expo et React Native sont le socle mobile par défaut.
- TypeScript est le langage applicatif par défaut.
- Convex est le backend principal et la source de vérité des données produit.
- Clerk est le fournisseur d'authentification par défaut.
- RevenueCat et Stripe restent dans le périmètre des décisions de monétisation selon les besoins mobile et web.
- Cloudflare R2 est la première cible préférée pour le stockage média en upload direct si un composant Convex existant convient.
- La vidéo est obligatoire pour la direction produit au 3 juin 2026.
- L'application doit être pensée responsive dès le départ pour iPhone et iPad.
- L'internationalisation doit être construite progressivement avec des fichiers de traduction découpés par page ou par feature.

## Règles Convex

- Avant de proposer ou d'implémenter une feature backend, vérifier `docs/convex-components-descriptions.md`.
- Préférer un composant Convex existant à une implémentation custom lorsqu'il couvre proprement le besoin.
- Vérifier en priorité la liste maintenue pour l'intégration Clerk, le stockage, la vidéo, les paiements, les notifications, les workflows, le rate limiting, les API keys, les tenants, l'authz et la search.
- Pour la vidéo, évaluer les options Cloudflare R2, Mux et les composants de métadonnées YouTube avant de concevoir un flux d'ingestion ou d'hébergement sur mesure.

## Principes D'Architecture

- Optimiser pour la vitesse de prototype, pas pour la généralité maximale.
- Garder le modèle métier stable même si les mécanismes de diffusion évoluent.
- Séparer tôt la configuration tenant du comportement produit.
- Rendre les modules progressivement activables via feature flags.
- Éviter la complexité multi-tenant de niveau production tant que la validation commerciale n'exige pas plus.
- Favoriser les intégrations réversibles et les composants qui réduisent la surface backend spécifique.
- Préférer des patterns déjà validés dans les repos de référence quand ils correspondent au besoin.
- Donner priorité aux patterns validés dans la référence mobile la plus complète avant de puiser dans des repos secondaires.
- Le moteur de découverte adopte une architecture hexagonale (ports & adapters) **assumée** : chaque `Provider` est un adapter d'ingestion derrière un port stable, même tant qu'un seul adapter est branché. Ce seam est un choix d'architecture justifié par l'évolution multi-source prévue à court terme ; il ne doit pas être supprimé au motif qu'un seul provider existe à l'instant T. Voir `docs/adr/0003-content-discovery-engine.md`.

## Non-Objectifs

- Construire un graphe social complet
- Remplacer les outils de chat ou de communauté par une couche sociale native
- Livrer immédiatement une plateforme SaaS multi-tenant prête pour la production
- Construire un back-office éditorial complet dans le premier prototype
- Implémenter offline avancé, analytics avancés, search avancée ou recommandation avant que l'expérience cœur de contenu fonctionne

## Risques Et Questions Ouvertes

- Quel chemin de monétisation doit mener pour une distribution mobile-first : RevenueCat, Stripe, ou une séparation hybride selon la surface
- Le démarrage de la vidéo hébergée doit-il se faire avec du simple object storage ou avec une pipeline vidéo plus riche
- Jusqu'où pousser l'ingestion YouTube dans le premier prototype : synchronisation de métadonnées, embed, workflow d'import, ou miroir partiel
- Quel niveau de variabilité de navigation et de theming par tenant est nécessaire avant que le modèle ne devienne trop abstrait
- Quels composants Convex sont assez matures pour devenir des dépendances structurantes plutôt que de simples accélérateurs de prototype

## Langage

### Structure Produit

**Tenant**:
Instance applicative propre à un client, comprenant branding, configuration et identité visible côté audience.
_Avoid_: Workspace, site, project

**ThemeConfig**:
Ensemble de tokens visuels et de règles de marque appliqués à un tenant.
_Avoid_: Skin, palette only, CSS theme

**FeatureFlag**:
Interrupteur permettant d'activer ou désactiver une capacité produit pour un tenant sans changer le chemin cœur du code.
_Avoid_: Setting, boolean option

**Feature**:
Capacité produit activable et configurable pour un tenant (ex. articles, podcasts, vidéos, collections, agenda, téléchargements, notifications). Chaque `Feature` est décrite par le `FeatureCatalog` et reçoit une config par tenant `{ enabled, access }` : `enabled` est son `FeatureFlag`, `access` est son `AccessLevel`. Une `Feature` désactivée disparaît de la navigation de l'app.
_Avoid_: Module (sauf comme synonyme UI), Setting, Tab

**FeatureCatalog**:
Liste **statique, définie en code par l'`Operator`** (nous), des `Feature` disponibles, avec leurs métadonnées (clé, libellé, description, groupe) et leurs flags `core`/`locked` (non-désactivables ou à accès fixe). Source de vérité versionnée ; le tenant configure par-dessus, il ne l'invente pas.
_Avoid_: Settings registry, DB-driven feature list

**AccessLevel**:
Niveau d'accès d'une `Feature` activée, choisi par le `Creator` : `free` (invité, sans compte), `member` (compte requis, gratuit), `premium` (`Entitlement` payant). Appliqué côté app via le chemin `Entitlement` existant (`requireMember` / `isPro`), **pas** une nouvelle infra de paywall.
_Avoid_: Role, Plan, Tier (comme terme distinct)

### Modèle Éditorial

**Content**:
Concept parent partagé pour tout ce qui est publié éditorialement dans l'application.
_Avoid_: Post, asset, media item

**Article**:
Contenu éditorial principalement textuel, court ou long.
_Avoid_: Blog post, note

**Episode**:
Contenu éditorial principalement audio, généralement un podcast ou un segment parlé.
_Avoid_: Audio file, track

**Video**:
Contenu éditorial principalement vidéo, qu'il soit référencé depuis une plateforme externe ou hébergé directement.
_Avoid_: Clip, upload

**Collection**:
Regroupement éditorial organisant des contenus en série ou en package cohérent.
_Avoid_: Playlist, folder

**Category**:
Axe éditorial **géré par le `Tenant`** : une taxonomie qu'il possède (liste par défaut au setup, extensible), assignée à son contenu, et source de vérité unique pour l'architecture d'information publique (Explore), l'amorçage de la découverte, et la personnalisation du `Member`. Peut contenir des catégories qui n'ont pas encore de contenu. À distinguer d'une simple catégorie dérivée du contenu existant.
_Avoid_: Section (when layout only), catégorie dérivée du contenu, Tag

**Tag**:
Étiquette thématique transverse reliant des contenus apparentés au-delà des catégories et collections.
_Avoid_: Keyword, label

**Entity**:
Personne, organisation ou mouvement qui apparaît dans des contenus éditoriaux comme sujet, auteur, source ou participant. Dimension de scoring dans le moteur de découverte.
_Avoid_: Actor, Subject, Person

**Feed**:
Flux principal ordonné de contenus publiés présenté à un membre.
_Avoid_: Timeline, wall

### Modèle Vidéo

**YouTubeVideo**:
Enregistrement vidéo dont la source principale est YouTube et dont les métadonnées peuvent être enrichies localement.
_Avoid_: Embed only, link

**HostedVideo**:
Enregistrement vidéo dont le cycle de vie principal est géré par le produit via upload direct et stockage.
_Avoid_: Asset only, blob

**PlaybackAsset**:
Représentation technique d'une source média lisible pour l'audio ou la vidéo.
_Avoid_: File, URL

**PipHost**:
Surface technique qui maintient la lecture d'une `HostedVideo` en Picture-in-Picture à travers la navigation, et décide, sur arrêt du PiP, s'il faut revenir au player. Possède la règle restore/close (un arrêt utilisateur ramène au player ; un arrêt programmatique est ignoré).
_Avoid_: Floating player, mini video, overlay

### Accès Et Monétisation

**PremiumContent**:
Contenu nécessitant un entitlement payant ou un état d'accès spécifique.
_Avoid_: Locked post, VIP content

**Paywall**:
Frontière qui explique, applique ou vend un accès restreint.
_Avoid_: Subscription screen only

**Entitlement**:
Droit d'accès concret accordé par abonnement, achat ou statut de membre.
_Avoid_: Plan, role

**Subscriber**:
Membre disposant d'une relation d'accès récurrente active.
_Avoid_: Customer, payer

**Supporter**:
Membre qui contribue financièrement sans détenir nécessairement un accès premium récurrent.
_Avoid_: Donor when the product meaning is broader

### Personnes Et Usage

**Member**:
Utilisateur connecté et connu du produit — l'individu côté audience (le « fan ») qui consomme et personnalise son feed, par opposition au `Creator`/`Tenant` (notre client, qui possède le tenant et sa taxonomie de `Category`).
_Avoid_: User, account holder, Fan (comme terme distinct)

**Operator**:
Nous, l'éditeur du produit MediumShip, **un cran au-dessus du `Creator`**. Possède le `FeatureCatalog` et, à terme, l'autorisation des `Feature` par tenant (la licence/package). Définit ce que le `Creator` a le droit d'activer ; le `Creator` configure dans ces limites. Hiérarchie de config : `Operator` → `Creator`/`Tenant` → `Member`.
_Avoid_: Super-admin (sauf UI), God user

**Creator**:
Propriétaire ou principal éditeur d'un tenant. Configure, **dans les limites posées par l'`Operator`**, quelles `Feature` activer et leur `AccessLevel`.
_Avoid_: Admin when the role is editorial

**Editor**:
Collaborateur qui gère, curationne ou publie du contenu pour un tenant.
_Avoid_: Moderator

**Bookmark**:
Référence de contenu sauvegardée par un membre pour y revenir plus tard.
_Avoid_: Favorite

**PlaybackProgress**:
Trace spécifique à un membre de la progression de consommation d'un contenu audio ou vidéo.
_Avoid_: Watch state, listen checkpoint

**Resume**:
Le contenu reprenable le plus frais d'un membre — un seul item, dérivé du `PlaybackProgress` le plus récent non terminé — proposé pour replonger directement à la position sauvegardée. Concerne le média à position temporelle (épisode, vidéo).
_Avoid_: Continue watching, reprise (générique)

**ReadingHistory**:
Journal chronologique des `Content` qu'un membre a consultés, dérivé des signaux d'ouverture de l'`Engagement` (un par contenu, le plus récent gagne), exposé pour y revenir. L'effacement est un repère de lecture (le membre masque son historique) et ne détruit pas le signal d'`Affinity` sous-jacent.
_Avoid_: Activity log, vues récentes, watch history

**Notification**:
Message push ou in-app destiné à ramener un membre vers un contenu ou un état produit.
_Avoid_: Alert, ping

**Event**:
Moment éditorial planifié, live ou daté, comme un direct, une publication ou une rencontre.
_Avoid_: Calendar entry

**CommunityLink**:
Lien géré depuis le produit vers une surface communautaire externe telle que Discord, Telegram, WhatsApp ou une newsletter.
_Avoid_: Social link

### Moteur De Découverte

**Provider**:
Adapter d'ingestion qui récupère des contenus depuis une source (CMS interne, Wikipedia, RSS, YouTube, upload) et les normalise en `Content`. Premier port de l'architecture hexagonale du moteur de découverte : remplaçable et isolé derrière une interface stable.
_Avoid_: Connector, fetcher, integration

**Affinity**:
Score pondéré qu'un `Member` accumule pour une dimension de contenu (`Category`, `Tag`, ou type de `Content`) à partir de ses interactions. Dimension d'entrée du classement du feed de découverte. La table technique qui la stocke est `userPreferences`.
_Avoid_: Preference weight, like count, rating

**ScoringKey**:
Identité normalisée d'une dimension d'`Affinity` (catégorie ou tag) partagée par l'écriture de `Content`, l'écriture d'`Affinity` et le scoring du feed, pour qu'une même dimension ne se fragmente pas sur des variantes de casse ou d'accent.
_Avoid_: Slug, raw label, key

**ScoringPolicy**:
Cœur de domaine du moteur de découverte : module pur qui possède les poids d'interaction, les facteurs par dimension, les boosts (fraîcheur, archive, déjà-vu) et la répartition du feed. Sans dépendance à la base : son interface est sa surface de test.
_Avoid_: Algorithm, ranker, recommender service

**ContentVisibility**:
Règle d'accès unique — masquer un `PremiumContent` quand le module `premium` est inactif — appliquée à l'identique par le `Feed` éditorial et par le feed de découverte.
_Avoid_: Filter, access check

**Engagement**:
Mesure normalisée de la consommation d'un `Content` par un `Member`, calculée selon le type de contenu (lecture d'un `Article`, écoute d'un `Episode`, visionnage d'une `Video`, parcours d'un contenu wiki). Exprimée en signaux discrets — ouvert / partiel / terminé, une fois par contenu, jamais en cumul brut — qui nourrissent l'`Affinity` via la `ScoringPolicy`. Pour l'audio et la vidéo, dérive de `PlaybackProgress`.
_Avoid_: Dwell time, watch time, view count

**FetchDemand**:
Demande d'ingestion au niveau d'un `Tenant`, dérivée de l'agrégation des `Affinity` de son audience (plus un quota de diversité et un seed de bootstrap configuré au tenant), qui oriente ce qu'un `Provider` va chercher. Consommée par une ingestion planifiée — jamais déclenchée en direct par le geste d'un `Member`. C'est l'effet de groupe (tendance) sans couplage per-utilisateur.
_Avoid_: Recommendation, per-user fetch, trending
