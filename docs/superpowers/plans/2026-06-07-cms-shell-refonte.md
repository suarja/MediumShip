# CMS Shell Refonte — réorganisation des onglets & professionnalisation

> **CMS-only slice** (app Next.js `apps/cms`). Refactor/design, **zéro nouvelle feature**. Prépare le shell propre sur lequel **Slice N élargi** (onglet Modules + config sections de feed + icône de module) se posera ensuite. Branch from `dev`.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. UI/design task → invoke `frontend-design`. `apps/cms` n'est **pas** couvert par Jest/Vitest (qui ciblent `app/`+`src/` et `convex/**`) → vérification par **`tsc` + smoke visuel headless** (protocole `docs/agents/ui-visual-testing.md` adapté : serveur `apps/cms` au lieu d'Expo-web, largeurs desktop). Steps use `- [ ]`.

**Goal:** repenser **toute la couche autour du CMS** pour la professionnaliser, sans toucher aux fonctionnalités : (1) **réordonner les onglets** dans un ordre logique, (2) **retirer l'onglet Preview**, (3) rendre le design **plus carré** (réduire les border-radius surdimensionnés), (4) **nettoyer les résidus** de langage interne/domaine dans le chrome (topbar + page non connectée), (5) **clarifier les états d'auth** à l'arrivée. Les maquettes `docs/podapp/project/cms/` sont la **source de vérité visuelle**.

**Décisions verrouillées (produit) :**
- **Preview : retiré** de la refonte.
- **Modules : PAS ici** — l'onglet Modules + la config sections de feed + l'icône de module arrivent dans **Slice N élargi**, après, sur le shell propre.
- **Ordre cible des onglets** (travail quotidien → config → admin) : `Contenus · Catégories · Collections · Agenda` → `Tenant` (identité / couleurs, config avancée) → `Membres · Développeur`. *(Modules s'insèrera avant Tenant en N élargi.)*

---

## Read First

- **Maquettes (source de vérité visuelle)** : `docs/podapp/project/cms/app.jsx` (shell + topbar + nav), `docs/podapp/project/cms/styles.css` (langage visuel — radius 5–10px, pas de `--radius:22px`), `docs/podapp/project/cms/index.html`, `tenant.jsx`, `state.jsx`. Lire top-to-bottom (règle CLAUDE.md : adapter le mockup, ne pas réinventer).
- **Shell CMS actuel :** `apps/cms/components/cms/admin-shell.tsx` (`CMS_TABS`, `NAV_ITEMS`, topbar, `UserButton`), `apps/cms/components/cms/dashboard.tsx` (routing `activeTab`, états SignedOut / non-admin / bootstrap / admin), `apps/cms/components/cms/admin-login-shell.tsx` (page non connectée), `apps/cms/app/page.tsx` (parse `?tab=`), `apps/cms/app/globals.css` (`--radius: 22px`, `--radius-sm: 16px` → à carrer).
- **Preview à supprimer :** `apps/cms/components/cms/preview-tab.tsx`, `apps/cms/components/cms/preview-pane.tsx` (≈540 lignes — code mort à retirer).
- `docs/agents/ui-visual-testing.md` (protocole smoke, à adapter au serveur `apps/cms`), `CLAUDE.md`.

Standing rules : **aucune couleur/radius en dur** hors tokens — passer par les variables CSS du CMS (`globals.css`) ; retirer le code mort dans le même changement (`plus tard = jamais`) ; copy professionnelle (pas de jargon interne).

---

## Scope Guard

Includes (CMS `apps/cms` uniquement) :

- **Retrait de l'onglet Preview** : purge de `CMS_TABS` + `NAV_ITEMS` (admin-shell), du routing (dashboard), de `app/page.tsx`, et **suppression** de `preview-tab.tsx` + `preview-pane.tsx`.
- **Réordonnancement des onglets** dans l'ordre cible ci-dessus.
- **Design « plus carré »** : réduire `--radius` / `--radius-sm` (22/16 → valeurs maquette, ~6–10px) et auditer les radius surdimensionnés du chrome pour matcher `styles.css` de la maquette. Professionnaliser topbar / nav / états vides / espacements selon la maquette.
- **Nettoyage des résidus de langage interne/domaine** dans le chrome : tag `INTERNE`, « Accès interne · Mono-tenant CMS », et autres restes d'échafaudage → copy produit propre (le CMS a vocation à être vu par des clients).
- **Clarté des états d'auth à l'arrivée** : non connecté / connecté non-admin / admin / bootstrap premier admin — messages et parcours nets (s'appuyer sur la logique existante de `dashboard.tsx`, la rendre lisible et professionnelle). Sign-out Clerk déjà restauré (`<UserButton>`).
- **Page non connectée / landing** alignée sur la maquette (login shell épuré).

Does **not** include :

- Toute **nouvelle feature** : onglet Modules, config sections de feed, icône de module → **Slice N élargi**.
- Changement de logique d'autorisation côté `convex/**` (on ne touche pas aux règles d'accès serveur, juste la présentation).
- Toute modif de l'app mobile (`app/`+`src/`).
- Pagination / filtre source de la liste de contenu (backlog « CMS — infra »).

---

## File Structure

- `apps/cms/components/cms/admin-shell.tsx` — `CMS_TABS` + `NAV_ITEMS` réordonnés, Preview retiré, chrome professionnalisé (jargon retiré).
- `apps/cms/components/cms/dashboard.tsx` — retirer la branche Preview + l'import ; clarifier les états d'auth.
- `apps/cms/components/cms/admin-login-shell.tsx` — landing non connectée alignée maquette, copy pro.
- `apps/cms/app/page.tsx` — retirer `"preview"` du parse de `?tab=`.
- `apps/cms/app/globals.css` — `--radius` / `--radius-sm` carrés + audit radius chrome.
- **Supprimés :** `apps/cms/components/cms/preview-tab.tsx`, `apps/cms/components/cms/preview-pane.tsx`.

---

### Task 1: Retirer l'onglet Preview (+ code mort)

**Files:** `admin-shell.tsx`, `dashboard.tsx`, `app/page.tsx`, suppression `preview-tab.tsx` + `preview-pane.tsx`.

- [ ] **Invoke `frontend-design`** pour cadrer le shell cible d'après la maquette avant de couper.
- [ ] Retirer `"preview"` de `CMS_TABS` et l'entrée Preview de `NAV_ITEMS` ; retirer la branche `PreviewTab` + son import de `dashboard.tsx` (et le state `selectedId` s'il ne servait qu'au preview — sinon le garder) ; retirer `"preview"` du parse `?tab=` de `app/page.tsx`.
- [ ] **Supprimer** `preview-tab.tsx` et `preview-pane.tsx`. Vérifier `grep -rn "preview" apps/cms` → plus aucune référence morte.
- [ ] `tsc -p apps/cms` clean. **Commit** — `refactor(cms): remove the Preview tab and its pane`.

---

### Task 2: Réordonner les onglets logiquement

**Files:** `admin-shell.tsx`.

- [ ] Réordonner `NAV_ITEMS` (et `CMS_TABS` si l'ordre y compte) : `Contenus · Catégories · Collections · Agenda · Tenant · Membres · Développeur`. Tenant après le travail quotidien (config identité/couleurs) ; Membres + Développeur en fin (admin).
- [ ] Vérifier que le routing `dashboard.tsx` et le deep-link `?tab=` restent cohérents avec le nouvel ordre (l'onglet par défaut reste `contents`).
- [ ] `tsc -p apps/cms` clean. **Commit** — `refactor(cms): reorder tabs (daily work → tenant config → admin)`.

---

### Task 3: Design « plus carré » + chrome professionnel

**Files:** `apps/cms/app/globals.css`, `admin-shell.tsx`, `admin-login-shell.tsx`.

- [ ] **`frontend-design`** : aligner le langage visuel sur `docs/podapp/project/cms/styles.css`.
- [ ] Réduire `--radius` (22→~8–10px) et `--radius-sm` (16→~6px) ; auditer les radius surdimensionnés du chrome (cards, topbar, boutons) pour un rendu carré cohérent avec la maquette. Ne pas hardcoder : passer par les variables.
- [ ] Retirer le **jargon interne/domaine** du chrome : tag `INTERNE`, « Accès interne · Mono-tenant CMS », restes d'échafaudage → copy produit professionnelle.
- [ ] `tsc -p apps/cms` clean. **Commit** — `style(cms): squarer radii and professional chrome copy`.

---

### Task 4: États d'auth à l'arrivée + landing non connectée

**Files:** `dashboard.tsx`, `admin-login-shell.tsx`.

- [ ] **`frontend-design`** pour la landing d'après `index.html` / `app.jsx` (maquette).
- [ ] Rendre nets les 4 états : **non connecté** (landing + sign-in), **connecté non-admin** (accès refusé clair, sans jargon), **bootstrap premier admin** (claim explicite), **admin** (shell). Présentation pro, parcours lisible — sans changer la logique d'autorisation serveur.
- [ ] `tsc -p apps/cms` clean. **Commit** — `feat(cms): clear arrival auth states and polished logged-out landing`.

---

### Task 5: Vérifier la slice (standard)

- [ ] `tsc -p apps/cms --noEmit` → PASS ; `npx tsc -p convex --noEmit` → PASS (au cas où `page.tsx` touche des types partagés) ; tests pure-logic existants du CMS (`apps/cms/**/*.test.ts`, ex. `catalog-result-tree.test.ts`) → PASS.
- [ ] **Smoke visuel headless** (protocole adapté) : lancer `apps/cms` en dev, headless-Chrome aux largeurs desktop → vérifier : 4→7 onglets dans le bon ordre, Preview absent, rendu carré, aucun jargon `INTERNE`/`Mono-tenant`, landing non connectée propre, sign-out présent (`UserButton`). Joindre/citer les captures.
- [ ] `grep -rn "preview" apps/cms` → aucune référence résiduelle. Hardcoded-radius scan : pas de gros radius en dur réintroduit.
- [ ] `git status --short` clean.

---

## Self-Review

- **Zéro nouvelle feature** : on réordonne, on retire (Preview), on professionnalise — les features (Catégories, Collections, Agenda, Membres, Développeur) restent.
- **Code mort retiré** dans le même changement (preview-pane ≈540 lignes).
- **Maquette = source de vérité** : tabs, radius, copy alignés sur `docs/podapp/project/cms/`.
- **Shell prêt pour N élargi** : Modules s'insérera avant Tenant, la config sections/feed se posera sur un shell propre.
- **Pas de régression d'autorisation** : la logique serveur d'accès est inchangée, seule la présentation est clarifiée.

## After This Slice

- **Slice N élargi** : onglet **Modules** (avant Tenant) + config **sections de feed** (ordre / nom / visible — Home Feed vs Discover Feed) + **icône de module configurable**, rendu côté mobile.
- Backlog CMS infra (pagination, filtre source) et couche méta développeur (clés API, packages) → plus tard.
