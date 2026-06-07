# Slice N élargi — Onglet Modules : features (enable + accès), sections de feed & icônes (CMS ↔ mobile)

> **Vertical slice** : CMS (`apps/cms`) + backend (`convex/**`) + mobile (`app/`+`src/`). Implémente ADR 0008. Se pose sur le shell refonte. Branch from `feat/cms-shell-refonte`.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou superpowers:executing-plans. **Vitest-first** pour `convex/**`, **Jest-first** pour `app/`+`src/`, **tsc + smoke visuel** pour `apps/cms`. UI → skill `frontend-design`. Lire `convex/_generated/ai/guidelines.md` avant `convex/`. Maquettes = source de vérité visuelle. Steps use `- [ ]`.

**Goal:** introduire un onglet **Modules** dédié (placé **avant** Tenant) qui devient le poste de pilotage de l'app du tenant : pour chaque **`Feature`**, un **toggle `enabled`** + un **`AccessLevel`** (`free`/`member`/`premium`) ; pour les modules de contenu, la config des **sections de feed** (ordre, nom, visibilité) ; et une **icône de module** configurable. Côté mobile, l'app **respecte enabled + l'accès** (en réutilisant le chemin `Entitlement` existant) et **rend les sections + icônes** configurées. L'onglet **Tenant devient purement Identité + Palette**.

**Décisions verrouillées (ADR 0008) :**
- **3 niveaux** : `Operator` (nous) possède le **`FeatureCatalog` en code** (+ flags `core`/`lockAccess`) ; le `Creator` configure `{ enabled, access }` par feature dans ces limites ; le `Member` voit/utilise selon enabled + son `Entitlement`.
- **L'`AccessLevel` réutilise l'infra existante** `convex/entitlements/` — `member` → `requireMember`/`useIsMember`, `premium` → `getMyEntitlementDoc`/`isPro`, `free` → ouvert. **Zéro nouvelle infra de paywall.**
- **Paiement différé** : `premium` passe par défaut tant qu'aucun provider n'écrit `entitlements` (« premium gratuit pour commencer »).
- **Axe Operator minimal** : autorisation par-tenant = flags `core`/`lockAccess` du catalogue **uniquement** ; **pas** d'écran super-admin par-tenant (différé jusqu'à la monétisation).
- **Onglet Modules avant Tenant** ; après extraction, **Tenant = Identité + Palette**.
- **Sections de feed** = ordre + nom (titre) + visibilité, par section de type de contenu, extraites de l'onglet Tenant.
- **Icône de module** : réutiliser le pattern `iconKey` des catégories.

---

## Read First

- `docs/adr/0008-feature-catalog-and-access-model.md` — le modèle (3 niveaux, réutilisation entitlements, paiement différé). `CONTEXT.md` — `Feature`, `FeatureCatalog`, `AccessLevel`, `Operator`, `Entitlement`.
- **Infra accès EXISTANTE à réutiliser (ne pas réinventer)** : `convex/entitlements/authz.ts` (`requireMember`, `requireAuth`, `getMyEntitlementDoc`), `convex/entitlements/model.ts` (`isProFromEntitlement`), `convex/entitlements/queries.ts` (read API stable), et le gate mobile `useIsMember` (localiser dans `src/features/**`).
- **Maquette (source de vérité visuelle)** : `docs/podapp/project/cms/modules.jsx` — adapter groupes + toggle + **segment d'accès** `AccessSegment` + résumé tenant ; `app.jsx` (placement onglet) ; `styles.css`.
- **Config existante à EXTRAIRE** : `apps/cms/components/cms/tenant-settings-form.tsx` — `feedSections` (`{kind, title}`), `enabledModules`, logique d'ordre (`moveSection`), section « Modules », aperçu mobile `mfeed`.
- **Backend** : `convex/schema.ts` (`tenants.enabledModules`, `tenants.feedSections` → ajouter la config par feature `{ enabled, access }` + `iconKey`), `convex/cms/mutations.ts` (`updateTenantSettings`), pattern `iconKey` des catégories.
- **Mobile** : Home Feed (rendu des sections depuis `feedSections`), grille de modules (à localiser), navigation (masquer les features désactivées).
- Shell CMS : `apps/cms/lib/cms-tabs.ts`, `apps/cms/components/cms/admin-shell.tsx`, `apps/cms/components/cms/dashboard.tsx`.
- `CLAUDE.md`, `docs/agents/ui-visual-testing.md`.

Standing rules : jamais de couleur/radius en dur (tokens) ; responsive iPhone+iPad ; i18n modulaire ; **code mort retiré dans le même changement** (la section Modules quitte l'onglet Tenant, pas de duplication).

---

## Scope Guard

Includes :

- **`FeatureCatalog` en code** : liste statique des features `{ key, label, desc, group, core?, lockAccess? }` (modules de contenu — articles/podcasts/vidéos — + collections, agenda, téléchargements, notifications selon l'existant). Source de vérité partagée backend/CMS/mobile.
- **Config tenant par feature `{ enabled, access }`** (étend `enabledModules`) + **icône** par module + **sections de feed** (ordre/nom/visibilité). Persistée via `updateTenantSettings`.
- **Nouvel onglet Modules** (avant Tenant) : toggle + segment d'accès (`free`/`member`/`premium`) + reorder/rename/visibilité des sections + sélecteur d'icône. **Tenant épuré** (Identité + Palette).
- **Mobile** : **applique l'accès** via le chemin `Entitlement` existant (`free` ouvert ; `member` → `useIsMember`/auth ; `premium` → `isPro`, défaut = passe) ; **masque** les features désactivées de la nav ; **rend** les sections (ordre/nom/visibilité) + les **icônes** configurées.

Does **not** include :

- Le **câblage paiement** (RevenueCat/Stripe écrivant `entitlements`) — `premium` passe par défaut.
- L'**écran super-admin** d'autorisation des features **par tenant** (axe Operator complet) — différé.
- Le **redesign du layout** de la grille de modules mobile (backlog) — ici juste brancher l'icône + l'accès.
- Toute nouvelle abstraction « Home Feed / Discover Feed » au-delà des titres de section.

---

## File Structure

- `convex/featureCatalog.ts` (nouveau, + test) — le `FeatureCatalog` statique + helpers purs (résolution `{ enabled, access }` effectif d'un tenant en tenant compte de `core`/`lockAccess`).
- `convex/schema.ts` — config tenant par feature `{ enabled, access }` + `iconKey` (forme à trancher en Task 1) ; `feedSections` (ordre/titre/visible).
- `convex/cms/mutations.ts` (+ test) — `updateTenantSettings` persiste features/accès/icônes/sections.
- `apps/cms/lib/cms-tabs.ts`, `apps/cms/components/cms/admin-shell.tsx`, `apps/cms/components/cms/dashboard.tsx` — onglet `modules` avant `tenant`.
- `apps/cms/components/cms/modules-tab.tsx` (nouveau) — UI Modules (toggle + accès + sections + icône).
- `apps/cms/components/cms/tenant-settings-form.tsx` — **retirer** la section Modules/feedSections → Identité + Palette only.
- Mobile : gate d'accès par feature (réutilise `useIsMember`/entitlement), nav qui masque le désactivé, Home Feed (sections), grille de modules (icônes) + tests Jest.
- `src/i18n/locales/{en,fr}/*` si nouveaux libellés.

---

### Task 1: Backend — FeatureCatalog + config tenant {enabled, access} + icône (Vitest-first)

**Files:** `convex/featureCatalog.ts` (+ test); `convex/schema.ts`; `convex/cms/mutations.ts` (+ test).

- [ ] **Step 1 (Vitest):** le `FeatureCatalog` pur expose les features + flags `core`/`lockAccess` ; une fonction de résolution renvoie, pour un tenant, le `{ enabled, access }` **effectif** par feature (un `core` reste enabled ; un `lockAccess` garde son accès). `updateTenantSettings` persiste `{ enabled, access }` + `iconKey` par module + `feedSections` (ordre/titre/visible) ; relecture cohérente ; defaults sains ; `core`/`lockAccess` non contournables.
- [ ] **Step 2:** implémenter le catalogue + étendre schéma + mutation. **Pas** de câblage paiement (l'accès n'est qu'une donnée de config ici).
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(features): feature catalog + per-tenant {enabled, access} config`.

---

### Task 2: CMS — onglet Modules (toggle + accès + sections + icône) + Tenant épuré (tsc + smoke)

**Files:** `cms-tabs.ts`, `admin-shell.tsx`, `dashboard.tsx`, `modules-tab.tsx` (nouveau), `tenant-settings-form.tsx`.

- [ ] **Invoke `frontend-design`** d'après `modules.jsx` (toggle + `AccessSegment` + résumé tenant).
- [ ] **Step 1:** ajouter l'onglet `modules` (avant Tenant) dans `cms-tabs.ts` + `NAV_ITEMS` + routing.
- [ ] **Step 2:** créer `ModulesTab` : par feature, **toggle `enabled`** + **segment `free/member/premium`** (désactivé/`fixe` pour `core`/`lockAccess`) ; pour les modules de contenu, **reorder + titre éditable + toggle visibilité** des sections de feed ; **sélecteur d'icône**. **Déplacer** ce bloc hors de `tenant-settings-form.tsx` → Tenant = Identité + Palette.
- [ ] **Step 3:** `tsc -p apps/cms` clean ; smoke visuel (onglet Modules avant Tenant ; toggle + accès + sections + icône ; Tenant épuré). **Commit** — `feat(cms): Modules tab (enable + access + feed sections + icons), slim Tenant`.

---

### Task 3: Mobile — appliquer enabled + AccessLevel (Jest-first, réutilise les entitlements)

**Files:** gate/nav mobile, tests `__tests__/*`.

- [ ] **Step 1 (Jest, TDD):** une feature `disabled` est **absente** de la navigation ; `free` est ouverte à tous ; `member` exige l'auth (`useIsMember`/Convex auth) avec l'affordance de connexion sinon ; `premium` exige `isPro` mais **passe par défaut** (entitlement par défaut) → comportement « premium gratuit ». La règle d'accès réutilise le chemin `Entitlement` existant (pas de nouvelle logique de paywall).
- [ ] **Step 2:** implémenter en branchant sur `useIsMember`/l'entitlement existant ; tokens ; i18n.
- [ ] **Step 3:** Jest → PASS ; `tsc` clean. **Commit** — `feat(mobile): enforce feature enabled + access via existing entitlements`.

---

### Task 4: Mobile — rendu des sections de feed + icônes de module (Jest-first)

**Files:** Home Feed (sections), grille de modules (icônes), tests `__tests__/*`.

- [ ] **Invoke `frontend-design`** (tokens, responsive iPad).
- [ ] **Step 1 (Jest):** le Home Feed rend les sections dans l'**ordre** + **noms** du tenant, respecte la **visibilité** ; la **grille de modules** rend l'**icône configurée** (fallback défaut).
- [ ] **Step 2:** implémenter ; responsive iPhone+iPad.
- [ ] **Step 3:** Jest → PASS ; `tsc` clean. **Commit** — `feat(mobile): render tenant feed sections and configured module icons`.

---

### Task 5: Vérifier la slice (standard)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` + `-p apps/cms` → PASS.
- [ ] Scan couleurs/radius en dur sur les fichiers mobiles changés → clean.
- [ ] **Smoke CMS↔mobile** : activer/désactiver une feature, changer son accès, réordonner/renommer/masquer une section, changer une icône → reflété mobile (nav masquée, gate member/premium, ordre/noms/visibilité, icônes). `premium` passe (pas de paiement). Tenant = Identité + Palette. `midnight` + iPad.
- [ ] `grep` : plus de config feature/section dans `tenant-settings-form.tsx` (pas de duplication).
- [ ] `git status --short` clean.

---

## Self-Review

- **3 niveaux nets** (ADR 0008) : catalogue Operator en code → config tenant `{ enabled, access }` → application mobile via entitlements.
- **Réutilise l'infra existante** (`requireMember`/`isPro`/`useIsMember`) — pas de nouveau paywall ; `premium` gratuit par défaut.
- **Onglet Modules avant Tenant** ; **Tenant épuré** ; sections de feed + icônes configurables et rendues.
- **Différé proprement** : paiement + écran d'autorisation par-tenant (parqués), sans dette dans le modèle.
- **Pas de duplication / code mort** : la config quitte l'onglet Tenant.

## After This Slice

- **Câblage paiement** (provider écrit `entitlements`) → `premium` devient réellement payant, sans toucher le chemin de lecture.
- **Écran Operator** d'autorisation des features **par tenant** (vrai package vendable).
- **Redesign layout** grille de modules mobile (backlog).
- Recherche Home Feed + convergence Explore (slice séparée).
