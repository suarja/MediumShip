# Slice N (élargi) — Onglet Modules : config modules + sections de feed (CMS ↔ mobile)

> **Vertical slice** : CMS (`apps/cms`) + backend (`convex/**`) + mobile (`app/`+`src/`). Se pose sur le shell refonte. Branch from `feat/cms-shell-refonte`.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou superpowers:executing-plans. **Vitest-first** pour `convex/**`, **Jest-first** pour `app/`+`src/`, **tsc + smoke visuel** pour `apps/cms` (non couvert par Jest/Vitest). UI → skill `frontend-design`. Lire `convex/_generated/ai/guidelines.md` avant `convex/`. Maquettes = source de vérité visuelle. Steps use `- [ ]`.

**Goal:** introduire un onglet **Modules** dédié dans le CMS (placé **avant** Tenant), y **extraire** la config aujourd'hui enfouie dans l'onglet Tenant (activation des modules + **sections de feed** : ordre, nom, visibilité), ajouter l'**icône de module configurable**, et **rendre le tout côté mobile** (onglets/sections du Home Feed dans l'ordre + noms du tenant ; grille de modules avec les icônes configurées). Résultat : l'onglet **Tenant devient purement Identité + Palette**.

**Décisions verrouillées (produit) :**
- **Onglet Modules placé AVANT Tenant.** Après extraction, l'onglet **Tenant = Identité + Palette** uniquement.
- **Sections de feed = ordre + nom (titre) + visibilité**, par section de type de contenu (`article`/`episode`/`video`). Extraites de l'onglet Tenant (la logique `feedSections` + `moveSection` y existe déjà).
- **Icône de module configurable** : réutiliser le pattern `iconKey` des catégories ; rendue dans la **grille de modules** mobile.
- **REPORTÉ (non-goals explicites, parqués par l'utilisateur)** : le **segment d'accès Gratuit/Membre/Premium** par feature (présent dans la maquette `modules.jsx`), le **paywall / gating premium**, les **packages/notifications**. Ils appartiennent à la couche premium/méta-développeur **parquée** (`docs/superpowers/backlog.md`). L'onglet Modules de **cette** slice = **activation + sections de feed + icône** seulement.
- **« Home Feed vs Discover Feed »** : ce sont les **titres des sections** qui font le nommage (éditables par le tenant). On n'introduit **pas** de nouvelle abstraction de feed ici.

---

## Read First

- **Maquette (source de vérité visuelle)** : `docs/podapp/project/cms/modules.jsx` — adapter la mise en page (groupes de modules, **toggle d'activation**, résumé tenant) **en OMETTANT le segment d'accès** `AccessSegment` (Gratuit/Membre/Premium) ; `docs/podapp/project/cms/app.jsx` (placement de l'onglet) ; `docs/podapp/project/cms/styles.css`.
- **Config existante à EXTRAIRE** : `apps/cms/components/cms/tenant-settings-form.tsx` — `feedSections` (`{kind, title}`), `enabledModules`, la logique d'ordre (`moveSection`), la section « Modules » (vers la fin du form) et l'aperçu mobile `mfeed`/`mfeed__tabs`. C'est ce bloc qui part dans l'onglet Modules.
- **Backend** : `convex/schema.ts` (`tenants.feedSections`, `tenants.enabledModules` — ajouter le support d'`iconKey` par module), `convex/cms/mutations.ts` (`updateTenantSettings`), pattern `iconKey` des catégories (`convex/cms/categories.ts`, `src/features/categories/*` pour le rendu d'icône).
- **Mobile** : l'écran Home Feed (rendu des sections/onglets à partir de `feedSections`) et la **grille de modules** (composant à localiser — `src/components/**` ou `app/(app)/**`) pour y brancher les icônes configurées.
- Shell CMS : `apps/cms/lib/cms-tabs.ts` (source de vérité des onglets — y ajouter `modules`), `apps/cms/components/cms/admin-shell.tsx` (`NAV_ITEMS`), `apps/cms/components/cms/dashboard.tsx` (routing).
- `CLAUDE.md`, `docs/agents/ui-visual-testing.md`.

Standing rules : jamais de couleur/radius en dur (tokens) ; responsive iPhone+iPad côté mobile ; i18n modulaire ; **code mort retiré dans le même changement** (la section Modules quitte l'onglet Tenant, pas de duplication).

---

## Scope Guard

Includes :

- **Nouvel onglet Modules** (CMS) inséré **avant Tenant** dans `cms-tabs.ts` + `NAV_ITEMS` + routing `dashboard.tsx`.
- **Extraction** depuis l'onglet Tenant vers Modules : activation des modules (`enabledModules`) + **sections de feed** (ordre via reorder, **nom**/titre éditable, **visibilité**). L'onglet **Tenant ne garde que Identité + Palette**.
- **Icône de module configurable** : `iconKey` par module (backend + sélecteur CMS réutilisant le pattern catégories) ; persistée via `updateTenantSettings`.
- **Rendu mobile** : Home Feed affiche les sections dans l'**ordre + noms** du tenant, respecte la **visibilité** ; la **grille de modules** affiche les **icônes configurées**.

Does **not** include :

- Le **segment d'accès** Gratuit/Membre/Premium, le **paywall**, le **premium gating**, les **notifications/packages** → couche parquée.
- Le **redesign du layout** de la grille de modules mobile (item backlog « Mobile — Modules ») — ici on se limite à **brancher l'icône configurée** dans la grille existante.
- Toute nouvelle abstraction « Home Feed / Discover Feed » au-delà des titres de section.
- La convergence recherche Home/Explore (slice séparée).

---

## File Structure

- `apps/cms/lib/cms-tabs.ts` — ajouter `"modules"` (avant `tenant`).
- `apps/cms/components/cms/admin-shell.tsx` — `NAV_ITEMS` : entrée Modules avant Tenant.
- `apps/cms/components/cms/dashboard.tsx` — routing du nouvel onglet ; brancher `ModulesTab`.
- `apps/cms/components/cms/modules-tab.tsx` (nouveau) — UI Modules (activation + sections de feed + icône), extraite du Tenant form.
- `apps/cms/components/cms/tenant-settings-form.tsx` — **retirer** la section Modules + la logique `feedSections`/`moveSection`/aperçu `mfeed` (déplacées) ; ne garder qu'Identité + Palette.
- `convex/schema.ts` — support `iconKey` par module (forme à trancher en Task 1, ex. `moduleConfigs: [{ key, iconKey }]` ou enrichir la structure existante).
- `convex/cms/mutations.ts` (+ test) — `updateTenantSettings` accepte/persiste les icônes de module.
- Mobile : composant Home Feed (sections) + grille de modules (icônes) + tests Jest.
- i18n : `src/i18n/locales/{en,fr}/*` si nouveaux libellés mobiles.

---

### Task 1: Backend — icône de module dans la config tenant (Vitest-first)

**Files:** `convex/schema.ts`; `convex/cms/mutations.ts` (+ test).

- [ ] **Step 1 (Vitest, convex-test):** `updateTenantSettings` accepte une icône par module et la persiste ; relecture du tenant renvoie l'`iconKey` par module ; valeur par défaut si absente ; `enabledModules` et `feedSections` (ordre + titre) restent inchangés dans leur comportement.
- [ ] **Step 2:** choisir la forme de stockage la plus simple cohérente avec l'existant (réutiliser le pattern `iconKey` des catégories) ; étendre le schéma + la mutation ; **pas** de champ d'accès premium.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(cms): per-module icon in tenant config`.

---

### Task 2: CMS — nouvel onglet Modules + Tenant épuré (tsc + smoke visuel)

**Files:** `cms-tabs.ts`, `admin-shell.tsx`, `dashboard.tsx`, `modules-tab.tsx` (nouveau), `tenant-settings-form.tsx`.

- [ ] **Invoke `frontend-design`** d'après `modules.jsx` (sans le segment d'accès).
- [ ] **Step 1:** ajouter l'onglet `modules` (avant Tenant) dans `cms-tabs.ts` + `NAV_ITEMS` + routing `dashboard.tsx`.
- [ ] **Step 2:** créer `ModulesTab` en **déplaçant** depuis le Tenant form : activation des modules, sections de feed (**reorder** + **titre éditable** + **toggle visibilité**), et le **sélecteur d'icône** par module. **Retirer** ce bloc de `tenant-settings-form.tsx` (plus de duplication) → Tenant = Identité + Palette.
- [ ] **Step 3:** `tsc -p apps/cms` clean ; smoke visuel headless (onglet Modules présent avant Tenant, sections ordonnables/renommables/masquables, icône sélectionnable ; Tenant ne montre plus que Identité + Palette). **Commit** — `feat(cms): dedicated Modules tab (enable + feed sections + icons), slim Tenant tab`.

---

### Task 3: Mobile — rendu des sections de feed + icônes de module (Jest-first)

**Files:** écran Home Feed (sections), grille de modules (icônes), tests `__tests__/*`.

- [ ] **Invoke `frontend-design`** (cohérence visuelle, tokens, responsive iPad).
- [ ] **Step 1 (Jest, TDD):** le Home Feed rend les sections dans l'**ordre** du tenant, avec leurs **noms**, en respectant la **visibilité** (section masquée → absente) ; la **grille de modules** rend l'**icône configurée** de chaque module (fallback par défaut).
- [ ] **Step 2:** implémenter ; tokens uniquement ; i18n modulaire ; responsive iPhone+iPad.
- [ ] **Step 3:** Jest → PASS ; `npx tsc --noEmit` clean. **Commit** — `feat(mobile): render tenant feed sections and configured module icons`.

---

### Task 4: Vérifier la slice (standard)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` + `-p apps/cms` → PASS.
- [ ] Scan couleurs/radius en dur sur les fichiers mobiles changés → clean.
- [ ] **Smoke** : CMS (onglet Modules avant Tenant ; réordonner/renommer/masquer une section ; changer une icône de module ; Tenant = Identité + Palette) → effet **reflété côté mobile** (ordre/noms/visibilité du Home Feed + icônes de la grille) ; `midnight` + iPad.
- [ ] `grep` : la config sections de feed n'existe **plus** dans `tenant-settings-form.tsx` (pas de duplication).
- [ ] `git status --short` clean.

---

## Self-Review

- **Onglet Modules avant Tenant** ; **Tenant épuré** (Identité + Palette) — résout le point « ordre/contenu du Tenant ».
- **Sections de feed** (ordre/nom/visibilité) et **icônes de module** configurables côté CMS et **rendues côté mobile**.
- **Premium/accès reporté** : la matrice d'accès de la maquette n'est **pas** implémentée (couche parquée) — l'onglet reste simple.
- **Pas de duplication / code mort** : la config quitte réellement l'onglet Tenant.
- **Source de vérité maquette** respectée (en omettant volontairement l'accès premium).

## After This Slice

- **Redesign du layout** de la grille de modules mobile (backlog « Mobile — Modules »).
- **Couche premium / packages** (accès Gratuit/Membre/Premium, notifications, `is_premium_enabled`) — couche méta-développeur parquée.
- Recherche Home Feed + convergence Explore (slice séparée, après décision UX).
