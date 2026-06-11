# Slice — v1 sans paiement : Premium gratuit + review prompts + flag CMS insights

> **Vertical slice mobile + backend** (`convex/**` + `app/` + `src/`). **Brancher depuis `feat/monet-slice-4-revenuecat-iap`** (PAS depuis `dev`) — ce slice s'appuie directement sur le gating réel + l'infra paywall de Slice 4, et **les deux se mergent ensemble dans `dev`** (sinon `dev` aurait un état intermédiaire cassé : premium gaté + achat RevenueCat seul, sans chemin gratuit). Vague monétisation (`docs/superpowers/backlog.md`).
>
> **But produit** : la 1ʳᵉ soumission store se fait **sans paiement réel**. On garde le **gating premium réel** mais on devient pro via un bouton **« Essayer Premium gratuitement »** (zéro prix, zéro RevenueCat → review Apple simple, pas d'IAP). Le code RevenueCat (Slice 4) reste en place **désactivé par `PAYMENTS_ENABLED`** : ré-activer le paiement plus tard = flipper 1 flag.

> **For agentic workers:** REQUIRED SUB-SKILL : `superpowers:subagent-driven-development` ou `superpowers:executing-plans`. **Backend `convex/**` → lire `convex/_generated/ai/guidelines.md` AVANT, Vitest + convex-test (`npm run test:convex`).** **UI `app/`+`src/` → skill `frontend-design`, mockups `docs/podapp/project/{mobile-mockups,cms}/`, Jest (`npm test`).** Smoke Expo web + iPad (`docs/agents/ui-visual-testing.md`). Référence review : `../editia/mobile/lib/services/reviewService.ts`. Steps use `- [ ]`.

**Goal :** **(A)** un membre voit ses surfaces premium **verrouillées** et peut les débloquer d'un tap **« Essayer Premium gratuitement »** (devient pro **définitivement**, sans paiement) ; **(B)** la feature **« Ta lecture du jour »** est un **toggle CMS** — désactivée, elle disparaît partout (UI + cron) ; **(C)** un **prompt de review App Store** se déclenche **une seule fois** par moment-clé (passage Premium, ajout à une liste, 1er bookmark).

## Décisions verrouillées (issues du brainstorm)

- **Pas de paiement réel en v1.** Flag `PAYMENTS_ENABLED = false` masque tout le tunnel RevenueCat (achat/restore/paywall-prix). Le code RevenueCat **reste** (testé, dormant) ; ré-activation future = `PAYMENTS_ENABLED = true`.
- **Gating premium RÉEL** (`PREMIUM_PAYMENT_DEFERRED = false`, hérité de Slice 4) — sinon « passer pro » ne débloque rien.
- **Premium gratuit = permanent** : `startFreePremium` écrit l'entitlement de l'appelant `isPro=true`, **sans expiration**. Source `"trial"` (nouveau littéral, distinct de `manual`/`revenuecat`).
- **`premiumInsights` = toggle CMS** : déjà au catalogue (`lockAccess: premium`). Désactivé ⇒ retiré **partout** : carte Profil, routes `/analysis`, nav auto, **et le cron ne génère pas** pour les tenants où il est off.
- **Review prompts (3, indépendants, once-only)** : `premium_activated`, `list_add`, `first_bookmark`. `expo-store-review` + suivi persistant (AsyncStorage), guard `isAvailableAsync()`, jamais re-déclenché. Calque `../editia/mobile/lib/services/reviewService.ts`.
- **Réutilise l'existant** : la `PurchaseCelebrationModal` + `handlePurchaseSuccess` du paywall-provider servent aussi au chemin gratuit ; les entitlements (read path stable) ne changent pas ([[entitlement-read-api-stable]]).
- **Tokens/responsive/`midnight`**, i18n modulaire, dead code retiré.

---

## Read First

**Protocole agent (obligatoire) :**
- `CLAUDE.md` ; `docs/agents/slice-workflow.md` ; `docs/agents/ui-visual-testing.md` ; `convex/_generated/ai/guidelines.md` (**override**).

**Existant à réutiliser :**
- `src/features/tenant/feature-access.ts` → `PREMIUM_PAYMENT_DEFERRED` (déjà `false` sur la branche), `canAccessFeatureLevel`. Y ajouter `PAYMENTS_ENABLED`.
- `convex/entitlements/mutations.ts` → `upsertEntitlementInternal` / `grantMembership` (pattern d'écriture ; source union à étendre). `convex/entitlements/model.ts` (`isProFromEntitlement`), `queries.ts` (read path stable — ne pas toucher). `convex/schema.ts` table `entitlements` (champ `source`).
- `convex/featureCatalog.ts` → entrée `premiumInsights` (l.224). `convex/insights/cron.ts` → `generateDailyAnalyses` (itère les premium ; ajouter le check feature-enabled par tenant). Config tenant : `convex/tenants/*`, `src/features/tenant/public-config.ts`, `theme-provider` (`featureConfigs`).
- Surfaces insights : `src/components/insights/*`, `src/components/profile/profile-analysis-card.tsx`, `src/features/insights/use-unseen-analysis.ts`, routes `app/(app)/analysis/*`, nav auto dans `app/(app)/_layout.tsx`.
- Paywall : `src/components/paywall/paywall-sheet.tsx`, `src/features/paywall/paywall-sheet-provider.tsx` (`handlePurchaseSuccess`, `PurchaseCelebrationModal`), `app/(app)/premium.tsx` (CTA), `src/features/billing/use-purchase-premium.ts`.
- Listes perso : `app/(app)/lists*`, la mutation d'ajout à une liste (`convex/personalLists*` + son hook). Bookmarks : `convex/bookmarks/*` + hook mobile.

**Référence review (à copier) :** `../editia/mobile/lib/services/reviewService.ts` (type `ReviewTrigger`, `requestReview`, `isAvailableAsync`, suivi once-only + cap global).

**CMS Modules :** maquette `docs/podapp/project/cms/modules.jsx` ; l'onglet Modules rend le `FeatureCatalog` (toggle `enabled` + `access`).

**Tests à garder verts :** Vitest `convex/**`, Jest global (rappel : 2 échecs `use-collections` pré-existants — ne pas y toucher).

---

## Scope Guard

**Inclut :**
- `PAYMENTS_ENABLED` flag + masquage complet du tunnel RevenueCat quand `false`.
- Mutation membre `startFreePremium` (source `"trial"`, permanent, idempotent) + hook + CTA « Essayer Premium gratuitement » → unlock + célébration.
- `premiumInsights` toggle CMS effectif : off ⇒ retiré UI + routes + nav auto + **cron**.
- `expo-store-review` + `review-service` (3 triggers once-only) câblé aux 3 sites.
- i18n (`premium`/`paywall` pour le CTA gratuit ; pas de module review nécessaire).

**N'inclut PAS :**
- Réactivation du paiement (reste `PAYMENTS_ENABLED=false`).
- Essai limité dans le temps (premium gratuit = permanent).
- Nouveaux triggers review au-delà des 3 (1ʳᵉ lecture complète = parqué).
- Refonte du paywall au-delà du switch payant/gratuit.

---

## File Structure

- `src/features/tenant/feature-access.ts` — +`PAYMENTS_ENABLED = false`.
- `convex/schema.ts` — `entitlements.source` += `"trial"`. `convex/entitlements/model.ts` — type source. `convex/entitlements/mutations.ts` — `startFreePremium` (member-gated) + extension union.
- `src/features/billing/use-start-free-premium.ts` — hook (NEW).
- `src/components/paywall/paywall-sheet.tsx`, `app/(app)/premium.tsx` — CTA conditionnel (`PAYMENTS_ENABLED`).
- `convex/insights/cron.ts` — skip si feature `premiumInsights` désactivée pour le tenant.
- Surfaces insights — respecter `enabled` (carte Profil, routes, nav auto).
- `src/features/review/review-service.ts` + `review-triggers.ts` (NEW, calque Editia).
- Sites de trigger : free-premium success, add-to-list, premier bookmark.
- `package.json` — `expo-store-review`.
- `__tests__/`, `convex/**/*.test.ts` — specs.

---

### Task 1 : Premium gratuit + `PAYMENTS_ENABLED` (Vitest + Jest)

- [ ] **Step 1 :** `PAYMENTS_ENABLED = false` dans `feature-access.ts` (commenté comme kill-switch paiement v1). Garder `PREMIUM_PAYMENT_DEFERRED = false`.
- [ ] **Step 2 (schema) :** `entitlements.source` += `v.literal("trial")` ; `npx convex codegen` ; ajuster `model.ts` (type `EntitlementSource`).
- [ ] **Step 3 (Vitest) :** `startFreePremium` (mutation, `requireMember`) → upsert l'entitlement de l'appelant `isPro=true`, `source:"trial"`, idempotent. Tester : invité → throw, membre → isPro true, rejouer → pas de doublon, ne dégrade pas une source `revenuecat` existante.
- [ ] **Step 4 (Jest) :** hook `use-start-free-premium` ; CTA premium : si `!PAYMENTS_ENABLED` → bouton **« Essayer Premium gratuitement »** (sans prix) → mutation → succès → réutilise `handlePurchaseSuccess` (ferme + `PurchaseCelebrationModal`). Si `PAYMENTS_ENABLED` → tunnel RevenueCat existant. Masquer restore/prix/offering quand gratuit. Tester les deux états du flag.
- [ ] **Step 5 :** i18n `premium`/`paywall` (`freeTrialCta`, `freeTrialNote` « Sans engagement »…), fr+en. `npm test` + `npm run test:convex` + tsc clean. **Commit** — `feat(monet): free premium activation behind PAYMENTS_ENABLED (no RevenueCat in v1)`.

### Task 2 : Toggle CMS `premiumInsights` effectif (Vitest + Jest)

- [ ] **Step 1 :** vérifier que `premiumInsights` apparaît dans l'onglet Modules (toggle `enabled`). Si absent/incohérent, corriger l'entrée catalogue / le rendu CMS.
- [ ] **Step 2 (Vitest) :** `generateDailyAnalyses` (cron) — pour chaque membre premium, **skip** si `premiumInsights` n'est pas `enabled` pour son tenant (lire `featureConfigs`/config tenant). Tester : feature off → aucune génération ; on → génération.
- [ ] **Step 3 (Jest) :** auditer les surfaces — carte Profil « Ta lecture du jour », routes `/analysis`, nav auto — masquées/redirigées quand `useFeatureAccess("premiumInsights").enabled === false`. Tester carte absente quand off.
- [ ] **Step 4 :** tsc + tests verts. **Commit** — `feat(cms): premiumInsights enable toggle removes the feature end-to-end (UI + cron)`.

### Task 3 : Prompt review App Store (Jest)

- [ ] **Step 1 :** installer `expo-store-review` (plugin si requis). `review-service.ts` calqué Editia : `requestReview(trigger)`, guard `isAvailableAsync()`, **persistance once-per-trigger** (AsyncStorage) + cap global (jamais deux prompts rapprochés). `review-triggers.ts` → enum `premium_activated | list_add | first_bookmark`.
- [ ] **Step 2 (Jest) :** tester la logique pure — chaque trigger ne déclenche **qu'une fois**, indépendant des autres, no-op si indisponible/web, respect du cap.
- [ ] **Step 3 :** câbler les 3 sites : succès `startFreePremium` → `premium_activated` ; ajout d'un contenu à une liste → `list_add` ; **premier** bookmark (aucun favori avant) → `first_bookmark`.
- [ ] **Step 4 :** tsc + `npm test` verts. **Commit** — `feat(review): once-only App Store review prompts (premium, list add, first bookmark)`.

### Task 4 : Vérification du slice (standard — toujours)

- [ ] `npm test` (Jest) vert **sauf** les 2 `use-collections` pré-existants ; `npm run test:convex` vert ; `npx tsc --noEmit` **et** `-p convex` clean ; `git status --short` clean.
- [ ] **Déployer** : `npx convex dev --once` (source `trial`, `startFreePremium`, cron).
- [ ] **Smoke visuel** (`docs/agents/ui-visual-testing.md`) phone + iPad, **`midnight`** + claire : premium screen montre **« Essayer Premium gratuitement »** (pas de prix), pas de surface RevenueCat.
- [ ] **Passe manuelle** (non headless) : tap gratuit → pro + célébration + prompt review (1×) ; CMS toggle `premiumInsights` off → carte « Ta lecture du jour » disparaît + cron ne génère plus ; ajout à une liste → review (1×) ; 1er bookmark → review (1×) ; re-déclenchements → silencieux.

---

## Self-Review

- **Réversibilité paiement** : tout RevenueCat reste, masqué par `PAYMENTS_ENABLED` → ré-activer = 1 flag, zéro re-dev.
- **Gating réel préservé** : `PREMIUM_PAYMENT_DEFERRED=false` ; le free-grant écrit l'entitlement via le **même** read path stable (source `trial`).
- **Feature CMS de bout en bout** : off retire UI **et** cron (pas de génération fantôme/coût inutile).
- **Review non intrusif** : once-per-trigger + cap + guard dispo, calqué sur un service prouvé (Editia).
- **Fondation** : tokens/responsive/`midnight`, i18n modulaire, dead code retiré.

## After This Slice

- **1ʳᵉ soumission store** (sans IAP) possible : `expo:expo-deployment`.
- **Réintroduire le paiement** : `PAYMENTS_ENABLED=true` (Slice 4 se ré-active) + setup App Store Connect/RevenueCat. La migration des users `trial` → payants reste à définir.
- Parqués : essai limité dans le temps, trigger review « 1ʳᵉ lecture complète », gating par quantité (S-E).
