# Slice — Reprise de lecture & Historique

> **Vertical slice backend + mobile** (`convex/**` + `app/` + `src/`). Brancher depuis `dev` (à jour). Câble enfin l'UI **`ResumeCard`** et la **page Historique** — aujourd'hui 100 % stub — sur des données réelles, **en réutilisant le backend déjà en place** (`playbackProgress`, `contentInteractions`). Très peu de neuf : surtout des **queries de lecture** + du **câblage UI**.

> **For agentic workers:** REQUIRED SUB-SKILL : `superpowers:subagent-driven-development` ou `superpowers:executing-plans`. **Backend `convex/**` → lire `convex/_generated/ai/guidelines.md` AVANT, tests Vitest + convex-test (`npm run test:convex`).** **UI `app/`+`src/` → skill `frontend-design`, mockups `docs/podapp/project/mobile-mockups/` = vérité visuelle, Jest (`npm test`).** Le rendu se valide en smoke Expo web + iPad (`docs/agents/ui-visual-testing.md`). Steps use `- [ ]`.

**Goal :** un membre retrouve **(1)** une carte « Reprendre la lecture » qui pointe sur son **dernier média repris à la bonne position**, et **(2)** un **Historique** chronologique des contenus **consultés** (articles inclus) pour y revenir, **effaçable**. Les deux surfaces existent déjà visuellement mais sont en dur.

## Décisions verrouillées (issues du brainstorm)

- **Deux concepts distincts, deux sources déjà alimentées :**
  - **Resume** (`CONTEXT.md` → `Resume`) = **un seul** item, le `playbackProgress` le plus récent **non terminé**, **média uniquement** (épisode/vidéo). La reprise-scroll d'**article est hors scope** (parquée).
  - **ReadingHistory** (`CONTEXT.md` → `ReadingHistory`) = liste chronologique dérivée des signaux **`open`** de `contentInteractions` (déjà enregistrés sur chaque détail via `useContentEngagement`). **Aucune nouvelle écriture d'ouverture.**
- **Effacement = soft-clear.** Un marqueur `clearedAt` par membre ; la query d'historique ne lit que les opens **postérieurs**. **Ne jamais supprimer** de lignes `contentInteractions` (ce sont aussi le signal d'`Affinity`). C'est ce qui rend sûr le choix de réutiliser `contentInteractions`.
- **Lien visuel entre les deux :** une ligne d'historique qui a un `playbackProgress` affiche sa **barre de progression réelle** ; sinon pas de barre.
- **Gating membre** cohérent avec Bibliothèque : la capability est **`progressSync`** (`hasCapability(enabledModules, "progressSync")`) + auth Convex. Invité / capability off → mêmes gates que l'existant, surfaces masquées (pas de carte fantôme).
- **Dédup historique par contenu** : l'open le plus récent gagne ; plafond ~50 (fenêtre de scan bornée).
- **Tokens & responsive obligatoires** (jamais de hex/taille en dur ; `useResponsive` ; vérifier `midnight`). **Dead code retiré dans le même changement** (l'alerte « pending » du `ResumeCard` disparaît).

---

## Read First

**Protocole agent (obligatoire) :**
- `CLAUDE.md` (règles fondation mobile, tests, commit workflow).
- `docs/agents/slice-workflow.md` (rôles, boucle, invariants).
- `docs/agents/ui-visual-testing.md` (smoke Expo web + headless Chrome phone+iPad).
- `convex/_generated/ai/guidelines.md` (règles Convex — **override** les habitudes).

**Backend existant (à réutiliser, ne pas réécrire) :**
- `convex/schema.ts` → tables `playbackProgress` (index `by_tokenIdentifier_and_updatedAt` **déjà là, inutilisé** — c'est la clé de Resume) et `contentInteractions` (indexes par contenu/type ; **il manque un index par date**).
- `convex/playbackProgress/{queries,mutations}.ts` → CRUD position (garder tel quel).
- `convex/discovery/interactions.ts` → `recordInteraction` écrit déjà les `open` (ne pas toucher la logique d'écriture / `syncAffinities`).
- `convex/entitlements/authz.ts` → `requireMember` (pattern de gate + `tokenIdentifier`).
- `convex/content/source.ts` → `isEditorialContent` / filtrage publié (pattern de jointure contenu).

**Mobile existant (à câbler) :**
- `src/components/library/resume-card.tsx` → **stub décoratif** (barre figée 62 %, `showResumePendingAlert`). À rendre **data-driven** ; rendre `null` quand pas de Resume.
- `app/(app)/history.tsx` → n'affiche qu'un `ResumeCard` statique. À transformer en **Resume + liste Historique + effacer**.
- `app/(app)/profile.tsx` → `historyCount = 0` en dur (l.82), `<ResumeCard />` (l.259), `canProgressSync` (l.62). Brancher le compteur réel.
- `app/(app)/library.tsx` → section `resume` (`<ResumeCard />` l.296) ; même câblage.
- `src/features/media/use-playback-progress.ts` + `playback-progress.ts` → `resolveResumeTarget` (pur, **réutiliser** pour décider « non terminé »).
- `src/features/discovery/use-content-engagement.ts` → pattern hook membre (`useConvexAuth`, `skip` si invité).
- `src/features/content/card-presentation.ts` → `KIND_GLYPH`, kickers, `kindAccent` (réutiliser pour les lignes d'historique).
- Navigation détail par `kind` : routes `app/article/[id].tsx`, `app/episode/[id].tsx`, `app/video/[id].tsx` (+ `usePushWithReturn` dans `src/features/navigation/app-navigation.ts`).
- i18n : `src/i18n/locales/{fr,en}/library.ts` → bloc `historyScreen` + clés `resume*` (aujourd'hui en dur « L'economie du soin… »).

**Tests à garder verts :** `__tests__/playback-progress.test.ts`, `__tests__/episode-playback.test.tsx`, `__tests__/signed-in-library-screen.test.tsx`, et les Vitest `convex/**`.

---

## Scope Guard

**Inclut :**
- Index `by_tokenIdentifier_and_createdAt` sur `contentInteractions` ; table `readingHistoryState` (marqueur `clearedAt`).
- 2 queries de lecture (`getResume`, `getReadingHistory`) + 1 mutation (`clearReadingHistory`), membre-gated, Vitest.
- Hooks mobiles + câblage `ResumeCard` (data-driven), page Historique (liste + empty + effacer), compteur Profil réel.
- i18n dynamique (méta resume, libellés historique/empty/confirm effacer).

**N'inclut PAS :**
- Reprise-scroll d'**article** (pas de `seconds` ; parqué « plus tard »).
- Toute modification de la logique d'écriture des interactions / de l'affinité.
- Effacement par item / suppression de lignes `contentInteractions`.
- Nouveau design de carte au-delà de brancher l'existant (la vitalité des cartes est une autre slice).

---

## File Structure

- `convex/schema.ts` — +index `contentInteractions.by_tokenIdentifier_and_createdAt` ; +table `readingHistoryState`.
- `convex/readingHistory/queries.ts` — `getResume`, `getReadingHistory` (NEW).
- `convex/readingHistory/mutations.ts` — `clearReadingHistory` (NEW).
- `convex/readingHistory/{queries,mutations}.test.ts` — Vitest (NEW).
- `src/features/history/use-resume.ts`, `use-reading-history.ts` — hooks (NEW).
- `src/components/library/resume-card.tsx` — data-driven.
- `src/components/history/history-row.tsx` — ligne d'historique (NEW, réutilise `card-presentation`).
- `app/(app)/history.tsx` — Resume + liste + effacer.
- `app/(app)/{profile,library}.tsx` — compteur + Resume réels.
- `src/i18n/locales/{fr,en}/library.ts` — clés historique/resume.
- `__tests__/` — specs Jest des hooks/écran (NEW).

---

### Task 1 : Backend — index, table, queries, mutation (Vitest-first)

- [ ] **Step 1 (schema) :** ajouter `.index("by_tokenIdentifier_and_createdAt", ["tokenIdentifier", "createdAt"])` à `contentInteractions` ; définir `readingHistoryState: { tokenIdentifier, clearedAt }` index `by_tokenIdentifier`. `npx convex codegen`.
- [ ] **Step 2 (Vitest) :** spécifier puis implémenter `convex/readingHistory/mutations.ts` → `clearReadingHistory` (`requireMember` ; upsert `clearedAt = Date.now()`).
- [ ] **Step 3 (Vitest) :** `getReadingHistory` (`requireMember`) → scan `contentInteractions` via `by_tokenIdentifier_and_createdAt` **desc**, **type `open` uniquement**, filtré `createdAt > clearedAt` (0 si pas de marqueur), **dédupliqué par `contentId`** (le plus récent gagne), join `contents` **publiés**, plafond 50. Pour chaque item, joindre le `playbackProgress` éventuel → exposer `{ contentId, kind, title, heroImageUrl?, canonicalUrl?, openedAt, progressRatio? }` (`progressRatio` calculé via `seconds/durationSeconds`, omis sinon). Cas testés : dédup, **frontière soft-clear** (open avant `clearedAt` exclu), exclusion non-publié, gate non-membre (throw), ratio présent/absent.
- [ ] **Step 4 (Vitest) :** `getResume` (`requireMember`) → `playbackProgress` via `by_tokenIdentifier_and_updatedAt` **desc**, prendre une petite fenêtre, retenir le **premier** dont le contenu est **publié**, **média** (`kind` ∈ episode/vidéo) et **non terminé** (réutiliser la logique `resolveResumeTarget(seconds, durationSeconds) !== null`) ; renvoyer `{ contentId, kind, title, heroImageUrl?, seconds, durationSeconds?, progressRatio }` ou `null`. Cas testés : exclut terminé, exclut non-publié, exclut article, renvoie le plus récent résumable, `null` si rien.
- [ ] **Step 5 :** `npm run test:convex` PASS ; `npx tsc --noEmit -p convex` clean. **Commit** — `feat(history): reading-history + resume read model (soft-clear, reuse interactions)`.

### Task 2 : Hooks mobiles + `ResumeCard` data-driven (Jest-first)

- [ ] **Step 1 :** `use-resume.ts` / `use-reading-history.ts` → `useQuery(... )` avec `"skip"` quand invité (`useConvexAuth`) **ou** capability `progressSync` absente ; exposer `{ data, isLoading }`. Suivre le pattern de `use-content-engagement.ts`.
- [ ] **Step 2 (Jest) :** rendre `ResumeCard` **data-driven** — props `{ title, meta, kind, progressRatio, onPress }` (ou consommer `useResume()` en interne). **Barre de progression = `progressRatio` réel** (plus de 62 % en dur). **Rend `null` quand pas de Resume.** Supprimer `showResumePendingAlert` / l'alerte « pending » (dead code). Tester : état avec donnée (titre + barre au bon ratio), état vide (null), tap → `onPress`.
- [ ] **Step 3 :** brancher `ResumeCard` dans `library.tsx` et `profile.tsx` ; `historyCount` du Profil = `useReadingHistory().data?.length`. Tap Resume → ouvre le détail au bon `kind` (resume position gérée par les players existants).
- [ ] **Step 4 :** `npm test` + `npx tsc --noEmit` clean. **Commit** — `feat(history): wire ResumeCard + profile history count to live data`.

### Task 3 : Page Historique (liste + empty + effacer)

- [ ] **Step 1 :** `history-row.tsx` — ligne réutilisant `card-presentation` (`KIND_GLYPH`/`kindAccent`, kicker, titre, méta) + barre de progression si `progressRatio`. Tap → détail par `kind`. Tokens + `useResponsive`.
- [ ] **Step 2 :** `app/(app)/history.tsx` — `Resume` en tête (si présent) + **liste** `useReadingHistory()` + **état vide** (membre sans historique) + bouton **« Effacer l'historique »** → confirm (`Alert`) → `clearReadingHistory`. Conserver le gate invité/capability cohérent avec Bibliothèque.
- [ ] **Step 3 (i18n) :** ajouter aux deux locales (`fr`/`en`) sous `historyScreen` : `empty`, `clear`, `clearConfirmTitle`, `clearConfirmBody`, `clearConfirmCta`, `cancel` ; rendre la **méta resume dynamique** (durée restante / %) au lieu des libellés en dur. Garder l'i18n **modulaire**.
- [ ] **Step 4 (Jest) :** spec écran Historique — liste rendue, état vide, flux effacer (appelle la mutation), gate invité. **Commit** — `feat(history): live history list with resume header and soft-clear`.

### Task 4 : Vérification du slice (standard — toujours)

- [ ] `npm test` (Jest) PASS ; `npm run test:convex` (Vitest) PASS ; `npx tsc --noEmit` **et** `npx tsc --noEmit -p convex` clean ; `git status --short` clean.
- [ ] **Déployer le schéma/les fonctions** : `npx convex dev --once` (nouvel index + table + queries).
- [ ] **Smoke visuel** (`docs/agents/ui-visual-testing.md`) : Expo web + headless Chrome **phone + iPad**, sur **Profil**, **Bibliothèque** et **Historique** ; vérifier carte Resume (barre au bon ratio), liste historique, état vide, effacer. **Vérifier la palette `midnight`** + une palette claire.
- [ ] **Gates auth/capability** (non drivables headless) : couverts par tests + **passe manuelle** (invité → surfaces masquées ; membre `progressSync` off → masqué ; membre on → données).

---

## Self-Review

- **Réutilisation, pas réécriture** : Resume lit un index `playbackProgress` déjà présent ; l'historique lit des `open` déjà enregistrés. Le neuf se limite à 1 index, 1 micro-table, 2 queries + 1 mutation.
- **Couplage `contentInteractions` maîtrisé** : lecture seule + soft-clear ; **aucune** ligne supprimée → l'`Affinity` reste intacte (le test de frontière le prouve).
- **Deux concepts nets** (`Resume` vs `ReadingHistory` dans `CONTEXT.md`), surfaces dérivées sans dette.
- **Fondation respectée** : tokens/responsive/`midnight`, i18n modulaire, gate membre cohérent avec Bibliothèque, dead code (alerte « pending ») retiré.

## After This Slice

- **Reprise-scroll d'article** (optionnelle) : étendre `playbackProgress` avec un ratio, ou un store dédié — parquée.
- Backlog : bug stats/encart Hors-ligne (même source de vérité), deep links Profil, vitalité des cartes (slice voisine).
