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
Axe éditorial visible servant à structurer l'architecture d'information publique du produit.
_Avoid_: Section when it means layout only

**Tag**:
Étiquette thématique transverse reliant des contenus apparentés au-delà des catégories et collections.
_Avoid_: Keyword, label

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
Utilisateur connecté et connu du produit.
_Avoid_: User, account holder

**Creator**:
Propriétaire ou principal éditeur d'un tenant.
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

**Notification**:
Message push ou in-app destiné à ramener un membre vers un contenu ou un état produit.
_Avoid_: Alert, ping

**Event**:
Moment éditorial planifié, live ou daté, comme un direct, une publication ou une rencontre.
_Avoid_: Calendar entry

**CommunityLink**:
Lien géré depuis le produit vers une surface communautaire externe telle que Discord, Telegram, WhatsApp ou une newsletter.
_Avoid_: Social link
