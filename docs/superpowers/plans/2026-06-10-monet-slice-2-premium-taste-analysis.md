# Slice 2 — Analyse premium de goûts + sélection connexe (feature signature)

> **Vertical slice backend + mobile** (`convex/**` + `app/` + `src/`). Brancher depuis `dev` (à jour). **Feature premium signature** de la vague monétisation (`docs/monetization-reflection.md`). Inspirée de **Gleeph** : une **analyse de goûts** (texte) + une **sélection de contenus connexes**, **générée par CRON quotidien**, avec **page dédiée + page historique** et **navigation auto** à l'ouverture quand une nouvelle analyse n'a pas encore été vue. Réutilise la donnée déjà calculée (`userPreferences`, `categoryInterests`, `contentInteractions`, `bookmarks`, moteur `discovery/scoring`) **et** le module de notifications de la Slice 1.

> **For agentic workers:** REQUIRED SUB-SKILL : `superpowers:subagent-driven-development` ou `superpowers:executing-plans`. **Backend `convex/**` → lire `convex/_generated/ai/guidelines.md` AVANT + `docs/convex-components-descriptions.md` (composant `@convex-dev/agent`), tests Vitest + convex-test (`npm run test:convex`).** **UI `app/`+`src/` → skill `frontend-design`, mockups `docs/podapp/project/mobile-mockups/` = vérité visuelle, Jest (`npm test`).** Référence agents : `../editia/web/convex/agent/` (buildSystemPrompt, sanitizeUserInput, recordSecurityEvent). Smoke Expo web + iPad (`docs/agents/ui-visual-testing.md`). Steps use `- [ ]`.

**Goal :** chaque jour à heure fixe, un **CRON** génère pour chaque membre **premium** une **analyse** : **(1)** un court **texte « journaliste »** décrivant ses goûts (analyse **globale**), **(2)** une **sélection de contenus connexes** tappables. À l'**ouverture de l'app**, si une analyse a été générée et **pas encore vue**, l'app **navigue automatiquement** vers la **page analyse** du jour. Une **page historique** liste toutes les analyses passées. **Profil** affiche une **carte d'entrée/aperçu**. Membre non-premium → surfaces **verrouillées** (paywall) ; invité → masquées.

## Décisions verrouillées (issues du brainstorm)

- **Génération par CRON quotidien à heure fixe** (le « chrono »), **pas** paresseux-à-l'ouverture. Le cron itère les membres **premium** et génère l'analyse du jour (idempotent par `dayKey`). *(Échelle : OK pour démo / premiers tenants ; per-user scheduling fin = parqué.)*
- **Le LLM n'écrit QUE la prose.** La **sélection connexe vient du moteur déterministe** `discovery/scoring` (zéro ID halluciné, zéro contenu non-publié). Le modèle reçoit un **résumé de signaux**, produit un **texte** ; il ne choisit pas les contenus.
- **Analyse GLOBALE, pas par item** (pas de « savoir pourquoi » par contenu — parqué).
- **Nav auto à l'ouverture si non vue.** Marqueur `seenAt` par analyse ; à l'ouverture, s'il existe une analyse récente non vue → `router.push` vers sa page. La consultation pose `seenAt`. Anti-boucle (one-shot par session).
- **Page dédiée + page historique** (révise « Profil only ») : route analyse du jour + route historique (liste antéchronologique). **Profil = carte d'entrée/aperçu** (dernier titre + CTA → page).
- **Gating premium via l'API stable** : `useFeatureAccess("premiumInsights")` (clé `FeatureCatalog`, `access: "premium"`). `requiresPremium` → verrouillé + `openPaywall("content")`. `PREMIUM_PAYMENT_DEFERRED` reste `true` (Slice 4 le flippe) ; le **chemin de gate est déjà câblé** ([[entitlement-read-api-stable]]).
- **Donnée lue, jamais réécrite** (signaux/affinité intacts). **Sécurité prompt** : sanitization (modèle `../editia/web/convex/agent/sanitizeUserInput.ts`), **aucune PII** dans le prompt (agrégats de goûts seulement).
- **Réutilise la notif (Slice 1)** : le cron, après génération, planifie/émet une notif locale « ton analyse est prête » (kind `analysis_ready`) → tap ouvre la page analyse.
- **Tokens/responsive/`midnight`**, i18n modulaire (`insights`), **dead code retiré**.

---

## Read First

**Protocole agent (obligatoire) :**
- `CLAUDE.md` ; `docs/agents/slice-workflow.md` ; `docs/agents/ui-visual-testing.md` ; `convex/_generated/ai/guidelines.md` (**override**) ; `docs/convex-components-descriptions.md` (`@convex-dev/agent`).

**Donnée & moteur existants (réutiliser, ne pas réécrire) :**
- `convex/schema.ts` → `userPreferences`, `categoryInterests`, `contentInteractions` (index `by_tokenIdentifier_and_type`/`_and_createdAt`), `bookmarks`, `playbackProgress`.
- `convex/discovery/scoring.ts` + `feed.ts` → **moteur de scoring perso** = source de la **sélection connexe**.
- `convex/categories/interests.ts` ; `convex/content/source.ts` (publié/jointure).
- `convex/entitlements/{queries,authz,model}.ts` → `requireMember`, `getMyEntitlementDoc`, `isProFromEntitlement`. **Lister les membres premium** pour le cron = scan `entitlements` (pattern à confirmer dans `model.ts`).
- `convex/crons.ts` → **existe déjà** : y ajouter le cron quotidien.

**Composant Convex Agent + référence agents (imiter) :**
- Composant **`@convex-dev/agent`** (catalogue `docs/convex-components-descriptions.md` #1 « AI Agent » — préférer le composant à un build custom). Utilisé en prod par Editia : `../editia/mobile/package.json` **et** `../editia/web/package.json` → `@convex-dev/agent ^0.6.1`.
- Patterns à copier : `../editia/web/convex/agent/buildSystemPrompt.ts`, `sanitizeUserInput.ts` (+ test), `recordSecurityEvent.ts`, `toneDescriptors.ts`, `threadLanguage.ts`.

**Mobile existant (câbler) :**
- `app/(app)/_layout.tsx` → nav auto à l'ouverture (réutilise la résolution thème/tenant + le hook de session).
- `src/features/notifications/` (**Slice 1**) → réutiliser pour la notif `analysis_ready` + le listener tap.
- `src/features/tenant/use-feature-access.ts` (`requiresPremium`) ; `convex/featureCatalog.ts` (+`premiumInsights`).
- `src/components/navigation/feature-access-gate.tsx` + paywall (`openPaywall`).
- `src/features/membership/use-is-member.ts`, `src/features/discovery/use-content-engagement.ts` (patterns hook membre).
- `src/features/content/card-presentation.ts` (`KIND_GLYPH`/`kindAccent`) pour la sélection.
- `app/(app)/profile.tsx` (carte d'entrée) ; routes détail `app/{article,episode,video}/[id].tsx`.

**Tests à garder verts :** Vitest `convex/**` (scoring/feed), specs Profil, `npm test`.

---

## Scope Guard

**Inclut :**
- `@convex-dev/agent` installé + wiring modèle (env Convex).
- Table `tasteAnalysis` (cache + historique, `seenAt`), indexes par `dayKey` et par `createdAt`.
- Backend : `summarizeSignals`, `pickRelated` (déterministe via `discovery/scoring`), `prompt` (build+sanitize), action interne de génération **par membre**, **cron quotidien** itérant les premium, queries `getTodayAnalysis`/`getUnseenAnalysis`/`listMyAnalyses`/`getAnalysisById`, mutation `markAnalysisSeen`. Vitest (LLM mocké).
- Clé `premiumInsights` au `FeatureCatalog`.
- Mobile : page analyse (`/analysis/[id]`), page historique (`/analysis`), carte d'entrée Profil, **nav auto** à l'ouverture, notif `analysis_ready` (réutilise Slice 1). i18n `insights`.

**N'inclut PAS :**
- Justification « pourquoi » par item (parqué).
- Per-user scheduling fin / backfill massif (cron simple suffit).
- Câblage paiement (`PREMIUM_PAYMENT_DEFERRED` reste `true` — Slice 4).
- Toute écriture des signaux d'affinité.

---

## File Structure

- `package.json` / `convex/convex.config.ts` — `@convex-dev/agent` + `app.use(agent)`.
- `convex/schema.ts` — +`tasteAnalysis` (`tokenIdentifier`, `tenantSlug`, `dayKey`, `tasteText`, `relatedContentIds`, `model`, `createdAt`, `seenAt?`) index `by_tokenIdentifier_and_dayKey`, `by_tokenIdentifier_and_createdAt`.
- `convex/insights/signals.ts`, `relatedSelection.ts`, `prompt.ts` (NEW).
- `convex/insights/generate.ts` — `internalAction generateForMember` (NEW).
- `convex/insights/cron.ts` — `internalAction generateDailyAnalyses` (itère premium) (NEW) ; enregistrée dans `convex/crons.ts`.
- `convex/insights/queries.ts` — `getTodayAnalysis`, `getUnseenAnalysis`, `listMyAnalyses`, `getAnalysisById` (NEW).
- `convex/insights/mutations.ts` — `markAnalysisSeen` (NEW).
- `convex/insights/*.test.ts` — Vitest (NEW).
- `convex/featureCatalog.ts` — +`premiumInsights`.
- `src/features/insights/use-analysis.ts`, `use-unseen-analysis.ts` (NEW).
- `src/components/insights/analysis-view.tsx`, `analysis-history-row.tsx`, `profile-analysis-card.tsx` (NEW).
- `app/(app)/analysis/index.tsx` (historique), `app/(app)/analysis/[id].tsx` (détail) (NEW).
- `app/(app)/_layout.tsx` — nav auto.
- `app/(app)/profile.tsx` — carte d'entrée.
- `src/i18n/locales/{fr,en}/insights.ts` + `resources.ts`.
- `__tests__/` — specs Jest.

---

### Task 1 : Composant agent + schéma

- [x] **Step 1 :** installer `@convex-dev/agent` (cf. `docs/convex-components-descriptions.md`), enregistrer dans `convex.config.ts`, configurer le modèle (Anthropic, dernier Sonnet) + clé env Convex. `npx convex codegen` clean.
- [x] **Step 2 :** schéma `tasteAnalysis` (2 indexes ci-dessus, `relatedContentIds: v.array(v.id("contents"))`, `seenAt: v.optional(v.number())`). `npx convex codegen`. `npx tsc --noEmit -p convex` clean. **Commit** — `chore(insights): add @convex-dev/agent + tasteAnalysis table`.

### Task 2 : Backend — génération (Vitest-first)

- [x] **Step 1 (Vitest) :** `signals.ts` → `summarizeSignals(ctx, token, tenant)` : agrège **lecture seule** top catégories/tags/types (`userPreferences`/`categoryInterests`), opens/finish récents, nb bookmarks → objet **borné, sans PII**. Tester : agrégation, plafonds, cold-start vide.
- [x] **Step 2 (Vitest) :** `relatedSelection.ts` → `pickRelated(ctx, token, tenant, limit)` : réutilise la **policy `discovery/scoring`** sur le catalogue **publié**, **exclut** `open`/`finish`/`hide`, renvoie `Id<contents>[]` (~8). Tester : exclusion déjà-vu, publiés seulement, ordre par score, fallback cold-start (populaire).
- [x] **Step 3 (Vitest) :** `prompt.ts` → `sanitize()` (modèle Editia) + `buildInsightsPrompt(summary, locale)` (texte court, ton défini, langue membre). Tester : injection neutralisée, pas de PII.
- [x] **Step 4 (Vitest, modèle mocké) :** `generate.ts` → `generateForMember(token, tenant)` : `dayKey` ; si analyse du jour existe → no-op ; sinon `summarizeSignals` → `buildInsightsPrompt` → **LLM prose** → `pickRelated` → insert `tasteAnalysis`. Tester : insert, idempotence (pas de doublon même `dayKey`), cold-start.
- [x] **Step 5 (Vitest) :** `cron.ts` → `generateDailyAnalyses` : itère les membres **premium** (scan `entitlements` `isPro`) et appelle `generateForMember`. Enregistrer dans `convex/crons.ts` (1×/jour, heure fixe). Tester : n'inclut que premium, idempotent.
- [x] **Step 6 :** `npm run test:convex` PASS ; `npx tsc --noEmit -p convex` clean. **Commit** — `feat(insights): daily cron taste analysis (LLM prose + deterministic selection)`.

### Task 3 : Backend — lecture (Vitest-first)

- [x] **Step 1 (Vitest) :** `queries.ts` → `getTodayAnalysis`/`getAnalysisById`/`getUnseenAnalysis`/`listMyAnalyses` (tous `requireMember`) : join `contents` **publiés** pour la sélection ; `getUnseenAnalysis` = la plus récente avec `seenAt == null` (récente : <48h). `listMyAnalyses` = antéchronologique (index `by_..._createdAt`), plafond raisonnable. Tester : null/empty, filtrage publié, gate non-membre, fenêtre unseen.
- [x] **Step 2 (Vitest) :** `mutations.ts` → `markAnalysisSeen(analysisId)` (`requireMember`, vérifie l'appartenance, pose `seenAt`). Tester : pose seenAt, refuse l'analyse d'un autre.
- [x] **Step 3 :** `npm run test:convex` PASS. **Commit** — `feat(insights): read queries (today/by-id/unseen/history) + markSeen`.

### Task 4 : Mobile — pages, carte Profil, nav auto (Jest-first)

- [x] **Step 1 :** clé `premiumInsights` au `FeatureCatalog` (`access: "premium"`). `npx convex codegen`. Hooks `use-analysis` (par id/jour, `markAnalysisSeen` à l'affichage) + `use-unseen-analysis` (gate premium + `useConvexAuth`, `"skip"` sinon).
- [x] **Step 2 (Jest) :** `analysis-view.tsx` (texte + sélection via `card-presentation`, tap → détail par `kind`), `analysis-history-row.tsx`, `profile-analysis-card.tsx` (locked → paywall ; ready → aperçu + CTA). États locked/loading/ready/empty. Tokens/responsive/`midnight`. Tester chaque état + paywall + tap item.
- [x] **Step 3 :** routes `app/(app)/analysis/index.tsx` (historique `listMyAnalyses` + empty + gate) et `app/(app)/analysis/[id].tsx` (détail, pose `seenAt`). Gate premium cohérent (non-premium → paywall ; invité → redirigé/masqué).
- [x] **Step 4 :** **nav auto** dans `app/(app)/_layout.tsx` : à l'ouverture (résolution auth/membership faite), si `getUnseenAnalysis` renvoie une analyse → `router.push("/analysis/[id]")` (one-shot/session, anti-boucle). Brancher la notif `analysis_ready` (Slice 1) → même destination.
- [x] **Step 5 :** carte d'entrée dans `app/(app)/profile.tsx`. i18n `insights` (`fr`/`en`) + `resources.ts`. `npm test` + `npx tsc --noEmit` clean. **Commit** — `feat(insights): analysis page + history + profile entry + auto-nav on open`.

### Task 5 : Vérification du slice (standard — toujours)

- [x] `npm test` PASS ; `npm run test:convex` PASS ; `npx tsc --noEmit` **et** `-p convex` clean ; `git status --short` clean.
- [x] **Déployer** : `npx convex dev --once` (agent + table + cron + fonctions) ; `npx convex env list` (clé modèle) ; vérifier le cron enregistré.
- [ ] **Smoke visuel** (`docs/agents/ui-visual-testing.md`) : Expo web + headless Chrome **phone + iPad** sur page analyse, historique, carte Profil ; **`midnight`** + claire.
- [ ] **Gates premium/auth + cron** (non headless) : tests + **passe manuelle** — déclencher le cron (`npx convex run` sur l'action interne) pour un membre premium, vérifier l'insert, l'**ouverture → nav auto**, le `seenAt` posé (2ᵉ ouverture ne renavigue pas), non-premium → verrouillé. Rappel `PREMIUM_PAYMENT_DEFERRED=true` en dev.

---

## Self-Review

- **Réutilisation** : sélection = `discovery/scoring` ; signaux déjà calculés ; cron + notif s'appuient sur l'existant (`crons.ts`, module Slice 1). Le neuf = 1 table + couche LLM **prose** + pages.
- **Robustesse** : LLM ne choisit aucun contenu → pas d'ID halluciné ; idempotence cron par `dayKey` ; nav auto one-shot anti-boucle ; cold-start géré.
- **Sécurité** : sanitization, pas de PII, event sécurité minimal.
- **Gate stable** : `useFeatureAccess`/entitlements ; Slice 4 flippera le paiement sans toucher ici.
- **Fondation** : tokens/responsive/`midnight`, i18n `insights`, dead code nettoyé.

## After This Slice

- **Slice 3** (badges) puis **Slice 4** (RevenueCat → la feature devient réellement payante).
- Parqués : « pourquoi » par item ; per-user scheduling fin ; analyse multi-langue avancée ; pré-génération anticipée selon fuseau.
