# Slice 4 — Câblage RevenueCat + IAP (premium réellement payant)

> **Vertical slice mobile + backend** (`app/` + `src/` + `convex/`). Brancher depuis `dev` (à jour). **Dernière slice de la vague monétisation et BLOQUANTE pour la 1ʳᵉ soumission store** (`docs/monetization-reflection.md`). Rend le `premium` **réellement payant** : `react-native-purchases` gère l'IAP Apple/Google, le **composant Convex `convex-revenuecat`** (catalogue `docs/convex-components-descriptions.md` #90) reçoit/vérifie le webhook RevenueCat, et on **synchronise** son état vers la table `entitlements` (`source: "revenuecat"`) via l'adaptateur **déjà prévu** (`upsertEntitlement`), puis on **flippe `PREMIUM_PAYMENT_DEFERRED = false`**. **Le read path / les gates ne changent pas** ([[entitlement-read-api-stable]]). **Pattern prouvé : Editia** (`../editia/web` pour le composant + webhook, `../editia/mobile` pour le SDK client).

> **For agentic workers:** REQUIRED SUB-SKILL : `superpowers:subagent-driven-development` ou `superpowers:executing-plans`. **Backend `convex/**` → lire `convex/_generated/ai/guidelines.md` AVANT, Vitest + convex-test.** **UI `app/`+`src/` → skill `frontend-design`, Jest.** ⚠️ **`react-native-purchases` est un module natif** → nécessite un **dev build** (`expo-dev-client`), **pas Expo Go**, et le smoke web reste no-op (achats non testables sur web/headless) → couvrir par tests (SDK + webhook mockés) + **passe manuelle sandbox**. Steps use `- [ ]`.

**Goal :** un membre tape « Devenir premium » → **paywall RevenueCat** (offre **2 €/mois, 2 semaines d'essai**) → achat **IAP Apple/Google** réel → le webhook RevenueCat écrit `entitlements.isPro = true` (`source: "revenuecat"`) → la session Convex voit `isPro` → toutes les surfaces premium (analyse Slice 2, offline, etc.) se débloquent **sans autre changement**. **Restaurer les achats** fonctionne. App soumissible comme produit payant.

## Décisions verrouillées (issues du brainstorm)

- **Composant Convex `convex-revenuecat`** (catalogue #90 ; règle CLAUDE.md : préférer le composant à un build custom) comme récepteur/vérificateur du webhook RevenueCat. **Ne PAS hand-roller** la vérif de signature/parsing : le composant le fait. Référence d'intégration : `../editia/web/convex/convex.config.ts` (`app.use(revenuecat)`) + `../editia/web/convex/httpHandlers/revenuecatWebhook.ts` + `../editia/web/convex/http.ts`.
- **`react-native-purchases`** comme SDK client mobile (achat/restore). Référence : `../editia/mobile/lib/utils/revenueCat.ts`, `../editia/mobile/lib/config/env.ts`, `../editia/mobile/lib/hooks/useIsPro.ts`, `../editia/mobile/lib/entitlements/`. **Stripe = plus tard, côté B2B/CMS** (hors scope ; Editia l'utilise côté web mais on ne le câble pas ici).
- **Convex est la source de vérité, pas le SDK** : comme `useIsPro` d'Editia, l'accès se lit dans `entitlements` (Convex), jamais directement depuis `CustomerInfo`. Le SDK sert **uniquement** à acheter/restaurer.
- **⚠️ Annulation ≠ révocation (piège connu — bug observé en prod sur Editia).** `isPro` se dérive **du `hasEntitlement()` du composant**, JAMAIS d'un event/`status` brut. Sémantique RevenueCat : `CANCELLATION` = auto-renew coupé, **l'accès reste jusqu'à `expiration_at_ms`** ; RC envoie `EXPIRATION` quand l'accès finit réellement ; les **périodes de grâce** maintiennent l'accès ; un lifetime n'expire jamais. **Ne JAMAIS** flipper `isPro=false` sur `CANCELLATION`/`canceled` tant que la période court. Seuls `EXPIRATION`/`REFUND` (ou annulé **après** `expiresAt`) révoquent. *(Cause racine du bug Editia : `../editia/web/convex/entitlements/canonical.ts:125` filtre `status ∈ {active,trialing}` et exclut `canceled` même avec `expiresAt > now` → accès coupé immédiatement à l'annulation. À ne pas reproduire — le composant `hasEntitlement()` gère ce cas, on s'appuie dessus.)*
- **Produit unique v1** : abonnement **mensuel 2 € + essai 2 semaines** ; entitlement RevenueCat nommé `premium`.
- **`app_user_id` RevenueCat = `clerkId`** → la sync résout l'utilisateur par `clerkId` (index `by_clerkId` déjà présent) **sans JWT**.
- **Réutiliser l'adaptateur existant** : `upsertEntitlement` (`convex/entitlements/mutations.ts`) écrit déjà `source: "revenuecat"`. Le refactoriser en **mutation interne** appelée par la **sync** depuis l'état du composant. **Aucun changement du read path.**
- **Flip `PREMIUM_PAYMENT_DEFERRED = false`** dans `src/features/tenant/feature-access.ts` — c'est l'unique bascule logique. Après ça, `premium` = `isPro` réel partout.
- **Restore + états d'erreur** gérés (achat annulé, réseau, déjà abonné). **Pas de logique premium dupliquée** côté client : la vérité reste l'entitlement Convex (le SDK sert à acheter, pas à gater).
- **Prérequis hors-code** (à acter avec le user) : compte **Apple Developer** + **Play Console**, **produits + contrats Paid Apps** signés, projet **RevenueCat** + clés API, **dev build** EAS. Voir `expo:expo-dev-client` / `expo:expo-deployment`.
- **Tokens/responsive/`midnight`** pour le paywall ; i18n modulaire (`paywall`) ; **dead code retiré** (toute branche « premium gratuit » devenue morte).

---

## Read First

**Protocole agent :** `CLAUDE.md` ; `docs/agents/slice-workflow.md` ; `docs/agents/ui-visual-testing.md` ; `convex/_generated/ai/guidelines.md` (**override**) ; `docs/convex-components-descriptions.md` (#90 RevenueCat — **préférer le composant**).

**Composant Convex RevenueCat — référence d'intégration prouvée (`../editia/web`) :**
- `../editia/web/package.json` → `convex-revenuecat ^0.1.11`.
- `../editia/web/convex/convex.config.ts` → `import revenuecat from "convex-revenuecat/convex.config"; app.use(revenuecat);`.
- `../editia/web/convex/httpHandlers/revenuecatWebhook.ts` → `revenuecatWebhookPost` (handler du webhook RC).
- `../editia/web/convex/http.ts` → montage de la route webhook.

**SDK client mobile — référence prouvée (`../editia/mobile`) :**
- `../editia/mobile/package.json` → `react-native-purchases ^8.11.4`.
- `../editia/mobile/lib/utils/revenueCat.ts` → helpers `CustomerInfo`/entitlements (`hasProEntitlement`, `determinePlan`).
- `../editia/mobile/lib/config/env.ts` → clés API par plateforme / TestFlight.
- `../editia/mobile/lib/hooks/useIsPro.ts` → **lecture stricte depuis Convex** (pas le SDK) — le patron à suivre.
- `../editia/mobile/lib/entitlements/` → câblage entitlement côté hooks.

**Contrat d'écriture existant (réutiliser, NE PAS dupliquer la décision premium) :**
- `convex/entitlements/mutations.ts` → `upsertEntitlement` (déjà prêt pour `source: "revenuecat"`, commentaire « later: webhook reuse this »). **À extraire en mutation interne** appelée par la sync du composant.
- `convex/entitlements/model.ts` → `isProFromEntitlement` (règle unique — ne pas toucher).
- `convex/entitlements/queries.ts` → `getMyEntitlement` (read path **stable** — ne pas toucher).
- `convex/schema.ts` (146-164) → table `entitlements` (`source` inclut déjà `revenuecat`, index `by_clerkId`).
- `convex/convex.config.ts` → y ajouter `app.use(revenuecat)` (comme Editia). `convex/http.ts` → y monter la route webhook du composant.

**Côté mobile :**
- Paywall existant (`openPaywall`, `src/components/navigation/feature-access-gate.tsx`) → le **brancher sur l'achat réel**.
- `src/features/tenant/feature-access.ts` → `PREMIUM_PAYMENT_DEFERRED` (le flip).
- `src/features/membership/use-is-member.ts` / `convex/react` `useConvexAuth` → la vérité d'accès reste là (inchangée) — équivalent de `useIsPro` d'Editia.
- Auth Clerk (`src/features/auth/`) → récupérer le `clerkId` pour `Purchases.logIn(clerkId)`.

**Réfs Expo :** skills `expo:expo-dev-client` (build natif), `expo:expo-deployment` (soumission store).

**Tests à garder verts :** Vitest entitlements existants, `npm test`.

---

## Scope Guard

**Inclut :**
- Composant **`convex-revenuecat`** installé + `app.use(revenuecat)` (comme `../editia/web`) + route webhook montée dans `convex/http.ts`.
- **Sync composant → `entitlements`** : `upsertEntitlement` extrait en **mutation interne**, appelée quand le composant reçoit un event RC. **`isPro` = `revenuecat.hasEntitlement(clerkId, "premium")`** (valeur autoritaire du composant, gère annulation/grâce/expiration), **pas** un mapping d'event/`status`. Résout `clerkId`, upsert idempotent `source: "revenuecat"`.
- `react-native-purchases` installé + config (clés API par plateforme, `Purchases.configure`, `logIn(clerkId)`) — patron `../editia/mobile/lib/utils/revenueCat.ts` + `lib/config/env.ts`.
- Paywall réel : fetch offerings, achat, **restore**, états (succès/annulé/erreur/déjà abonné).
- **Flip `PREMIUM_PAYMENT_DEFERRED = false`** + nettoyage des branches « premium gratuit » mortes.
- Tests : Vitest (sync → upsert, idempotence, mapping isPro, `clerkId` inconnu) ; Jest (paywall mocké : achat/restore/erreur).
- i18n `paywall` (offre, essai, restore, erreurs).

**N'inclut PAS :**
- **Stripe / B2B** (facturation des tenants — autre chantier ; Editia l'a côté web, pas nous ici).
- Hand-roll de la vérif de signature webhook (le **composant** s'en charge).
- Provisioning App Store Connect / Play / RevenueCat **dans le code** (config externe — checklist fournie, pas automatisable ici).
- Multi-produits / tiers / promo codes (v1 = 1 produit mensuel + essai).
- Changement du read path / des gates (interdit — c'est tout l'intérêt de la règle stable).

---

## File Structure

- `package.json` — `convex-revenuecat`, `react-native-purchases` (+ dev build EAS).
- `convex/convex.config.ts` — `app.use(revenuecat)` (réf `../editia/web/convex/convex.config.ts`).
- `convex/http.ts` — montage de la route webhook RC (réf `../editia/web/convex/http.ts` + `httpHandlers/revenuecatWebhook.ts`).
- `convex/entitlements/mutations.ts` — `upsertEntitlement` → `internalMutation upsertEntitlementInternal` réutilisé par les mutations admin **et** la sync RC.
- `convex/entitlements/revenuecatSync.ts` — pont event composant → `upsertEntitlementInternal` (NEW).
- `convex/entitlements/revenuecatSync.test.ts` — Vitest (NEW).
- `src/features/billing/purchases.ts` — init `Purchases.configure` + `logIn(clerkId)` + helpers offering/purchase/restore (NEW, no-op web ; patron `../editia/mobile/lib/utils/revenueCat.ts`).
- `src/features/billing/use-purchase-premium.ts` — hook achat/restore + états (NEW).
- `src/components/billing/paywall-sheet.tsx` (ou le paywall existant) — branché sur l'achat réel.
- `src/features/tenant/feature-access.ts` — `PREMIUM_PAYMENT_DEFERRED = false`.
- `src/i18n/locales/{fr,en}/paywall.ts` + `resources.ts`.
- `__tests__/` — specs paywall.

---

### Task 1 : Backend — composant RevenueCat + sync entitlements (Vitest-first)

- [ ] **Step 1 :** installer `convex-revenuecat`, `app.use(revenuecat)` dans `convex/convex.config.ts`, monter la route webhook dans `convex/http.ts` — **copier le câblage `../editia/web`** (`convex.config.ts` + `httpHandlers/revenuecatWebhook.ts` + `http.ts`). Configurer les secrets RC en env Convex (`npx convex env set`). `npx convex codegen` clean.
- [ ] **Step 2 :** extraire `upsertEntitlement` en `internalMutation upsertEntitlementInternal` (args : `tokenIdentifier?`, `clerkId`, `isPro`, `source`) ; faire pointer `grantMembership`/`revokeMembership` dessus (comportement admin inchangé — tests admin restent verts).
- [ ] **Step 3 (Vitest) :** `revenuecatSync.ts` → à chaque event du composant pour un `clerkId`, **re-lit `revenuecat.hasEntitlement(clerkId, "premium")`** (valeur autoritaire) → `isPro` ; résout l'utilisateur par `clerkId` (`by_clerkId`) ; appelle `upsertEntitlementInternal` (`source: "revenuecat"`). **Ne mappe PAS l'event/`status` brut vers isPro.** Tester (composant mocké) : achat/essai → true ; **`CANCELLATION` avec période en cours → reste true** (piège Editia) ; `EXPIRATION` → false ; **grâce/billing-issue → true** ; `REFUND` → false ; **idempotence** (rejouer le même event) ; `clerkId` inconnu → no-op gracieux. *(La vérif de signature est gérée par le composant — ne pas la re-tester ici.)*
- [ ] **Step 4 :** `npm run test:convex` PASS ; `npx tsc --noEmit -p convex` clean. **Commit** — `feat(entitlements): convex-revenuecat component + sync to entitlements (reuse upsert, read path unchanged)`.

### Task 2 : Mobile — SDK + paywall réel (Jest-first)

- [ ] **Step 1 :** installer `react-native-purchases` ; `purchases.ts` → `configure` (clés par plateforme via env/app config), `Purchases.logIn(clerkId)` au sign-in, helpers `getOffering`/`purchasePremium`/`restore`. **Garde web no-op** (module natif absent).
- [ ] **Step 2 :** `use-purchase-premium.ts` → expose `{ offering, purchase, restore, status }` (idle/pending/success/cancelled/error/already). **Ne gate rien** : après achat, l'accès vient de l'entitlement Convex (réactif).
- [ ] **Step 3 (Jest) :** brancher le paywall (`paywall-sheet.tsx` / surface `openPaywall`) sur l'achat réel : afficher l'offre **2 €/mois + essai 2 sem.**, bouton acheter, **restaurer**, gérer annulé/erreur/déjà-abonné. Tokens/responsive/`midnight`. Tester (SDK mocké) : achat→success, annulé, erreur, restore.
- [ ] **Step 4 :** i18n `paywall` (`fr`/`en`) ; `resources.ts`. `npm test` + `npx tsc --noEmit` clean. **Commit** — `feat(billing): RevenueCat paywall with real IAP purchase + restore`.

### Task 3 : Flip du paiement différé + nettoyage

- [ ] **Step 1 :** `PREMIUM_PAYMENT_DEFERRED = false` dans `feature-access.ts`. Retirer les **branches mortes** « premium gratuit » (commentaires/codes qui supposaient le passage par défaut).
- [ ] **Step 2 (Vitest + Jest) :** vérifier que les gates premium (Slice 2 analyse, offline, listes…) requièrent maintenant `isPro` réel ; ajuster les tests qui présupposaient le premium ouvert.
- [ ] **Step 3 :** `npm test` + `npm run test:convex` + `npx tsc --noEmit` (+ `-p convex`) clean. **Commit** — `feat(monet): enable real premium gating (PREMIUM_PAYMENT_DEFERRED=false)`.

### Task 4 : Vérification du slice (standard — toujours)

- [ ] `npm test` PASS ; `npm run test:convex` PASS ; `npx tsc --noEmit` **et** `-p convex` clean ; `git status --short` clean.
- [ ] **Déployer** : `npx convex dev --once` (mutation interne + route webhook) ; `npx convex env list` (secret webhook).
- [ ] **Smoke visuel** (`docs/agents/ui-visual-testing.md`) : Expo web + iPad sur le paywall (offre, essai, restore, erreur) ; **`midnight`** + claire. Vérifier web no-op (pas de crash).
- [ ] **Passe manuelle SANDBOX (obligatoire, non headless)** : **dev build** (`expo:expo-dev-client`) ; compte sandbox Apple/Play ; achat → webhook → `entitlements.isPro=true` → surfaces premium débloquées **réactivement** (carte **« Ta lecture du jour »** + pages `/analysis`, offline downloads, listes) ; **restore** ; **⚠️ annulation mi-période → l'accès RESTE débloqué jusqu'à l'expiration** (le piège Editia : vérifier que `isPro` ne saute pas sur `CANCELLATION`) ; expiration réelle / refund → re-verrouille.
- [ ] **Checklist soumission** (hors code, à acter avec le user) : produits App Store Connect/Play créés, contrats Paid Apps signés, RevenueCat relié, métadonnées store + mentions abonnement/essai conformes (cf. `expo:expo-deployment`).

---

## Self-Review

- **Read path intact** : le neuf est **uniquement** côté écriture (composant RC → sync → `upsertEntitlement`) + achat client. `getMyEntitlement`/`requireMember`/`useIsMember` **inchangés** — la promesse [[entitlement-read-api-stable]] tient.
- **Une seule définition de premium** : le client n'invente pas l'accès (comme `useIsPro` d'Editia, lecture Convex stricte) ; il achète, le composant + sync écrivent, la session lit. Pas de divergence possible.
- **Composant, pas custom** : `convex-revenuecat` gère vérif/parsing du webhook (règle CLAUDE.md) ; on copie le câblage `../editia/web`. L'adaptateur `revenuecat` était déjà anticipé dans le code (commentaire + littéral schéma + index `by_clerkId`) → on réalise un design déjà prévu.
- **Robustesse** : webhook vérifié par le composant + sync idempotente ; **annulation gérée correctement** (`isPro` dérivé de `hasEntitlement()` → accès maintenu jusqu'à expiration, le bug Editia ne peut pas se reproduire) ; restore + états d'erreur ; web/headless no-op.
- **Fondation** : tokens/responsive/`midnight`, i18n `paywall`, branches « premium gratuit » mortes retirées.

## After This Slice

- **1ʳᵉ soumission store** (cf. `expo:expo-deployment`) — l'app est un produit payant complet (badges natifs, analyse premium, digest, paiement réel).
- **Puis : landing pages** (démo + white-label + CMS) = chantier suivant désigné.
- Parqués : **Stripe B2B** (facturer les tenants), tiers/promo, notifications-as-a-package.
