# Handoff — Slice 6 Discovery Engine

Produit lors d'une session de grilling (`/grill-with-docs`) le 2026-06-06.
À lire par le prochain agent avant toute action sur Slice 6.

---

## Ce qui a été fait dans cette session

| Fichier | Action |
|---|---|
| `docs/adr/0003-content-discovery-engine.md` | Statut passé de `Proposé` → `Accepté` |
| `CONTEXT.md` | Ajout d'`Entity` dans "Modèle Éditorial" |
| `docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md` | Plan Slice 6 créé |

---

## Décisions actées (ne pas remettre en question sans l'utilisateur)

- **`Content`** reste le terme canonique du glossaire (pas `ContentItem`).
- **`Insight`** hors scope pour l'instant — ne pas ajouter au glossaire.
- **`Entity`** est dans le glossaire (dimension de scoring du Discovery Engine).
- **`Bookmark`** reste un concept autonome — pas absorbé dans `Interaction`.
- **`Interaction`** / **`UserPreference`** / **`FeedSession`** sont des tables techniques, pas des termes du glossaire.
- **`Feed`** est le seul terme pour les flux — pas de `DiscoveryFeed` séparé.
- **Discovery Engine** = Slice 6, `CMSProvider` en premier.
- **`WikipediaProvider`** = slice séparé (Slice 7+).
- **Slice 5** (CMS authoring + avatar + capability wiring) reste inchangé et doit être complété avant Slice 6.

---

## Ordre d'exécution recommandé

```
1. Vérification de conformité de cette session   ← Prompt A ci-dessous
2. Enrichissement du plan Slice 6                ← Prompt B ci-dessous
3. Implémentation Slice 5                        ← plan existant
4. Implémentation Slice 6                        ← plan enrichi
```

---

## Prompt A — Vérification de conformité

> Donne ce prompt à un agent de vérification avant de continuer.

```
Tu es un agent de vérification. Ta mission est d'auditer le travail produit
lors d'une session de grilling sur le projet MediumShip (Expo + Convex +
Clerk, backend white-label pour médias indépendants).

## Fichiers à lire

- CONTEXT.md
- docs/adr/0003-content-discovery-engine.md
- docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md
- CLAUDE.md (pour les standards de plan attendus)
- docs/superpowers/plans/2026-06-06-slice-5-cms-authoring-avatar-capabilities.md
  (référence de densité/granularité)

## Vérifications à effectuer

### 1. CONTEXT.md
- `Entity` est présent dans "Modèle Éditorial" avec cette définition exacte :
  "Personne, organisation ou mouvement qui apparaît dans des contenus
  éditoriaux comme sujet, auteur, source ou participant. Dimension de scoring
  dans le moteur de découverte."
- `Insight` N'est PAS dans le glossaire.
- `Interaction`, `UserPreference`, `FeedSession`, `DiscoveryFeed` NE SONT PAS
  dans le glossaire.
- `Feed` reste le seul terme pour les flux (pas de `DiscoveryFeed`).
- `Bookmark` est toujours défini comme concept autonome.
- Aucun autre terme n'a été ajouté ou supprimé accidentellement.

### 2. ADR 0003
- Le statut est `Accepté` (pas `Proposé`).
- Le contenu de l'ADR est intact (rien retiré, rien modifié).

### 3. Plan Slice 6
Vérifie la conformité avec les standards de plan (CLAUDE.md) :
- Header "Read First" contient : docs/agents/mockup-to-code-map.md,
  docs/agents/ui-visual-testing.md, convex/_generated/ai/guidelines.md, CLAUDE.md.
- Chaque task Convex a une étape Vitest-first.
- Chaque task RN/UI a une étape Jest-first.
- La task de vérification finale standard est présente (tsc + tests + smoke).
- Le scope guard liste explicitement les exclusions : Entity scoring,
  WikipediaProvider, FeedSession.
- `"discover"` est ajouté comme NavigationModule dans le plan.
- Aucune couleur hardcodée n'est mentionnée ; responsive et i18n modular.

### 4. Lacunes connues du plan (à signaler, pas à bloquer)
- Les mockups dans docs/podapp/project/mobile-mockups/ ne sont pas encore
  référencés pour l'écran Discover.
- L'API de use-discovery-feed.ts n'est pas spécifiée (signatures de retour).
- Le scénario de test du mix 60/20/10/10 est vague ("roughly respected").
- La détection de visibilité des cards (onView) n'est pas spécifiée.

## Format de réponse

Pour chaque point : ✅ conforme / ❌ non conforme + explication courte.
Termine par : (1) liste des points bloquants, (2) liste des lacunes connues
à adresser avant implémentation.
```

---

## Prompt B — Enrichissement du plan Slice 6

> À exécuter après la vérification, avant l'implémentation.

```
Tu dois enrichir le plan Slice 6 du projet MediumShip SANS l'implémenter.
Ne change pas les décisions architecturales actées (voir handoff).

## Fichiers à lire en premier

- docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md (plan actuel)
- docs/superpowers/plans/2026-06-06-slice-5-cms-authoring-avatar-capabilities.md
  (référence de granularité attendue)
- docs/adr/0003-content-discovery-engine.md (décisions et interaction weights)
- docs/podapp/project/mobile-mockups/ (TOUS les fichiers — cherche un écran
  Discover, Explore étendu, ou feed de découverte)
- ../editia/mobile (cherche un pattern de détection de visibilité de card dans
  un scroll — onLayout, IntersectionObserver, useOnScreen ou équivalent)
- convex/_generated/ai/guidelines.md
- CLAUDE.md

## Ce que tu dois ajouter au plan

1. **Dans "Read First"** : référence exacte au(x) fichier(s) mockup trouvé(s)
   dans docs/podapp/ pour l'écran Discover.

2. **Dans Task 5 (Discover screen), étape 1** : description précise de l'UX
   basée sur les mockups (layout des cards, position skip/like, label reason,
   état vide, état loading, comportement sur swipe vs bouton).

3. **Dans Task 5, étape 2** : API complète de use-discovery-feed.ts —
   types de retour explicites, signatures des callbacks recordSkip/recordLike,
   gestion d'erreur, comportement guest (tokenIdentifier absent).

4. **Dans Task 3 (feed query), étape 1** : scénario de test reproductible
   pour le mix 60/20/10/10 — corpus de taille fixe (ex : 40 items), seed
   aléatoire fixe, assertions précises sur le count par bucket (±2 items).

5. **Dans Task 6 (wiring), étape 2** : pattern exact de détection de
   visibilité d'une card (hook ou utilitaire trouvé dans editia/mobile ou
   src/ existant — ne pas inventer si un pattern existe déjà).

## Contraintes

- Ne pas changer les décisions architecturales.
- Ne pas commencer l'implémentation.
- Ne pas modifier CONTEXT.md ni l'ADR.
- Suivre exactement le style et la granularité de Slice 5 comme référence.

## Commit attendu

docs(plan): enrich slice-6 discovery engine with mockups, API specs and test scenarios
```

---

## Prompt C — Implémentation Slice 6

> À utiliser APRÈS que Slice 5 est complété et le plan enrichi.

```
Implémente le plan Slice 6 du projet MediumShip task-by-task.

Lis d'abord (dans cet ordre) :
1. docs/superpowers/plans/2026-06-06-slice-6-discovery-engine.md
2. docs/adr/0003-content-discovery-engine.md
3. Tout le header "Read First" listé dans le plan
4. CLAUDE.md

Utilise le sub-skill superpowers:subagent-driven-development (recommandé)
ou superpowers:executing-plans pour exécuter task-by-task.

Règles impératives :
- Vitest-first pour tout code Convex (convex/**).
- Jest-first pour tout code RN/UI (app/, src/).
- Jamais de couleur hardcodée — tokens + withAlpha, vérifier midnight.
- Responsive via useResponsive.
- i18n modular (fichiers par écran/feature).
- Commit atomique à la fin de chaque task.
- Lire convex/_generated/ai/guidelines.md avant de toucher convex/.
```
