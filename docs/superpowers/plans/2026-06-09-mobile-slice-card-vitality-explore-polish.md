# Slice — Vitalité des cartes + polish Explore

> **Mobile-only vertical slice** (`app/` + `src/`), surtout **UI/design** + i18n marginal. Brancher depuis `dev` (à jour, contient déjà le HapticsService du Slice 1). Deuxième moitié de la passe « feel ».

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou superpowers:executing-plans. **UI → skill `frontend-design`.** Mockups = **source de vérité visuelle** (`docs/podapp/project/mobile-mockups/`). **Jest-first** là où c'est structurel ; le rendu visuel se valide en **smoke Expo web + iPad** (cf. `docs/agents/ui-visual-testing.md`). Steps use `- [ ]`.

**Goal:** donner de la **vie** aux cartes. Aujourd'hui elles sont trop **plates** et **se ressemblent toutes** (« cartes blanches sur fond info »), sans distinction de type → ça ne ressort pas. Objectif : **différencier les types** (article / épisode / vidéo / catégorie / module) et ajouter **hiérarchie, profondeur et accent**, en restant cohérent avec l'esthétique éditoriale existante (titres serif, méta mono). **+ nettoyer le top-bar Explore** et **revoir le layout de la grille de modules**.

**Décisions verrouillées :**
- **Maquettes = vérité visuelle.** Lire `screens.jsx`, `screens2.jsx`, `components.jsx`, `variations.jsx`, `design-canvas.jsx` dans `docs/podapp/project/mobile-mockups/` AVANT de coder. Adapter à l'archi réelle, ne pas inventer.
- **Différenciation par type via un helper centralisé.** Étendre `src/features/content/card-presentation.ts` (qui a déjà `KIND_GLYPH`) avec un mapping **accent par type** basé sur des **tokens de thème** (pas de hex en dur). Réutiliser les tokens existants (`accent`, `accentSoft`, `canvasAccent`, `surfaceMuted`, `premium`, `premiumSoft`) ; **si** de nouveaux tokens d'accent par type sont nécessaires, les ajouter à **toutes** les palettes de `src/features/theme/palette-catalog.ts` (y compris **`midnight`**) et vérifier le contraste.
- **Profondeur subtile, pas du « shadow partout ».** Élévation/contraste légers et cohérents (bordure, `surface`/`surfaceMuted`, accent), pas d'ombres lourdes incohérentes entre palettes.
- **Ne pas casser le câblage haptique du Slice 1.** Ces composants ont déjà des appels `HapticsService.*` ; les conserver.
- **Tokens & responsive obligatoires.** Jamais de couleur/taille en dur ; `useResponsive` partout ; vérifier iPhone **et** iPad ; vérifier la palette **`midnight`**.

---

## Read First

- **Mockups (vérité visuelle)** : `docs/podapp/project/mobile-mockups/` → `components.jsx` + `variations.jsx` + `design-canvas.jsx` (traitements de cartes), `screens.jsx`/`screens2.jsx` (cartes en contexte : feed, À découvrir, Explore).
- **Composants cartes à revisiter** :
  - `src/components/content/content-feature-card.tsx` (≈297 l — la carte riche « À découvrir »),
  - `src/components/content/content-card.tsx` (wrapper fin),
  - `src/components/content/feed-row.tsx`, `src/components/content/feed-hero-card.tsx` (lead « À la une »).
  - `app/(app)/explore.tsx` → `FeatureCard` inline (grille **catégories** + **modules**) + le **top-bar** (deux `topBarSide` vides de 34px à nettoyer/rééquilibrer) + la **grille de modules** (layout à revoir).
- **Présentation partagée** : `src/features/content/card-presentation.ts` (`KIND_GLYPH`, `cardKicker`, `discoveryCardKicker`, `cardMeta`) — point central pour le mapping accent-par-type.
- **Thème** : `src/features/theme/palette-catalog.ts` (tokens dispo : `canvas/canvasAccent`, `surface/surfaceMuted`, `border`, `heading`, `textMuted`, `accent/accentSoft/accentContrast`, `premium/premiumSoft`), `src/features/theme/contrast.ts` (`withAlpha`), `useAppTheme`.
- **Tests existants à garder verts** : `__tests__/explore-screen.test.tsx`, `__tests__/explore-module-icons.test.tsx`, `__tests__/category-presentation.test.ts`, `__tests__/signed-in-library-screen.test.tsx`, et les snapshots/structuraux des cartes s'il y en a.
- `CLAUDE.md`, `docs/agents/ui-visual-testing.md` (protocole Expo web + headless Chrome phone+iPad).

Standing rules : tokens + `useResponsive` (jamais de littéral) ; i18n modulaire ; **dead code retiré dans le même changement** ; vérifier `midnight`.

---

## Scope Guard

Inclut :
- **Mapping accent-par-type** centralisé dans `card-presentation.ts` (tokens) + application dans les cartes.
- **Refonte visuelle des cartes** (profondeur, hiérarchie, distinction de type) : `content-feature-card`, `content-card`, `feed-row`, `feed-hero-card`, `FeatureCard` d'Explore (catégories + modules).
- **Polish top-bar Explore** (côtés vides → équilibre/nettoyage).
- **Layout grille de modules** d'Explore revu.

N'inclut **pas** :
- Nouveau contenu/données ou backend.
- Haptique (Slice 1, déjà fait) — juste ne pas le casser.
- Toasts CMS (slice séparé).
- Refonte d'écrans entiers au-delà des cartes/Explore (rester ciblé).

---

## File Structure

- `src/features/content/card-presentation.ts` — helper accent-par-type (+ tests).
- `src/features/theme/palette-catalog.ts` — **seulement si** nouveaux tokens nécessaires (toutes palettes, incl. `midnight`).
- `src/components/content/{content-feature-card,content-card,feed-row,feed-hero-card}.tsx`.
- `app/(app)/explore.tsx` — `FeatureCard`, top-bar, grille modules.

---

### Task 1 : Accent par type (centralisé, Jest-first)

- [ ] **Step 1 (Jest) :** spec `kindAccent(kind, theme)` (ou équivalent) dans `card-presentation.ts` → renvoie des couleurs **issues de tokens** distinctes par type (article/épisode/vidéo), stable et testable sans rendu.
- [ ] **Step 2 :** implémenter via tokens (+ tokens ajoutés à toutes les palettes **si** indispensable). Pas de hex en dur.
- [ ] **Step 3 :** Jest + `tsc` clean. **Commit** — `feat(cards): per-type accent helper from theme tokens`.

### Task 2 : Vitalité des cartes (mockups)

- [ ] Appliquer profondeur/hiérarchie/accent par type aux cartes (`content-feature-card`, `content-card`, `feed-row`, `feed-hero-card`) d'après les maquettes. Garder les appels `HapticsService.*`.
- [ ] Garder les tests structurels verts (adapter testIDs si déplacés, pas supprimer).
- [ ] **Commit** — `feat(cards): differentiated, livelier content cards`.

### Task 3 : Polish Explore (cartes + top-bar + grille modules)

- [ ] `FeatureCard` d'Explore (catégories + modules) alignée sur le nouveau traitement ; **top-bar** rééquilibré (plus de côtés vides incohérents) ; **grille de modules** au layout revu (cf. maquette).
- [ ] **Commit** — `feat(explore): card vitality, balanced top bar, module grid layout`.

### Task 4 : Vérification du slice (standard — toujours)

- [ ] `npm test` (Jest) → PASS ; `npx tsc --noEmit` + `npx tsc --noEmit -p convex` clean ; `git status --short` clean.
- [ ] **Smoke visuel (protocole `docs/agents/ui-visual-testing.md`)** : Expo web + headless Chrome, **phone + iPad**, sur le feed, « À découvrir » et Explore. **Vérifier la palette `midnight`** (contraste accent/profondeur) et une palette claire.
- [ ] Confirmer que les **haptiques** marchent toujours (aucun appel `HapticsService` retiré).

---

## Self-Review

- **Distinction par type** via un helper centralisé tokens-only → cohérent, testable, palette-safe (incl. `midnight`).
- **Profondeur maîtrisée** : élévation/contraste légers, pas d'ombres incohérentes.
- **Maquettes respectées**, adaptées à l'archi réelle.
- **Slice 1 préservé** : câblage haptique intact.

## After This Slice

- **Slice Feedback CMS — toasts** (séparé).
- Suivi backlog : profil invité gate, deep links Profil, historique/progression, bug stats offline.
