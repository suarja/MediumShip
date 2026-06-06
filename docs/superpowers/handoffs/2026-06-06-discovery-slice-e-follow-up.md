# Handoff — Discovery Slice E follow-up (post-impl + user smoke)

**Branch:** `feat/discovery-slice-e-infinite-feed` (from `feat/discovery-slice-d-wikipedia-provider`)  
**Plan:** `docs/superpowers/plans/2026-06-06-discovery-slice-e-infinite-feed.md`  
**ADR:** `docs/adr/0004-aggregation-engine.md` (on-demand refill adopté en background+coalescé)

## Contexte

Slice E a livré le feed Découvrir plat + pagination locale + refill background coalescé. L'utilisateur a smoke-testé en dev et remonte des écarts entre l'intention « scroll infini sans effort » et le comportement perçu.

## Ce qui a été implémenté (Slice E)

| Area | Livrable |
|------|----------|
| Backend | `getDiscoveryFeed` paginé `{ items, nextCursor, isExhausted }`, seed stable |
| Backend | `requestDiscoveryRefill` + table `ingestionThrottle` + `runRefillIngestion` |
| Backend | Cron plus profond (8 catégories, 12 pages Wikipedia/catégorie) |
| Mobile | `FlatList` + `onEndReached`, kickers par `reason`, footer « à jour » |
| Mobile | `group-feed-sections` retiré de Découvrir |

Commits principaux sur la branche : voir `git log feat/discovery-slice-d-wikipedia-provider..HEAD`.

## Observations utilisateur (smoke réel)

1. **Détail de page / interactions riches** — tap sur une carte Wikipedia n'affiche pas un article complet (pas de corps, pas d'hypertexte). Attendu : **hors Slice E** (slice **Immersion**).
2. **Like** — ne réagissait pas visuellement (cache feed paginé sans toggle optimiste). Corrigé localement (non pushé au moment du handoff initial ; voir commit follow-up).
3. **Bookmark / Favoris** — l'utilisateur ne voyait rien dans **`contentInteractions`**. **Comportement normal** : les favoris vont dans la table **`bookmarks`**, pas `contentInteractions`. Seuls like/open/hide/etc. passent par `contentInteractions`.
4. **Bookmark UI** — icône ne se remplissait pas ; garde-fou Clerk (`isSignedIn`) vs Convex (`isAuthenticated`) incohérent dans `ContentCardFavoriteAction`. Corrigé : `canAccessBookmarks`, toggle optimiste, capability `bookmarks`.
5. **Fin de feed « Vous êtes à jour »** — message affiché mais rien ne se passe en dessous ; l'utilisateur refuse de devoir **pull-to-refresh en haut** pour voir du nouveau contenu. Il veut un **vrai scroll infini** : le refill background doit **append** automatiquement en bas.
6. **Pull-to-refresh inutile** — remonter en haut pour rafraîchir ne produit parfois aucun contenu nouveau → mauvaise UX.

## Correctifs appliqués dans ce handoff (à committer)

- **`ContentCardFavoriteAction`** : auth Convex + capability + toggle optimiste ; redirect `/sign-in` si guest.
- **`use-discovery-feed`** : quand `isExhausted && nextCursor === null`, repasser la subscription sur `cursor: null` (page 0) ; **append** les nouveaux IDs quand le corpus Convex grossit (refill réactif) sans pull-to-refresh.
- **Like** : toggle optimiste + `useConvexAuth` pour les mutations.
- **Copy footer** : plus de « tirez pour rafraîchir » comme chemin principal ; « s'ajoutent ici en arrière-plan ».

## Ce qui manque encore (prochain agent)

### P0 — UX scroll infini (suite Slice E ou E.1)

- [ ] Valider en dev que le **append réactif** fonctionne quand `runRefillIngestion` / `runRefillIngestion` ajoute des rows `contents` (attendre throttle + fetch Wikipedia, observer append en bas sans refresh).
- [ ] Si le corpus local est **totalement épuisé** (guest, ou zero archive recycle), afficher un état honnête (« recherche de nouveaux contenus… ») plutôt qu'un footer statique trompeur.
- [ ] **`loadMore` après exhausted** : si des pages archive existent (`nextCursor !== null`), s'assurer que le footer n'empêche pas le scroll de déclencher `onEndReached`.
- [ ] Envisager **`usePaginatedQuery` Convex** ou un hook dédié qui évite le cache `allItems` + curseur unique (source de bugs isLiked/bookmark avant correctifs).

### P1 — Immersion (slice séparée, explicitement hors E)

- [ ] Lecture Wikipedia JIT : `action=parse`, corps HTML, réécriture liens `/wiki/...`, persistance.
- [ ] Détail riche + signaux **Engagement** (open/read/finish) en ambient.
- [ ] Voir ADR 0004 décision 5 et plan spine `docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md`.

### P2 — Clarifications produit / debug

- [ ] Documenter pour les testeurs : **Favoris → table `bookmarks`** ; **Like → `contentInteractions`**.
- [ ] Vérifier dashboard Convex : module `bookmarks` activé sur le tenant (`enabledModules` inclut `"bookmarks"`).
- [ ] Smoke : phone + iPad + palette `midnight` (`docs/agents/ui-visual-testing.md`).

## Fichiers touchés récemment (follow-up)

- `src/components/content/content-card-actions.tsx`
- `src/features/discovery/use-discovery-feed.ts`
- `src/i18n/locales/{en,fr}/discover.ts`
- `__tests__/discover-screen.test.tsx`

## Vérification

```bash
npm run test:convex
npm test
npx tsc --noEmit && npx tsc --noEmit -p convex
```

## Suggested skills

- `superpowers:diagnose` — si append réactif ou refill ne se déclenche pas en dev
- `superpowers:executing-plans` — slice Immersion ou E.1
- `frontend-design` — états de fin de feed / loading background
- `convex` + lire `convex/_generated/ai/guidelines.md` avant backend

## Notes architecture (ne pas réintroduire)

- Refill **jamais** dans le chemin de lecture query ; toujours mutation → `ctx.scheduler`.
- Feed plat Découvrir ; sections éditoriales = **Accueil** (future slice CMS).
- Corpus partagé A→B = voulu (ADR 0004).
