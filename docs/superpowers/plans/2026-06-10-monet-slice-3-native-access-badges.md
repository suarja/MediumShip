# Slice 3 — Sweep des badges d'accès natifs

> **Slice mobile** (`app/` + `src/`), petit et chirurgical. Brancher depuis `dev` (à jour). Vague monétisation (`docs/superpowers/backlog.md`). Aligne **toutes** les surfaces sur une seule règle d'affichage de badge d'accès, déjà appliquée à Profil : **un badge n'apparaît que si la feature/contenu est BLOQUÉ pour l'utilisateur courant** — jamais sur un `access === "premium"` brut. Améliore l'UX (pas de bruit « Premium/Gratuit » quand l'utilisateur a déjà accès) et prépare une démo payante crédible.

> **For agentic workers:** REQUIRED SUB-SKILL : `superpowers:subagent-driven-development` ou `superpowers:executing-plans`. **UI `app/`+`src/` → skill `frontend-design`, Jest (`npm test`).** Smoke Expo web + iPad (`docs/agents/ui-visual-testing.md`) ; gates auth/premium non drivables headless → tests + passe manuelle. Steps use `- [ ]`.

**Goal :** sur chaque surface (agenda, détail événement, hero de détail, cards de feed, gate de feature), le **badge d'accès** (`Premium`/`Membre`) ne s'affiche **que** quand l'utilisateur **n'a pas** accès (verrouillé). S'il a déjà accès (contenu gratuit, ou premium + membre premium), **aucun badge**. Comportement natif et cohérent partout, basé sur le signal existant `requiresPremium`/`requiresSignIn`.

## Décisions verrouillées

- **Source de vérité unique** : `src/features/tenant/use-feature-access.ts` expose déjà `requiresPremium` et `requiresSignIn` (= « bloqué **pour cet utilisateur** »). Le badge se conditionne **dessus**, jamais sur `access === "premium"` seul.
- **Règle :** locked premium → badge `Premium` (+ éventuel cadenas / CTA paywall) ; locked member → badge/indice `Membre` (sign-in) ; accès accordé → **rien**.
- **Pas de nouvelle infra de gate** — on consomme l'existant. Pas de changement backend.
- **Profil = référence** (badge gratuit déjà retiré) ; on **généralise** la même règle.
- **Tokens/responsive/`midnight`** ; **dead code retiré** (toute logique de badge basée sur `access` brut supprimée, pas commentée).

---

## Read First

**Protocole agent :** `CLAUDE.md` ; `docs/agents/slice-workflow.md` ; `docs/agents/ui-visual-testing.md`.

**À aligner (surfaces qui affichent un badge sur `access` brut aujourd'hui) :**
- `app/(app)/agenda.tsx` (~l.178 : `accessColor`/badge sur `event.access`).
- `app/event/[id].tsx` (~l.70-76 : `isPremiumGated`, `accessColor`, `openPaywall`).
- `src/components/content/detail-hero.tsx` (~l.138 : styles `premium`).
- Cards de feed / listes (`src/components/content/*`, `src/features/content/card-presentation.ts`) — vérifier tout badge d'accès.
- `src/components/navigation/feature-access-gate.tsx` (déjà sur la bonne logique — confirmer cohérence).
- **NOUVEAU (Slice 2) — surfaces premium « Ta lecture du jour »** : carte Profil + verrou de l'analyse (`src/components/profile/*` carte insights, `src/components/insights/*`, `src/components/library/library-briefing-locked-card.tsx`). Elles utilisent déjà `useFeatureAccess("premiumInsights")`/`requiresPremium` — **confirmer** qu'elles n'affichent un badge/lock que verrouillées (cohérent avec la règle) et router tout badge `access`-brut résiduel par `resolveAccessBadge`.

**Source de vérité :** `src/features/tenant/use-feature-access.ts` (`requiresPremium`/`requiresSignIn`/`canAccess`), `src/features/tenant/feature-access.ts` (`canAccessFeatureLevel`).

**Référence Profil :** la suppression du badge « Gratuit » quand l'utilisateur a accès (déjà faite — chercher dans `app/(app)/profile.tsx` / composants Bibliothèque le pattern retenu).

**Tests à garder verts :** specs agenda/event/detail existantes, `npm test`.

---

## Scope Guard

**Inclut :**
- Un **helper d'affichage de badge** centralisé (ou l'usage cohérent de `useFeatureAccess`/un équivalent par-contenu) → décide « afficher badge ? quel libellé ? » à partir du **statut utilisateur**, pas du seul `access`.
- Mise à jour agenda, détail event, detail-hero, cards de feed, et toute autre surface affichant un badge d'accès.
- Tests Jest : matrice d'états par surface (free/member/premium × invité/connecté/premium).

**N'inclut PAS :**
- Tout changement backend / d'entitlements.
- Refonte visuelle des cards au-delà du badge (vitalité des cartes = autre slice).
- Le câblage paiement (Slice 4) — ici `PREMIUM_PAYMENT_DEFERRED=true` ⇒ premium « passe », donc en dev un membre voit **rarement** un lock premium : **forcer** les états via tests + en faisant varier le contexte.

---

## File Structure

- `src/features/tenant/access-badge.ts` (ou util équivalent) — décide visibilité + libellé du badge depuis `{ access, isAuthenticated, isPro }` (NEW, pur, testé).
- `app/(app)/agenda.tsx`, `app/event/[id].tsx`, `src/components/content/detail-hero.tsx`, cards de feed — consomment le helper.
- `__tests__/` — specs du helper + des surfaces.

---

### Task 1 : Helper de badge (Jest-first)

- [x] **Step 1 (Jest) :** `access-badge.ts` → `resolveAccessBadge({ access, isAuthenticated, isPro })` → `{ show: boolean, level?: "member"|"premium" }`. Règle : `free` → `show:false` ; `member` → show si `!isAuthenticated` ; `premium` → show si `!canAccessFeatureLevel("premium", …)`. **Réutilise** `canAccessFeatureLevel` pour rester cohérent avec `PREMIUM_PAYMENT_DEFERRED`. Tester la matrice complète.
- [x] **Step 2 :** `npm test` PASS. **Commit** — `feat(access): centralized badge visibility helper (locked-for-user only)`.

### Task 2 : Aligner les surfaces (Jest-first)

- [x] **Step 1 :** `app/(app)/agenda.tsx` — remplacer le badge sur `event.access` brut par `resolveAccessBadge(...)` (+ contexte auth/membership). Pas de badge si accès accordé.
- [x] **Step 2 :** `app/event/[id].tsx` — idem ; conserver `openPaywall` **uniquement** quand verrouillé.
- [x] **Step 3 :** `src/components/content/detail-hero.tsx` + cards de feed — idem ; retirer la logique de badge basée sur `access` brut (dead code).
- [x] **Step 4 (Jest) :** specs par surface — badge présent **seulement** verrouillé, absent si accès ; tap verrouillé → paywall. Tokens/responsive/`midnight`.
- [x] **Step 5 :** `npm test` + `npx tsc --noEmit` clean. **Commit** — `refactor(access): show access badges only when locked for the current user`.

### Task 3 : Vérification du slice (standard — toujours)

- [ ] `npm test` PASS ; `npx tsc --noEmit` clean ; `git status --short` clean.
- [ ] **Smoke visuel** (`docs/agents/ui-visual-testing.md`) : Expo web + headless Chrome **phone + iPad** sur agenda, détail event, détail contenu ; **`midnight`** + claire.
- [ ] **Gates (non headless)** : tests + **passe manuelle** — invité (badge `Membre` sur surfaces membre), membre non-premium (badge `Premium` sur contenu premium), membre premium (aucun badge). Comme `PREMIUM_PAYMENT_DEFERRED=true`, vérifier l'état verrouillé via test/forçage du contexte.

---

## Self-Review

- **Une seule règle, une seule source** (`resolveAccessBadge` sur `canAccessFeatureLevel`) → cohérence garantie et alignée sur le futur flip de paiement.
- **UX** : plus de badge « Premium/Gratuit » quand l'utilisateur a déjà accès (la demande terrain).
- **Zéro backend**, dead code des badges `access`-bruts retiré.

## After This Slice

- **Slice 4** (RevenueCat) : une fois `PREMIUM_PAYMENT_DEFERRED=false`, les locks premium deviennent réels — la règle de badge marche **sans changement** (elle lit déjà l'entitlement).
