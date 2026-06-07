# Slice — Mobile Bibliothèque & UI : Favoris, listes complètes, polish

> **Mobile-only vertical slice** (`app/`+`src/`). Surtout UI + i18n ; pas (ou peu) de backend. Branch from `feat/cms-slice-n-modules`.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou superpowers:executing-plans. **Jest-first** (`app/`+`src/`). UI → skill `frontend-design`. Mockups = source de vérité visuelle (`docs/podapp/project/mobile-mockups/screens.jsx` & `screens2.jsx`, écrans Bibliothèque/Profil). Steps use `- [ ]`.

**Goal:** finir le polish terrain de la **Bibliothèque** : renommer « Enregistrés » → **Favoris** partout, retirer le badge **Gratuit** sur Favoris (garder Premium sur l'offline), retirer la **loupe** top-bar (Bibliothèque + Explore), ajouter les **pages « liste complète »** (favoris + téléchargements) accessibles via « Voir tout », et allonger le **summary** des cartes « À découvrir ».

**Décisions verrouillées :**
- **Rename = strings utilisateur uniquement** (i18n en+fr). On **ne touche pas** aux identifiants de code (`bookmark`, `isSaved`, `saved*`) — la mécanique reste « bookmark », seul le **terme affiché** devient « Favoris ».
- **Badge Gratuit retiré** des Favoris (divergence assumée vs mockup qui l'affiche) ; **Premium conservé** sur les téléchargements.
- **Loupe top-bar retirée** sur Bibliothèque **et** Explore ; la **carte de recherche d'Explore reste** (c'est sa fonction). Pas de recherche inline sur Bibliothèque.
- **Pages liste complète** : suivre le pattern `app/lists.tsx` (route poussée). Réutiliser les hooks de données existants (favoris = bookmarks ; téléchargements = offline) — aperçu = slice, page complète = tout.

---

## Read First

- **Mockups** : `docs/podapp/project/mobile-mockups/screens.jsx` (écran Bibliothèque ~l.497–515 : « Enregistrements » + `gate--free`, « Téléchargements » + `gate--premium`, stat « Enregistrés ») & `screens2.jsx` (carte Bibliothèque). Adapter, en omettant le Gratuit.
- **Écran & composants** : `app/(app)/library.tsx` (loupe `testID="library-top-bar-search"` l.260 ; `gate="free"` l.312 sur Favoris ; `gate="premium"` l.322/345 ; sections resume/saved/lists/offline), `app/(app)/explore.tsx` (loupe top-bar + carte de recherche — garder la carte), `src/components/library/library-section-header.tsx` (titre + badge optionnel — y ajouter l'affordance « Voir tout »), `saved-library-section.tsx`, `downloaded-library-section.tsx`, `gate-badge.tsx`.
- **i18n à renommer** (en+fr) : `src/i18n/locales/{en,fr}/library.ts` (`screen.sections.saved`, copies « enregistrements/enregistrer »), `src/i18n/locales/{en,fr}/profile.ts` (`heroChipSaved_*`, `savedLabel`, copies). NB : `library:bookmark.saveCta` est **déjà** « Favoris ».
- **Cartes « À découvrir »** : `src/components/content/content-feature-card.tsx` (et/ou `content-card.tsx`) — repérer le `numberOfLines` du summary (2 → ~4).
- **Données** : hook bookmarks (favoris) + hook offline/downloads (à localiser dans `src/features/**`), pattern `app/lists.tsx`.
- **Tests existants** : `__tests__/signed-in-library-screen.test.tsx`, `__tests__/library-collection-section.test.tsx`.
- `CLAUDE.md`, `docs/agents/ui-visual-testing.md`.

Standing rules : jamais de couleur/taille en dur (tokens + `useResponsive`) ; responsive iPhone+iPad ; i18n modulaire ; code mort retiré dans le même changement.

---

## Scope Guard

Includes :

- **Rename « Enregistrés » → « Favoris »** dans tous les libellés utilisateur (Bibliothèque, Profil, stats), en + fr.
- **Retrait du badge Gratuit** sur la section Favoris (drop `gate="free"`).
- **Retrait de la loupe top-bar** sur Bibliothèque + Explore (conserver la carte de recherche d'Explore).
- **Page « Tous mes favoris »** + affordance « Voir tout »/chevron sur la section Favoris.
- **Page « Tous mes téléchargements »** + affordance « Voir tout » sur la section offline.
- **Summary allongé** (2 → ~4 lignes) sur les cartes « À découvrir » quand le contenu en a.

Does **not** include :

- **Redesign du layout de la grille de modules** (item backlog séparé).
- **Haptics** (slice transverse séparée).
- **Recherche du Home Feed** (autre écran, autre slice).
- Nouvelle infra backend si les hooks existants exposent déjà la liste complète (vérifier ; n'ajouter une query que si l'aperçu est réellement tronqué côté serveur).

---

## File Structure

- `src/i18n/locales/{en,fr}/library.ts`, `src/i18n/locales/{en,fr}/profile.ts` — rename.
- `app/(app)/library.tsx` — retirer loupe + `gate="free"` ; brancher « Voir tout » Favoris/offline.
- `app/(app)/explore.tsx` — retirer la loupe top-bar (garder la carte de recherche).
- `src/components/library/library-section-header.tsx` — affordance « Voir tout » optionnelle.
- `app/(app)/favorites.tsx` (nouveau) + `app/(app)/downloads.tsx` (nouveau) — pages liste complète (pattern `app/lists.tsx`).
- `src/components/content/content-feature-card.tsx` (et/ou `content-card.tsx`) — `numberOfLines` du summary.
- Tests : étendre `signed-in-library-screen.test.tsx` + nouveaux tests pour les pages liste complète.

---

### Task 1: Rename Favoris + retrait badge Gratuit (Jest-first)

- [ ] **Step 1 (Jest):** la Bibliothèque affiche **« Favoris »** (plus « Enregistrés ») ; **aucun** badge Gratuit sur la section Favoris ; le badge **Premium reste** sur l'offline ; le Profil/stats affichent « Favoris ».
- [ ] **Step 2:** renommer les strings i18n (en+fr) ; retirer `gate="free"` (l.312). Identifiants de code inchangés.
- [ ] **Step 3:** Jest → PASS ; `tsc` clean. **Commit** — `feat(mobile): rename Enregistrés → Favoris and drop the free gate badge`.

---

### Task 2: Retrait de la loupe top-bar (Jest-first)

- [ ] **Step 1 (Jest):** plus de `testID="library-top-bar-search"` sur la Bibliothèque ; plus de loupe top-bar sur Explore ; la **carte de recherche d'Explore reste** fonctionnelle.
- [ ] **Step 2:** retirer l'action loupe (Bibliothèque + Explore) + le code mort associé (constante `loupe scale` si inutilisée).
- [ ] **Step 3:** Jest → PASS ; `tsc` clean. **Commit** — `feat(mobile): remove the top-bar search loupe on Library and Explore`.

---

### Task 3: Page « Tous mes favoris » + Voir tout (Jest-first + frontend-design)

- [ ] **Invoke `frontend-design`** (header de section avec « Voir tout »/chevron ; page liste).
- [ ] **Step 1 (Jest):** la section Favoris montre un aperçu **et** une affordance « Voir tout » qui navigue vers une page listant **tous** les favoris ; vide → état vide propre ; invité → affordance de connexion.
- [ ] **Step 2:** ajouter l'affordance optionnelle à `LibrarySectionHeader` ; créer `app/(app)/favorites.tsx` réutilisant le hook bookmarks (pattern `app/lists.tsx`) ; tokens + responsive.
- [ ] **Step 3:** Jest → PASS ; `tsc` clean. **Commit** — `feat(mobile): full favorites list page with See all`.

---

### Task 4: Page « Tous mes téléchargements » + Voir tout (Jest-first + frontend-design)

- [ ] **Step 1 (Jest):** la section offline montre un aperçu **et** « Voir tout » → page listant **tous** les téléchargements ; états vide/locked cohérents (offline = Premium).
- [ ] **Step 2:** créer `app/(app)/downloads.tsx` réutilisant le hook offline ; même pattern que les favoris.
- [ ] **Step 3:** Jest → PASS ; `tsc` clean. **Commit** — `feat(mobile): full downloads list page with See all`.

---

### Task 5: Summary plus long sur les cartes « À découvrir » (Jest-first)

- [ ] **Step 1 (Jest):** la carte « À découvrir » affiche jusqu'à ~4 lignes de summary quand présent (au lieu de 2), sans casser la mise en page des cartes sans summary.
- [ ] **Step 2:** ajuster `numberOfLines` sur la carte feature/discovery ; vérifier l'espacement (tokens).
- [ ] **Step 3:** Jest → PASS ; `tsc` clean. **Commit** — `feat(mobile): longer summary on discovery cards`.

---

### Task 6: Vérifier la slice (standard)

- [ ] `npm test` → PASS · `npx tsc --noEmit` → PASS · (`npm run test:convex` si une query a été ajoutée).
- [ ] Scan couleurs/tailles en dur sur les fichiers changés → clean ; `grep "Enregistr"` côté i18n → seules les formulations volontaires restent (plus de label « Enregistrés »).
- [ ] **Smoke visuel** (Expo web + headless, protocole) : Bibliothèque (Favoris sans Gratuit, pas de loupe, « Voir tout » → liste complète), Explore (loupe top-bar partie, carte de recherche OK), carte « À découvrir » (summary plus long) ; phone **et** iPad ; `midnight`. États auth-gated (Favoris/offline connecté) couverts par tests + passe manuelle.
- [ ] `git status --short` clean.

---

## Self-Review

- **Rename cohérent** (libellés only, code intact) ; **Gratuit retiré**, Premium conservé.
- **Loupe top-bar partie** des deux écrans, recherche Explore préservée.
- **Listes complètes** favoris + téléchargements via « Voir tout », réutilisant les hooks existants (pas de nouvelle infra sauf nécessité réelle).
- **Cartes À découvrir** plus riches.
- Tokens + responsive + i18n modulaire ; pas de code mort.

## After This Slice

- Redesign layout grille de modules (backlog).
- Haptics app-wide (slice transverse).
- Recherche Home Feed + convergence Explore (après décision UX).
