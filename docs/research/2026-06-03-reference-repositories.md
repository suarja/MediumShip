# Repositories De Référence

Cette note fixe les repositories à consulter quand il y a un doute d'implémentation sur MediumShip, en particulier pour le mobile Expo/React Native, Clerk, Convex, i18n et responsive.

## Références prioritaires

### `../Ideo/IdeoMobile`

Disponible localement dans ce workspace. C'est la référence primaire actuellement inspectable.

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
- Quand une solution fiable existe dans `IdeoMobile`, partir de cette base avant de réinventer.
- Quand une décision touche Clerk + Convex, relire d'abord les patterns d'`IdeoMobile`.
- Quand une décision touche i18n, ne pas reproduire un unique gros fichier de traduction. MediumShip doit utiliser un découpage par page ou par feature.
- Quand une décision touche le layout, vérifier qu'elle fonctionne dès le départ sur iPhone et iPad.

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

### Responsive

Le mobile foundation doit intégrer un hook dédié du type `useResponsive` ou équivalent, piloté par `useWindowDimensions`, avec au minimum :

- distinction téléphone / tablette
- spacing et largeur de contenu adaptés à l'iPad
- composants qui évitent les hypothèses "plein écran étroit uniquement"

## Limites actuelles

Seul `../Ideo/IdeoMobile` a été inspecté directement dans ce workspace au 3 juin 2026. Les repositories GitHub `suarja/editia-waitlist` et `suarja/ai-edit` restent listés comme références de travail, mais leur contenu n'a pas été audité ici.
