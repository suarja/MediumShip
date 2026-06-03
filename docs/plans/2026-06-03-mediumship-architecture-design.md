# MediumShip Architecture Design

## Goal

Définir l'architecture globale de MediumShip après la phase fondation
(`Clerk`, `Convex`, thème, i18n) afin d'organiser les prochaines phases
produit, le futur CMS web, la résilience mobile et les trois premiers jalons
d'ingénierie.

## Product Direction

- MediumShip est une application média mobile-first white-label.
- Le produit doit fonctionner en lecture publique sans authentification.
- `Article`, `Episode` et `Video` sont des primitives éditoriales de premier rang.
- La configuration white-label doit rester bornée par schéma ; la logique
  produit reste dans le code.

## Core Decisions

### 1. App model

- L'application mobile devient `guest-first`, pas `auth-first`.
- La lecture publique ne dépend pas de `Clerk`.
- `Clerk` ne sert qu'aux capacités membre :
  - premium
  - téléchargements offline
  - bookmarks
  - progression sync
  - préférences persistées
  - notifications

### 2. Backend model

- Un seul backend `Convex` est partagé entre mobile et CMS.
- La séparation se fait par domaines backend, pas par backends distincts.
- Les modules backend doivent être organisés autour des domaines suivants :
  - `content/`
  - `video/`
  - `tenant/`
  - `feed/`
  - `authz/`
  - `media/`
  - `premium/`
  - `users/`

### 3. CMS model

- Le premier CMS est :
  - web
  - mono-tenant
  - interne
  - structuré, pas block-builder
- Le socle recommandé est `Next.js`, en reprenant les conventions utiles de
  `../editia/web` pour :
  - structure app web
  - Clerk web
  - tokens de thème
  - conventions i18n
  - surfaces settings/admin

### 4. Config model

- Le tenant expose une configuration bornée par schéma :
  - `ThemeConfig`
  - `NavigationConfig`
  - `FeedSectionConfig`
  - `EnabledModules`
  - `FeatureFlags`
- Le modèle de configuration doit distinguer :
  - modules produit grossiers
  - feature flags ciblés

### 5. Content model

- Le domaine éditorial garde un tronc commun `Content`.
- `Article`, `Episode` et `Video` restent des variantes métier distinctes.
- Le workflow de publication initial est :
  - `draft`
  - `published`
  - `archived`
- Le contenu éditorial reste mono-langue au départ ; seule l'interface est
  multilingue.

### 6. Video model

- `Video` supporte deux chemins :
  - `YouTubeVideo`
  - `HostedVideo`
- Le premier produit doit supporter les deux.
- Le téléchargement offline ne s'applique pas à `YouTubeVideo`.
- Le mode offline premium couvre :
  - `Article`
  - `Episode`
  - `HostedVideo`

## Repo Direction

### Target shape

- `apps/mobile`
- `apps/cms`
- `packages/domain`
- `packages/config`
- `convex/`

### Practical transition

Le repo actuel héberge encore l'app Expo à la racine. Pour éviter du churn
gratuit avant que le CMS existe, la migration physique vers `apps/mobile`
peut être différée jusqu'au démarrage du jalon CMS, tant que :

- le domaine reste partagé
- les chemins backend restent stables
- les nouveaux modules frontend restent organisés comme s'ils vivaient déjà
  dans une app mobile dédiée

## Detailed Data Model

### Content

Champs communs recommandés :

- `slug`
- `kind`
- `status`
- `title`
- `summary`
- `category`
- `tags`
- `coverAsset`
- `publishedAt`
- `isPremium`
- `tenantSlug`

Champs spécifiques :

- `Article`
  - `bodyRichText`
  - `readingTimeMinutes`
- `Episode`
  - `audioAsset`
  - `durationSeconds`
  - `chapters`
- `Video`
  - `videoSource`
  - `durationSeconds`
  - `posterAsset`

### VideoSource

- `videoSource.kind = "youtube" | "hosted"`
- `YouTubeVideo`
  - `youtubeVideoId`
  - `youtubeUrl`
  - `embedUrl`
  - `thumbnailUrl`
- `HostedVideo`
  - `uploadKey`
  - `posterAsset`
  - `playbackAsset`
  - `transcodingStatus`

### Product configuration

- `Tenant`
- `ThemeConfig`
- `NavigationConfig`
- `FeedSectionConfig`
- `FeatureFlag`

### Member access

- `CmsRole`
- `Bookmark`
- `PlaybackProgress`
- `OfflineDownload`
- `Entitlement`

## Resilience Strategy

### Network awareness

L'app mobile doit devenir `network-aware` avec des états explicites :

- `online`
- `offline`
- `authDegraded`
- `backendDegraded`

### Failure handling

- Si `Clerk` tombe, l'application doit continuer en mode invité.
- Si `Convex` est dégradé, l'application doit rester lisible grâce au cache
  local et aux téléchargements premium déjà acquis.
- Le projet ne met pas en place de failover multi-backend actif au premier
  niveau d'architecture.

### Status channel

- Les messages d'incident et bannières d'état doivent venir d'un canal externe
  indépendant de `Convex` et de `Clerk`.
- Ce canal peut être un JSON statique avec :
  - sévérité
  - message
  - lien de support
  - éventuel call to action

## Three Engineering Milestones

### Milestone 1: Public read model

Objectif :

- livrer une application mobile consultable sans compte
- brancher le premier vrai feed éditorial
- établir la séparation lecture publique / capacités membre

Scope :

- mobile `guest-first`
- feed multi-format
- détail `Article`
- détail `Episode`
- détail `YouTubeVideo`
- config feed/theme/modules lue côté backend
- premiers états réseau et dégradation

### Milestone 2: Operable CMS

Objectif :

- rendre le produit opérable sans modifier le code

Scope :

- `apps/cms`
- auth admin `Clerk` + authz `Convex`
- CRUD éditorial
- configuration thème/navigation/feed/modules/flags
- preview simple
- publication `draft/published/archived`

### Milestone 3: Premium, hosted video, offline

Objectif :

- rendre le produit monétisable, plus robuste et crédible côté média premium

Scope :

- `HostedVideo`
- upload + lecture
- gating premium
- bookmarks
- progression sync
- téléchargements offline premium
- bannière incident externe
- mode dégradé propre

## Implementation Guidance

- Traiter les milestones comme trois plans d'exécution séparés.
- Ne pas mélanger CMS, public read model et offline premium dans un seul plan.
- Commencer par le jalon 1, qui crée la première boucle produit lisible.
- Reporter la migration physique en monorepo complet jusqu'au démarrage du CMS
  si cela évite du churn inutile.
