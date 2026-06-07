# Slice O — Navigation composable (tables) : catalogue typé + barre d'onglets pilotée par la config

> **Vertical slice** : backend (`convex/**`) + CMS (`apps/cms`) + mobile (`app/`+`src/`). Étend le modèle features (Slice N / ADR 0008). Branch from `feat/cms-slice-n-modules`.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. **Vitest-first** `convex/**`, **Jest-first** `app/`+`src/`, **tsc + smoke visuel** `apps/cms`. UI → `frontend-design`. Lire `convex/_generated/ai/guidelines.md` avant `convex/`. Steps use `- [ ]`.

**Goal:** rendre la **barre d'onglets mobile pilotée par la config tenant** au lieu d'un set figé. Le tenant **active / désactive / réordonne** les **tables de navigation** depuis le CMS ; **désactiver une table retire son onglet**. Au passage : **typer** le `FeatureCatalog` en 3 natures (corrige les groupes incohérents) et **retirer l'aperçu mobile cassé** de l'onglet Tenant.

**Décisions verrouillées (grilling) :**
- **3 natures de feature** : `navTab` (peut être un onglet), `content` (alimente le Home/feed, jamais un onglet), `capability` (utilisée dans les surfaces, jamais un onglet). Le `group` du catalogue suit la nature.
- **Tables (`navTab`)** : `home` (core), `profile` (core), `discover`, `explore`, `agenda`, `community`, `collections`, `library`. On **ajoute** home/explore/library/profile au catalogue.
- **`content`** : `articles` (core), `episodes`, `videos`, `premium`. **`capability`** : `bookmarks`, `progressSync`, `offline`, `personalLists`, `membersRoom`.
- **Barre plafonnée à 5.** **`home` + `profile` fixes** (core, non-retirables, home en 1er) ; ~3 places libres. Le CMS **empêche** d'activer plus de tables que le plafond.
- **`enabled` (table) = dans la barre** (ordre par `navOrder`, plafond appliqué) ; **désactiver = retire l'onglet** ; pas de 3ᵉ état. Une table désactivée n'est pas atteignable (`href: null`).
- **Pas de migration de données destructive** : `featureConfigs` (Slice N) reste ; on ajoute l'ordre de nav.

---

## Read First

- `docs/adr/0008-feature-catalog-and-access-model.md` ; `CONTEXT.md` (`Feature`, `FeatureCatalog`, `Operator`).
- **Le modèle actuel** : `convex/featureCatalog.ts` (13 features, groupes `Contenu`/`Navigation`/`Capacités membres` — à retyper ; ajouter home/explore/library/profile), `convex/schema.ts` (`featureConfigs`), `convex/cms/mutations.ts` (`updateTenantSettings`).
- **Nav mobile actuelle (en dur)** : `app/(app)/_layout.tsx` (`<Tabs>` figés : home/discover/explore/library/profile + premium/settings href:null ; seul `discover` conditionné), `src/components/navigation/app-tab-bar.tsx`, `src/features/theme/theme-provider.tsx` (`featureConfigs` + `resolveEffectiveFeatureConfigs`). Routes existantes : `app/(app)/{home,discover,explore,library,profile,agenda,community,collections}.tsx`.
- **CMS Modules** (Slice N) : `apps/cms/components/cms/modules-tab.tsx` (à étendre : groupe Tables = reorder + plafond + core épinglés). **Aperçu cassé à retirer** : `apps/cms/components/cms/tenant-settings-form.tsx:111` (`mfeed` orphelin).
- `CLAUDE.md`, `docs/agents/ui-visual-testing.md`.

Standing rules : jamais de couleur/taille en dur (tokens + `useResponsive`) ; responsive iPhone+iPad ; i18n modulaire ; code mort retiré dans le même changement.

---

## Scope Guard

Includes :

- **Retyper le `FeatureCatalog`** : champ `nature: "navTab" | "content" | "capability"` ; regrouper proprement ; **ajouter** `home`/`explore`/`library`/`profile` (nature `navTab`, home+profile `core`). Réassigner discover/collections/agenda/community → `navTab` ; articles/episodes/videos/premium → `content` ; bookmarks/progressSync/offline/personalLists/membersRoom → `capability`.
- **Ordre de navigation tenant** : un `navOrder` (liste ordonnée de clés de tables) dans la config tenant + helper pur qui résout la **barre effective** (tables `enabled`, triées par `navOrder`, `home` forcé en 1er, `profile` épinglé, **plafond 5**).
- **CMS — composer de navigation** dans l'onglet Modules : pour les tables, **reorder** + toggle (= dans la barre) + **core épinglés non-retirables** + **blocage au-delà du plafond**. Contenus & capacités gardent enable + access (Slice N).
- **Mobile — barre dérivée de la config** : `_layout.tsx` génère le set/ordre d'onglets depuis la barre effective ; une table désactivée → `href: null` ; `home`/`profile` toujours présents.
- **Retirer l'aperçu mobile cassé** de l'onglet Tenant (`mfeed` orphelin).

Does **not** include :

- L'onglet **« Plus »/overflow** (on est sur plafond strict).
- L'état « activé mais hors barre » (3ᵉ état) — non retenu.
- La **convergence Home/Explore** (Explore atteint via recherche) — slice séparée (s'appuiera sur ce modèle).
- Le redesign du layout grille de modules ; les toasts CMS / haptics (slice Feedback).
- Le câblage paiement (inchangé depuis ADR 0008).

---

## File Structure

- `convex/featureCatalog.ts` (+ test) — `nature`, regroupage, +home/explore/library/profile ; helper `resolveEffectiveNavigation(featureConfigs, navOrder)` (barre effective, core forcés, plafond).
- `convex/schema.ts` — `tenants.navOrder` (`v.optional(v.array(v.string()))`).
- `convex/cms/mutations.ts` (+ test) — `updateTenantSettings` persiste `navOrder` (validé contre le plafond + core).
- `apps/cms/components/cms/modules-tab.tsx` — composer de nav (reorder + toggle + core épinglés + plafond) sur le groupe Tables.
- `apps/cms/components/cms/tenant-settings-form.tsx` — **supprimer** le bloc `mfeed` orphelin.
- `app/(app)/_layout.tsx` (+ test) — barre dérivée de la config ; `src/features/theme/theme-provider.tsx` (exposer la nav effective si utile).
- i18n CMS/mobile si nouveaux libellés.

---

### Task 1: Catalogue typé + résolution de la barre (Vitest-first)

**Files:** `convex/featureCatalog.ts` (+ test); `convex/schema.ts`; `convex/cms/mutations.ts` (+ test).

- [ ] **Step 1 (Vitest):** chaque feature a une `nature` ; home/explore/library/profile existent (navTab ; home+profile core). `resolveEffectiveNavigation(featureConfigs, navOrder)` renvoie les onglets : tables `enabled`, triées par `navOrder`, `home` en 1er, `profile` présent, **≤ 5** ; les `content`/`capability` n'y apparaissent jamais ; un core ne peut pas être retiré. `updateTenantSettings` persiste `navOrder` ; refuse/écrête au-delà du plafond ; defaults sains.
- [ ] **Step 2:** implémenter (retypage + helper + schéma `navOrder` + mutation). `featureConfigs` (Slice N) inchangé dans son comportement.
- [ ] **Step 3:** Vitest → PASS. **Commit** — `feat(features): typed catalog (navTab/content/capability) + effective navigation resolver`.

---

### Task 2: CMS — composer de navigation + retrait aperçu cassé (tsc + smoke)

**Files:** `apps/cms/components/cms/modules-tab.tsx`; `apps/cms/components/cms/tenant-settings-form.tsx`.

- [ ] **Invoke `frontend-design`** (liste de tables réordonnable, core épinglés, compteur de plafond).
- [ ] **Step 1:** dans Modules, le groupe **Tables** devient un composer : reorder, toggle (= dans la barre), `home`/`profile` **épinglés non-retirables**, et **blocage** quand on dépasse 5 (message clair). Contenus & capacités inchangés.
- [ ] **Step 2:** **supprimer** le bloc `mfeed` orphelin de `tenant-settings-form.tsx` (code mort).
- [ ] **Step 3:** `tsc -p apps/cms` clean ; smoke visuel (reorder, plafond, core épinglés ; Tenant sans aperçu cassé). **Commit** — `feat(cms): navigation composer in Modules tab; remove orphaned tenant preview`.

---

### Task 3: Mobile — barre d'onglets dérivée de la config (Jest-first)

**Files:** `app/(app)/_layout.tsx` (+ test); `src/components/navigation/app-tab-bar.tsx`; `src/features/theme/theme-provider.tsx`.

- [ ] **Step 1 (Jest, TDD):** la barre rend exactement les tables de la **nav effective** (ordre inclus) ; une table désactivée est **absente** (`href: null`) ; `home`/`profile` toujours présents ; au plus 5 ; les routes `content`/`capability` ne sont jamais des onglets.
- [ ] **Step 2:** `_layout.tsx` génère `<Tabs.Screen>` / `href` depuis la nav effective (helper de Task 1 via `useAppTheme`) ; tokens ; responsive.
- [ ] **Step 3:** Jest → PASS ; `tsc` clean. **Commit** — `feat(mobile): config-driven tab bar (enabled tables, ordered, capped)`.

---

### Task 4: Vérifier la slice (standard)

- [ ] `npm run test:convex` → PASS · `npm test` → PASS · `npx tsc --noEmit` + `-p convex` + `-p apps/cms` → PASS.
- [ ] **Smoke CMS↔mobile** : dans Modules, désactiver une table (ex. Découverte) + sauver → l'onglet **disparaît** côté mobile ; réordonner → la barre suit ; tenter une 6ᵉ table → bloqué ; `home`/`profile` toujours là. Onglet Tenant **sans** aperçu cassé. `midnight` + iPad.
- [ ] Scan couleurs/tailles en dur (mobile) clean ; `grep mfeed apps/cms` → vide.
- [ ] `git status --short` clean.

---

## Self-Review

- **Catalogue cohérent** : 3 natures, groupes sensés, home/explore/library/profile ajoutés — fin du « Navigation » bancal.
- **Barre pilotée par la config** : enabled table = onglet, ordonné, plafonné à 5, core (`home`/`profile`) garantis ; **désactiver retire l'onglet** (le besoin terrain).
- **Aperçu Tenant cassé supprimé** (code mort).
- **Pas de régression Slice N** : `featureConfigs`/access inchangés ; on ajoute `navOrder`.
- Décisions reportées proprement (3ᵉ état, overflow, convergence Explore).

## After This Slice

- **Convergence Home/Explore** : Explore atteint via la recherche du Home (cas spécifique au-dessus du modèle simple). Décision UX d'abord.
- **Slice Feedback** : toasts CMS + haptics mobile.
- Redesign layout grille de modules (backlog).
