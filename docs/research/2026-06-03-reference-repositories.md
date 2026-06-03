# Repositories De Référence

Cette note fixe les repositories à consulter quand il y a un doute d'implémentation sur MediumShip, en particulier pour le mobile Expo/React Native, Clerk, Convex, i18n, design system et responsive.

## Références prioritaires

### `../editia/mobile` — référence mobile primaire

Disponible localement dans ce workspace. C'est désormais la référence mobile prioritaire pour MediumShip.

À réutiliser ou adapter en priorité pour :

- patterns UI déjà utilisés en production
- auth Clerk côté mobile
- intégration Convex côté Expo
- structure de design system mobile et tokens de thème
- responsive iPhone/iPad via `useResponsiveSpacing()`
- hooks et composants éprouvés
- organisation pratique d'une app mobile Expo réelle

Points concrets observés :

- `app/_layout.tsx` câble `ClerkProvider` + `ConvexProviderWithClerk`
- polyfill `navigator.onLine` avant Clerk
- `lib/theme/` centralise le thème applicatif réutilisable
- `lib/hooks/useResponsiveSpacing.ts` fournit la règle responsive téléphone / tablette
- la doc locale insiste explicitement sur `useResponsiveSpacing()` comme règle absolue
- le repo contient une base de composants et de hooks riche, avec auth, paywall, onboarding, vidéo et coach

Nuance importante :

- la structure i18n actuelle de ce repo ne doit pas être copiée aveuglément si elle mène à des fichiers trop gros
- pour MediumShip, on garde comme objectif un découpage des traductions par page ou feature, même si le repo source est moins strict sur ce point

### `../editia/web` — référence web complémentaire prioritaire

Disponible localement dans ce workspace. C'est la seconde base à consulter quand un sujet mobile gagne à reprendre un pattern déjà éprouvé côté produit, i18n ou theming.

À réutiliser ou adapter en priorité pour :

- conventions i18n déjà testées en production
- organisation de messages multilingues et garde-fous de parité
- design tokens web et nomenclature de thème réutilisable
- surfaces produit et vocabulaire déjà stabilisés

Points concrets observés :

- `messages/{fr,en,es,de,pt}.json` centralise les catalogues par locale
- `__tests__/i18n-parity.test.ts` protège la parité entre locales
- `i18n/routing.ts` et `i18n/request.ts` cadrent les locales
- `lib/design-tokens.ts` centralise les tokens visuels côté web

Nuance importante :

- ne pas recopier la structure web telle quelle dans Expo
- reprendre surtout la discipline de nommage, la couverture i18n, les garde-fous et les tokens utiles, puis les adapter au contexte mobile

### `../Ideo/IdeoMobile` — référence mobile secondaire

Disponible localement dans ce workspace. C'est une référence secondaire utile, surtout pour certains patterns Expo + Convex + Clerk très documentés.

À réutiliser ou adapter en priorité pour :

- câblage Clerk + Convex dans Expo
- validation d'environnement avec Zod
- SecureStore pour le token cache
- conventions i18n avec `expo-localization`, `i18next`, `react-i18next`
- architecture modulaire côté mobile
- patterns UI et composants inspirants

Points concrets observés :

- `src/app/_layout.tsx` utilise `ConvexProviderWithClerk` avec un wrapper `useAuth()` stabilisé
- `src/lib/polyfills.ts` corrige le problème `navigator.onLine` utilisé par Clerk en React Native
- `docs/architecture/auth.md` documente les pièges critiques Clerk + Convex
- `env.ts` centralise la validation des variables d'environnement
- la base i18n repose sur `expo-localization`, `i18next` et `react-i18next`

### `suarja/editia-waitlist`

Référence secondaire pour le web et les patterns Convex quand le dépôt est accessible. À utiliser surtout pour comparer :

- structure d'un projet web branché sur Convex
- patterns de pages marketing / waitlist
- découpage frontend/backend léger

### `suarja/ai-edit`

Référence secondaire pour l'architecture web/produit quand le dépôt est accessible. À consulter si un doute apparaît sur :

- patterns UI côté web
- organisation produit
- composants ou flows déjà résolus dans un contexte proche

## Règles d'usage

- Ne pas copier aveuglément. Reprendre les patterns éprouvés, pas la dette locale d'un autre projet.
- Quand une solution fiable existe dans `../editia/mobile`, partir de cette base avant de réinventer.
- Quand un sujet touche i18n, design system ou theming, regarder ensuite `../editia/web` pour reprendre le vocabulaire, les tokens et les garde-fous déjà éprouvés.
- Quand une décision touche Clerk + Convex, relire d'abord les patterns de `../editia/mobile`, puis compléter avec `../Ideo/IdeoMobile` si besoin.
- Quand une décision touche i18n, ne pas reproduire un unique gros fichier de traduction. MediumShip doit utiliser un découpage par page ou par feature.
- Quand une décision touche le layout, vérifier qu'elle fonctionne dès le départ sur iPhone et iPad.
- Toujours adapter et améliorer l'existant quand nécessaire, mais ne pas repartir de zéro sans raison.

## Conventions spécifiques à MediumShip

### Auth mobile

Pour MediumShip, la baseline recommandée est :

- `ClerkProvider`
- `ConvexProviderWithClerk`
- token cache via `expo-secure-store`
- polyfill `navigator.onLine` avant l'import Clerk
- pattern `'skip'` pour les queries auth-dépendantes

### Traductions

MediumShip ne doit pas stocker toutes les traductions dans un seul fichier par langue.

Structure recommandée :

```text
src/i18n/
  en/
    common.json
    home.json
    article.json
    episode.json
    video.json
    profile.json
  fr/
    common.json
    home.json
    article.json
    episode.json
    video.json
    profile.json
```

Si une page grossit trop, la découper encore par sous-feature.

Approche recommandée :

- reprendre la base technique `i18next` / `react-i18next` déjà cohérente avec les références mobiles
- reprendre la discipline de parité d'`../editia/web` via un test dédié
- garder des namespaces petits et lisibles, proches des écrans ou features

### Design system

Pour MediumShip, la baseline recommandée est :

- partir du thème applicatif et des composants existants dans `../editia/mobile`
- reprendre la nomenclature de tokens et les garde-fous depuis `../editia/web/lib/design-tokens.ts` quand elle aide à clarifier le modèle
- encapsuler couleurs, typographies, rayons et spacing dans une `ThemeConfig` par tenant
- préférer plusieurs presets configurables à des styles codés en dur écran par écran

### Responsive

Le mobile foundation doit intégrer un hook dédié du type `useResponsive` ou équivalent, piloté par `useWindowDimensions`, avec au minimum :

- distinction téléphone / tablette
- spacing et largeur de contenu adaptés à l'iPad
- composants qui évitent les hypothèses "plein écran étroit uniquement"

## Limites actuelles

Au 3 juin 2026, `../editia/mobile`, `../editia/web` et `../Ideo/IdeoMobile` ont été inspectés directement dans ce workspace. `suarja/editia-waitlist` et `suarja/ai-edit` restent listés comme références de travail GitHub, mais leurs contenus n'ont pas été audités ici en direct.
