# Knowly — Fiche technique (contre-expertise)

**Statut :** spécification interne · document « sévère » pour stress-test avant store et avant pitch B2B  
**Dernière mise à jour :** 7 juin 2026  
**Socle :** MediumShip (`apps/mobile`, `convex/`, `apps/cms`) · produit **Knowly** (B2C store)

**Proposition utilisateur (B2C) :** [fiche-client.md](./fiche-client.md)  
**Stratégie dual produit :** [README.md](./README.md)

> Ce document décrit ce qui **existe**, ce qui est **prévu**, et ce qui est **sur-vendu si on n’y prend pas garde**. Public : équipe produit et tech — pas le téléchargeur de l’app.

---

## 0. Modèle produit (rappel interne)

Knowly est un **produit B2C** visant les stores, pas un slide deck pour vendre du white-label.

| Dimension | Knowly | MediumShip (white-label) |
| --------- | ------ | ------------------------ |
| Cible | Utilisateur final | Créateur / média |
| Succès | Downloads, rétention, reviews | Contrats, time-to-market client |
| Livrable | App « Knowly » sur les stores | App à la marque du client |
| Lien | Partage le moteur discovery ; **prouve** la techno si traction | Reçoit le même moteur, autre tenant |

Ne pas rédiger la fiche client comme un pitch créateur. Ne pas pitcher Knowly aux créateurs comme s’ils achetaient Knowly.

---

## 1. Périmètre exact

### 1.1 Ce que « Knowly » désigne techniquement

| Couche | Nature | Réutilisable white-label ? |
| ------ | ------ | -------------------------- |
| **MediumShip core** | Expo Router, thème, i18n, auth Clerk, Convex, modules FeatureCatalog | Oui — c’est le template |
| **Content Discovery Engine** | Module backend + écran Découvrir + signaux d’engagement | Oui — provider-agnostic |
| **Skin & copy Knowly** | ThemeConfig, taxonomie, ASO store, positionnement « Gleeph des idées » | Produit B2C — pas réutilisé tel quel par un client |
| **Providers branchés** | Wikipedia + YouTube (démo) ; podcast, blogs, Substack (roadmap) ; CMS tenant (client) | Configurables par tenant |

**Knowly n’est pas un repo séparé.** C’est un **produit configuré** (marque, corpus, store listing) sur le monorepo MediumShip — une « démo qui va au bout », publiable en store.

**Effet vitrine B2B** : traction Knowly (users, presse) facilite la vente MediumShip ; ce n’est pas le objectif de la fiche client ni le message store.

### 1.2 Ce que Knowly prétend être vs. ce que le code garantit

| Affirmation marketing | Garantie technique actuelle | Écart |
| --------------------- | --------------------------- | ----- |
| « Le Gleeph des idées » | Profil de goût + bookmarks + feed adaptatif multi-format | Pas de catalogue « idée » aussi structuré que ISBN ; dépend de la qualité des providers |
| « Encyclopédie + exploration » | Wikipedia provider + taxonomie catégories ; corps article partiel en démo | Immersion article complète = slice ultérieur |
| « Algorithme qui personnalise » | Scoring pondéré + affinités par catégorie/tag/entité (v1 rule-based, modèle Gleeph/Xikipedia) | Pas de collaborative filtering ni embeddings en prod |
| « Multi-sources (YT, wiki, podcast…) » | **YouTube + Wikipedia** branchés ou en cours ; podcast/blogs/Substack **non livrés** | Ne pas démo-tricher : annoncer le périmètre provider réel |
| « Réseau social plus tard » | Zéro graphe social, follow, activity feed en v1 | OK si le pitch dit explicitement **hors scope v1** |
| « Anti doom scroll » | Signaux `open`/`finish` encouragent la profondeur ; scroll infini par design | Risque : remplacer une addiction par une autre — mitiger par `finish` et masquage |

---

## 2. Architecture système

```
┌─────────────────────────────────────────────────────────────┐
│  apps/mobile (Expo / React Native)                          │
│  ├─ (app)/discover.tsx        ← surface Knowly (démo)       │
│  ├─ article|episode|video/[id] ← émission signaux engagement│
│  └─ src/features/discovery/   ← hooks client feed           │
└──────────────────────────┬──────────────────────────────────┘
                           │ Convex queries / mutations
┌──────────────────────────▼──────────────────────────────────┐
│  convex/discovery/                                            │
│  ├─ feed.ts          pagination + recycle continu             │
│  ├─ scoring.ts       Affinity, ScoringPolicy, interactions  │
│  ├─ interactions.ts  recordInteraction (guest no-op)        │
│  ├─ engagement.ts    règles open/finish par ContentKind     │
│  ├─ refill.ts        ingestion à la demande                 │
│  └─ providers/*      adapters (wikipedia, youtube, cms…)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  apps/cms (Next.js) — mono-tenant interne, authoring        │
└─────────────────────────────────────────────────────────────┘
```

**Décisions figées (ADR)** :

- [`0002`](../../adr/0002-white-label-configuration-model.md) — config tenant séparée du core
- [`0003`](../../adr/0003-content-discovery-engine.md) — moteur discovery hexagonal (ports/adapters)
- [`0004`](../../adr/0004-aggregation-engine.md) — agrégation multi-sources
- [`0008`](../../adr/0008-feature-catalog-and-access-model.md) — FeatureCatalog + AccessLevel

---

## 3. Modèle de données (résumé opérationnel)

### 3.1 ContentItem (canonique)

Tout provider normalise vers un `ContentItem` :

- `type` : `article` | `video` | `episode` | `wiki_article` (démo)
- `categoryIds`, `tagIds`, `entityIds`
- `access` : `free` | `member` | `premium`
- `status` : `draft` | `published` | `archived`

### 3.2 Signaux d’interaction (v1)

| Signal | Émission | Poids typique | Notes |
| ------ | -------- | ------------- | ----- |
| `view` | Carte visible dans le feed | Faible | Bruit élevé — ne pas sur-pondérer |
| `open` | Montage écran détail | Fort | Signal principal d’intérêt |
| `finish` | Lecture/écoute ≥ 90 % ou scroll fin article | Très fort | Proxy « compréhension » |
| `like` | Action explicite | Moyen | Optionnel en démo |
| `hide` | Masquer | Négatif | Anti-bulle |
| `skip` | Passage rapide | Négatif léger | |
| `bookmark` | Membre authentifié | Fort | Nécessite Convex auth |

**Règle critique (bug documenté)** : `useClerkAuth().isSignedIn` ≠ `useConvexAuth().isAuthenticated`. Les écritures protégées utilisent **`useConvexAuth()`** uniquement.

### 3.3 Profil de préférences (Preference Layer)

Structure cible (ADR 0003) :

- scores par `category`, `tag`, `entity`, `source`, `contentType`
- recalcul déterministe à partir des interactions
- **inspectable** — pas de boîte noire en v1

Politique de mélange feed (inspirée Xikipedia, tunable) :

- ~40 % sélection pondérée par score
- ~42 % meilleur score candidat
- ~18 % sélection aléatoire (serendipité)

---

## 4. Comportement du feed (exigences & pièges)

### 4.1 Continuité (Slice F)

- Le feed **ne doit pas dead-end** sur « vous êtes à jour » tant qu’un corpus existe.
- Mécanisme : pool non-vus d’abord, puis **recyclage** avec sub-seed pour reshuffle.
- **Interdit côté client** : reset du curseur (historique de boucle infinie — voir tests `use-discovery-feed`).

### 4.2 Adaptation

- Sans `open`/`finish` wireés, le feed **ne peut pas** s’adapter — c’était un défaut réel corrigé par Discovery Slice F.
- La démo Knowly **échoue** si on montre uniquement like/skip.

### 4.3 Guest-first

- Lecture publique du feed : **sans Clerk**.
- Interactions persistantes (bookmark, profil) : membre + Convex auth.
- La démo doit fonctionner en invité ; l’adaptation membre est le upsell naturel.

---

## 5. Stack & contraintes non négociables

| Composant | Choix | Implication Knowly |
| --------- | ----- | ------------------ |
| Mobile | Expo SDK, React Native, TypeScript | iPhone + iPad first-class |
| Backend | Convex | Temps réel, pas de second backend |
| Auth | Clerk (membre) | Pas d’auth pour invité |
| Thème | `theme.colors.*`, `palette-catalog.ts` | **Zéro couleur hardcodée** — même pour skin Knowly |
| i18n | Fichiers modulaires par feature | Copy Knowly = namespace dédié, pas monolithe |
| Tests | Jest (`app/`, `src/`), Vitest (`convex/`) | Toute règle backend = test Vitest |

---

## 6. Providers & corpus démo

### 6.1 État actuel (démo Knowly)

| Provider | Statut | Format | Rôle |
| -------- | ------ | ------ | ---- |
| **Wikipedia** | Branché / démo | Texte encyclopédique | Prouver exploration + algo sans corpus client ; ADR 0003 |
| **YouTube** | Branché / en cours | Vidéo | Idées en vidéo ; ADR 0009 |

### 6.2 Roadmap providers (prévu, non engagé)

| Provider | Format | Incertitude |
| -------- | ------ | ----------- |
| **Podcast / RSS** | Audio (`episode`) | Flux RSS standard — faible |
| **Blog / flux texte** | `article` | Parsing et normalisation à définir |
| **Substack** (ou équivalent) | Newsletter / texte long | API, ToS, flux — **à valider** |
| **CMS tenant** | Tous | Source primaire client white-label |

Tous les providers implémentent le même port `Provider` (architecture hexagonale ADR 0003) ; aucun code métier discovery ne doit être couplé à Wikipedia ou YouTube.

### 6.3 Risques par source

- **Wikipedia** : licence CC BY-SA — attribution obligatoire ; feed « trop encyclo » si c’est la seule source montrée.
- **YouTube** : ToS embed/API ; pas d’offline sur `YouTubeVideo` (décision architecture MediumShip).
- **Substack / blogs** : droits, paywalls, fragilité des flux — ne pas promettre avant spike technique.
- **CMS tenant** : mono-tenant interne aujourd’hui — pas de self-service multi-tenant.

---

## 7. Ce qui manque pour une vente « production »

Checklist **honête** — ne pas présenter comme fait :

| Capacité | État | Bloquant commercial ? |
| -------- | ---- | ----------------------- |
| Feed continu + adaptation | En cours / partiel selon slices mergées | **Oui** pour crédibilité Knowly |
| Onboarding intérêts (catégories) | Slice planifié (I/J) | Moyen — améliore cold start |
| Article immersion (corps complet + liens) | Hors scope Slice F | Moyen pour vertical « lecture » |
| Embeddings / ML | Non-objectif v1 | Non si on assume rule-based |
| Couche sociale (follow, activity) | **Hors scope v1** — roadmap ultérieure | Non si pitch = Gleeph des idées |
| Providers podcast / blog / Substack | Planifiés, non livrés | Moyen pour pitch multi-format complet |
| Multi-tenant SaaS | Non-objectif | Oui pour scale, non pour 1er client |
| Offline premium | Roadmap MediumShip | Non pour démo feed |
| Analytics / A-B scoring | Absent | Oui pour optimiser rétention post-launch |
| Modération contenu | Basique via CMS | **Oui** si UGC ou sources ouvertes |

---

## 8. Risques techniques & produit (registre sévère)

### R1 — Sur-promesse « intelligence »

**Risque** : le client croit à un GPT curator.  
**Réalité** : scoring linéaire + hasard.  
**Mitigation** : transparence, écran « pourquoi ce contenu », tunables CMS.

### R2 — Bulle de filtre malgré le hasard

**Risque** : 18 % random insuffisant si affinités trop agressives.  
**Mitigation** : `ScoringPolicy` par tenant, plancher de diversité, injection éditoriale.

### R3 — Scroll infini = addiction

**Risque** : contradiction avec « anti doom scroll ».  
**Mitigation** : métriques `finish`/session, pas `view`/session ; UX de pause (hors scope v1).

### R4 — Corpus vide ou pauvre

**Risque** : feed recycle 12 articles — ridicule en démo.  
**Mitigation** : seuil minimum de contenu avant launch client ; providers externes.

### R5 — Dépendance Convex

**Risque** : single point of failure, vendor lock-in perçu.  
**Mitigation** : ADR résilience = dégradation gracieuse + cache local (roadmap) ; honnêteté commerciale.

### R6 — Clerk ≠ Convex auth

**Risque** : bookmarks / interactions membres silencieusement ignorées.  
**Mitigation** : tests d’intégration, doc [`docs/bugs/2026-06-07-clerk-vs-convex-auth-member-writes.md`](../../bugs/2026-06-07-clerk-vs-convex-auth-member-writes.md).

### R7 — Confusion Knowly / MediumShip

**Risque interne** : mélanger les pitches B2C et B2B ; un créateur croit qu’il achète Knowly, ou un user croit que Knowly deviendra « son » média.  
**Mitigation** : [README.md](./README.md) + fiches séparées ; contrats B2B nomment **MediumShip / tenant client**, jamais la marque Knowly.

### R8 — AGPL Xikipedia

**Risque** : réutilisation de code Xikipedia sans compliance.  
**Mitigation** : inspiration algorithmique uniquement — **pas de copier-coller** du repo AGPL.

---

## 9. Critères d’acceptation — publication store (Definition of Done)

Knowly est **honestement publiable en store** (ou en TestFlight ouvert) si et seulement si :

1. **Invité** : scroll 5 min sur iPhone + iPad sans crash, sans écran vide inexpliqué.
2. **Adaptation** : après 3+ `open` dans la même catégorie, pull-to-refresh → catégorie plus présente (test manuel + tests automatisés scoring).
3. **Continuité** : pas de dead-end « à jour » avec corpus non vide.
4. **Profondeur** : écran détail émet `open` ; article/épisode/vidéo émet `finish` selon règles `engagement.ts`.
5. **Store** : fiche App Store / Play cohérente avec [fiche-client.md](./fiche-client.md) (pas de promesse sociale ou provider non livré).
6. **Qualité** : `npm test` + `npm run test:convex` + `tsc` verts sur la branche release Knowly.
7. **Visuel** : smoke pixel-level phone + tablet (`docs/agents/ui-visual-testing.md`).
8. **Vitrine B2B (optionnel)** : si traction, métriques documentées pour pitch MediumShip — pas un critère bloquant store.

---

## 10. Plan de charge minimal (ordre de grandeur)

Pour passer de « template MediumShip » à « Knowly en store » :

| Lot | Contenu | Dépendances |
| --- | ------- | ----------- |
| **A** | Discovery slices mergés (E, F, signaux) | Backend + mobile |
| **B** | Skin Knowly (ThemeConfig, copy i18n, icône) | A stable |
| **C** | Corpus démo curated (CMS + évent. Wikipedia) | B |
| **D** | Script démo 3 min + capture vidéo | C |
| **E** | Onboarding intérêts (cold start) | Optionnel v1 démo |

**Estimation honnête** : la démo narrative est surtout du **B+C+D** si A est livré ; sinon A domine.

---

## 11. Questions ouvertes (à trancher avant 1er RDV client)

1. **Corpus démo** : Wikipedia seul suffit-il, ou faut-il un mini-corpus éditorial propriétaire (meilleur pour le pitch créateur) ?
2. **Métrique succès démo** : temps de session, taux `finish`, NPS, ou conversion RDV ?
3. **Premium en démo** : montrer paywall ou rester 100 % gratuit pour réduire friction ?
4. **Positionnement légal** : claims « plus intelligent » — validation copy / pas d’allégation santé cognitive ?
5. **Premier vertical client post-Knowly** : média, éducateur, ou podcast — influence priorité providers (YouTube vs RSS).

---

## 12. Mapping compétitif technique

| Référence | Ils ont | Nous avons (v1) | Nous n’avons pas (v1) |
| --------- | ------- | --------------- | --------------------- |
| **Gleeph** | Bibliothèque livres, profil de goût, reco, (réseau lecteurs) | Bibliothèque idées, profil de curiosité, feed adaptatif multi-format | Base ISBN / scan ; dimension sociale lecteurs |
| **Xikipedia** | Feed wiki, scoring transparent | Même esprit scoring + **white-label** + YouTube | Codebase AGPL ; wiki seul |
| **Wikipédia** | Encyclopédie exhaustive | Encyclo **+ personnalisation** | Pas l’ambition d’être une encyclopédie |
| **YouTube** | Vidéo infinie, algo opaque | Vidéo + texte/audio unifiés, signaux `finish` | Scale catalogue YouTube |
| **Réseaux sociaux** | Graphe, viralité | — (volontairement absent v1) | Follow, DM, feed activity — **plus tard** |

---

## 13. Sécurité & conformité (minimum avant prod client)

- Authz Convex sur toutes mutations membres
- Validation arguments sur fonctions publiques Convex
- Pas de secrets dans le repo mobile
- Attribution licences contenus tiers (Wikipedia, YouTube ToS)
- RGPD : export/suppression compte — **à spécifier** avant EU scale
- App Store : guidelines contenu généré / curated — revue si UGC

---

## 14. Références code & docs

| Sujet | Chemin |
| ----- | ------ |
| ADR Discovery Engine | `docs/adr/0003-content-discovery-engine.md` |
| Feed adaptatif continu | `docs/superpowers/plans/2026-06-07-discovery-slice-f-adaptive-continuous-feed.md` |
| Architecture globale | `docs/plans/2026-06-03-mediumship-architecture-design.md` |
| Guest-first | `docs/superpowers/plans/2026-06-03-guest-first-public-read-model.md` |
| README stratégie | `docs/demos/knowly/README.md` |
| Proposition utilisateur B2C | `docs/demos/knowly/fiche-client.md` |
| Contexte domaine | `CONTEXT.md` |

---

## 15. Verdict interne (à relire avant chaque pitch)

**Forces réelles** : socle white-label crédible, moteur discovery différenciant sur un marché de catalogues, architecture provider-agnostic déjà pensée, démo verticale possible sans fork.

**Faiblesses réelles** : pas un réseau social, pas de ML impressionnant, dépendance à la qualité du corpus client, risque narratif « anti doom scroll » vs scroll infini technique.

**Règle d’or** : vendre **le Gleeph des idées** — exploration encyclopédique + bibliothèque + algorithme — pas un réseau social déguisé.
