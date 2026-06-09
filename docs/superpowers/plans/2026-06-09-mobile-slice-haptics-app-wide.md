# Slice — Haptique app-wide (retour tactile sémantique)

> **Mobile-only vertical slice** (`app/` + `src/`). Aucune dépendance backend. Brancher depuis `dev` (à jour). Première moitié du couple « Feedback » du backlog ; les **toasts CMS** et la **vitalité des cartes** sont des slices distincts (décidé avec le user).

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou superpowers:executing-plans. **Jest-first** (`app/` + `src/`). Steps use `- [ ]`. Le retour haptique ne se teste pas en headless → Jest couvre le **service** + que les primitives **appellent** le bon haptique (via mock) ; la preuve finale est un **smoke device** (iOS/Android physique).

**Goal:** introduire un **`HapticsService` central** (calqué sur Editia) et le brancher sur les **primitives d'interaction partagées** pour un retour tactile cohérent dans toute l'app, sans disperser des appels `expo-haptics` partout.

**Décisions verrouillées :**
- **Service calqué sur la référence éprouvée** `../editia/mobile/lib/utils/haptics.ts` : objet `HapticsService` avec `light` / `medium` / `heavy` / `success` / `error` / `warning` / `selection`, **no-op sur web** (`Platform.OS === "web"`). Emplacement : `src/features/haptics/haptics.ts`.
- **Brancher sur les primitives partagées, pas écran par écran.** On câble la tab bar, les chips, la `SearchBar`, les cartes/rows, la barre/sheet d'actions, les boutons primaires et le paywall — ça couvre l'app via les composants réutilisés.
- **Mapping sémantique** (cohérent app-wide) :
  - Navigation / sélection (tab bar, chips de filtre, chips de tendances, sélection) → **`selection`**.
  - Ouverture de détail / tap secondaire / soumission recherche → **`light`**.
  - Ajout aux favoris, sauvegarde réussie, confirmation → **`success`**.
  - Action primaire / CTA premium → **`medium`**.
  - Action destructive / « Pas intéressé » → **`warning`**.
  - Échec de mutation / erreur → **`error`**.
- **Appels « fire-and-forget »** : `void HapticsService.x()` (ne jamais bloquer l'UI sur l'await).
- **iOS + Android uniquement** ; web reste silencieux par design.

---

## Read First

- **Référence à miroir** : `../editia/mobile/lib/utils/haptics.ts` — copier la **structure** du service (pas le branding). Voir aussi quelques call sites Editia (`components/ui/GlassCard.tsx`, `SpeedDial.tsx`) pour le style d'usage.
- **Primitives à câbler (this repo)** :
  - `src/components/navigation/app-tab-bar.tsx` — `onPress` de l'onglet (→ `selection`).
  - `src/components/content/feed-filter-chips.tsx` — sélection de chip (→ `selection`).
  - `src/components/search/search-bar.tsx` — `onPress` (entrée feed) + soumission (→ `light`).
  - `app/(app)/explore.tsx` — chips de tendances (→ `selection`).
  - `src/components/content/feed-row.tsx`, `content-card.tsx`, `content-feature-card.tsx`, `feed-hero-card.tsx` — tap d'ouverture (→ `light`).
  - Favoris : `src/features/bookmarks/use-bookmarks.ts` + `src/components/content/content-card-actions.tsx`, `content-actions-bar.tsx`, `content-actions-sheet.tsx` — toggle (ajout → `success`, retrait → `selection`), « Pas intéressé » → `warning`.
  - Premium : `src/components/content/premium-paywall.tsx`, `src/components/paywall/paywall-sheet.tsx` — CTA (→ `medium`).
- **Tests existants à ne pas casser** : `__tests__/explore-screen.test.tsx`, `__tests__/explore-module-icons.test.tsx`, `__tests__/signed-in-library-screen.test.tsx`, `src/features/media/*` (mocker `expo-haptics` là où ces écrans montent les primitives câblées).
- `CLAUDE.md` (règles : tokens de thème, responsive, i18n modulaire, **code mort retiré dans le même changement**).
- `docs/agents/ui-visual-testing.md` (le retour haptique n'est pas testable en headless — noter le smoke device dans la vérif finale).

Standing rules : `npx expo install expo-haptics` (pas `npm install` brut, pour la bonne version SDK). Jamais de couleur/taille en dur. i18n modulaire. Pas de dead code.

---

## Scope Guard

Inclut :
- Dépendance `expo-haptics` + `src/features/haptics/haptics.ts` (`HapticsService`) + test unitaire.
- Câblage des **primitives partagées** listées ci-dessus selon le mapping sémantique.
- Mock `expo-haptics` dans le setup Jest (ou par fichier) pour que les écrans qui montent ces primitives restent verts.

N'inclut **pas** :
- Toasts CMS (slice « Feedback » CMS séparé).
- Vitalité / redesign des cartes (slice visuel séparé).
- Réglage utilisateur « désactiver les haptiques » (candidat suivi, pas maintenant — le service est déjà le point central pour l'ajouter plus tard).
- Tout backend.

---

## File Structure

- `src/features/haptics/haptics.ts` (+ `haptics.test.ts`) — le service.
- Édition légère des primitives partagées (cf. Read First) pour appeler le service.
- `jest.setup` (ou mock local) — stub `expo-haptics`.

---

### Task 1 : `HapticsService` + dépendance (Jest-first)

**Files :** `src/features/haptics/haptics.ts` ; `src/features/haptics/haptics.test.ts`.

- [ ] **Step 1 (Jest) :** spec — mock `expo-haptics` ; `HapticsService.selection()` appelle `Haptics.selectionAsync` ; `.light/.medium/.heavy` appellent `impactAsync` avec le bon `ImpactFeedbackStyle` ; `.success/.error/.warning` appellent `notificationAsync` avec le bon `NotificationFeedbackType`. Spec web : avec `Platform.OS = "web"`, **aucun** appel natif.
- [ ] **Step 2 :** `npx expo install expo-haptics`. Implémenter `src/features/haptics/haptics.ts` en miroir d'Editia (no-op web).
- [ ] **Step 3 :** Jest → PASS. `tsc --noEmit` clean. **Commit** — `feat(haptics): central HapticsService (expo-haptics, web no-op)`.

---

### Task 2 : Câbler navigation & sélection (Jest-first)

**Files :** `app-tab-bar.tsx`, `feed-filter-chips.tsx`, `search-bar.tsx`, `app/(app)/explore.tsx` (trends).

- [ ] **Step 1 :** ajouter le mock `expo-haptics` au setup Jest (ou par test) ; spec — presser un onglet appelle `HapticsService.selection` ; sélectionner une chip appelle `selection`.
- [ ] **Step 2 :** brancher `void HapticsService.selection()` dans `onPress` de la tab bar et la sélection de chips ; `void HapticsService.light()` dans l'`onPress` de la `SearchBar` (mode bouton) et à la soumission ; `selection` sur les chips de tendances.
- [ ] **Step 3 :** Jest (écrans Explore/Home incluant ces primitives restent verts) → PASS. **Commit** — `feat(haptics): wire navigation + selection primitives`.

---

### Task 3 : Câbler actions membres & premium (Jest-first)

**Files :** `use-bookmarks.ts`, `content-card-actions.tsx`, `content-actions-bar.tsx`, `content-actions-sheet.tsx`, `premium-paywall.tsx`, `paywall-sheet.tsx`, cartes/rows.

- [ ] **Step 1 (Jest) :** spec — basculer un favori en **ajout** appelle `HapticsService.success` ; « Pas intéressé » appelle `warning` ; le tap d'ouverture d'une carte appelle `light` ; le CTA premium appelle `medium`.
- [ ] **Step 2 :** brancher selon le mapping (ajout favori → `success`, retrait → `selection`, destructif → `warning`, ouverture détail → `light`, CTA premium/primaire → `medium`, échec mutation → `error`).
- [ ] **Step 3 :** Jest → PASS. **Commit** — `feat(haptics): wire bookmark, actions, and premium feedback`.

---

### Task 4 : Vérification du slice (standard — toujours)

- [ ] `npm test` (Jest) → PASS, `npx tsc --noEmit` clean, `npx tsc --noEmit -p convex` clean (inchangé), `git status --short` clean.
- [ ] **Smoke device (iOS et/ou Android physique)** — non automatisable :
  - Navigation entre onglets → tick de sélection.
  - Toggle d'une chip de filtre, tap d'une tendance → sélection.
  - Ajout d'un favori → success ; « Pas intéressé » → warning.
  - Ouverture d'un détail → light ; CTA premium → medium.
  - **Web** (Expo web) : aucun crash, aucun haptique (no-op).

---

## Self-Review

- **Service profond, interface étroite** : un seul point d'entrée sémantique ; ajouter un réglage « désactiver » plus tard = une seule garde dans le service.
- **Pattern éprouvé** : miroir d'Editia, no-op web, fire-and-forget.
- **Couverture par les primitives partagées** : peu de fichiers touchés, large portée.
- **Tests honnêtes** : le service est entièrement testé ; les call sites sont vérifiés via mock ; le ressenti réel est validé en smoke device (assumé non-headless).

## After This Slice

- **Slice 2 — Vitalité des cartes + polish Explore** (design visuel, maquettes mobiles ; inclut layout grille modules + nettoyage top-bar Explore).
- **Slice Feedback CMS** — toasts de confirmation sur les mutations CMS.
- Suivi : réglage utilisateur « retour haptique » (on/off) — le `HapticsService` est déjà le point central pour le brancher.
