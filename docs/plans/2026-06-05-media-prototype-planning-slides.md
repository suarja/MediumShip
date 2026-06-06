# Media Prototype Planning Slides

## Goal

Document de cadrage plus détaillé pour la prochaine phase du prototype
`Média`, en restant aligné avec la maquette mobile HTML et la réalité actuelle
de la codebase.

Le but de ce document n'est pas de décrire chaque tâche technique ligne par
ligne, mais de fixer :

- les arbitrages produit maintenant validés
- la structure écran par écran
- la logique d'hydratation recommandée
- les dépendances CMS / mobile / Convex
- le découpage en slices pour les futurs agents d'implémentation

---

## Slide 1 — Scope retenu

Cette phase reste centrée sur la démo `Média`, pas sur la verticale
`Présidentielle 2027`.

Entrent dans le scope :

- navigation cible en `4 tabs`
- `Explorer`
- `Bibliothèque`
- `Profil`
- paywall contextuel en bottom sheet
- `Collections` éditoriales
- `Agenda` en liste simple
- détail d'événement simple
- `Communauté`
- logique CMS pour créer une collection et y rattacher des contenus
- cadrage des données et de l'hydratation des écrans

Hors scope explicite pour cette phase :

- notifications
- worktree dédié
- social natif interne
- moteur de recherche avancé

---

## Slide 2 — Arbitrages figés

Arbitrages à considérer comme verrouillés pour la suite de planification :

- `bookmark = gratuit`
- `agenda = simple liste V1`
- `notifications = hors scope`
- `premium` n'est plus un onglet fixe
- le paywall apparaît au moment où l'utilisateur touche une capacité premium
- `Collections éditoriales` et `Listes personnelles` sont deux objets
  différents
- la démo de référence reste la maquette mobile dans
  `docs/podapp/project/mobile-mockups/`

Arbitrages prudents à garder dans le document :

- le profil doit permettre le changement d'avatar
- l'édition du nom n'est pas traitée comme exigence prioritaire dans cette
  phase tant que la règle métier n'est pas clarifiée

---

## Slide 3 — Navigation cible

Navigation cible :

- `Accueil`
- `Explorer`
- `Bibliothèque`
- `Profil`

Cela suit directement la recommandation de la maquette V2 :

- lecture publique sans compte
- connexion juste-à-temps sur les fonctions membres
- `Agenda`, `Communauté` et `Collections` rangés sous `Explorer`
- plus d'onglet `Premium` fixe

Conséquence produit :

- `Accueil` sert la consommation
- `Explorer` sert la découverte et les modules éditoriaux
- `Bibliothèque` sert les usages personnels
- `Profil` sert l'identité, le statut membre et les préférences

Conséquence technique :

- la tab bar actuelle doit être restructurée
- `settings` devient une destination poussée depuis `Profil`, pas un tab root
- l'écran `premium` actuel devient une surface réutilisable ou disparaît au
  profit du paywall sheet

---

## Slide 4 — Contrat d'hydratation global

Hydratation globale recommandée au boot :

- config tenant via `tenants`
- modules activés
- palette active
- sections du home
- incident status externe

Hydratation publique commune :

- contenus publiés via Convex
- catégories déduites ou explicitement modélisées
- collections éditoriales publiées
- événements publiés si module agenda actif
- liens communauté si module communauté actif

Hydratation membre conditionnelle :

- bookmarks si utilisateur connecté
- progression sync si utilisateur connecté
- offline local si membre premium
- listes personnelles si premium

Règle de rendu :

- ne pas lancer les queries membre tant que l'écran est en mode invité
- rendre les états invités directement au niveau route/screen
- n'hydrater les briques personnelles qu'après résolution auth + membership

---

## Slide 5 — Accueil

Rôle produit :

- point d'entrée public
- consommation rapide
- mise en avant éditoriale
- ponts vers `Explorer`

Contenu recommandé :

- hero éditorial
- rails par format ou section CMS
- bloc `Collections éditoriales`
- éventuellement un aperçu `Agenda` si module activé

Hydratation :

- query publique de feed publiée
- tri selon `tenant.feedSections`
- filtrage selon modules activés
- mapping UI via les selectors de contenu existants

Ce qui existe déjà :

- query publique `listPublishedFeed`
- feed multi-format
- détails article / épisode / vidéo

Ce qu'il manque :

- bloc `Collections`
- articulation plus nette avec `Explorer`
- éventuel rail `Agenda`

---

## Slide 6 — Explorer

Rôle produit :

- découverte
- recherche
- navigation par catégories
- entrée vers modules éditoriaux secondaires

Contenu V1 recommandé :

- barre de recherche
- grille ou liste de catégories
- entrée `Collections`
- entrée `Agenda`
- entrée `Communauté`
- éventuellement tendances / tags populaires

### Search

Pour V1, la recommandation pragmatique est :

- recherche Convex simple, sans moteur externe
- recherche texte sur `title`, `summary`, `tags`, `category`, `slug`
- recherche multi-type sur :
  - contenus `article / episode / video`
  - `collections`
  - `events`
- scope limité aux objets publiés du tenant actif

Pourquoi :

- volume encore faible
- coût d'implémentation faible
- suffisant pour la démo et les premiers tenants

Approche recommandée :

- ajouter une query dédiée de recherche publique
- côté UI, déclenchement debounced
- résultat unique multi-format
- filtres simples `all / content / collections / events`

À ne pas faire maintenant :

- search provider externe
- ranking avancé
- search dans notifications
- recherche sur les surfaces communauté

---

## Slide 7 — Bibliothèque

Rôle produit :

- regrouper tous les usages personnels
- isoler clairement ce qui appartient à l'utilisateur

Structure V1 recommandée :

- état invité avec page de login juste-à-temps
- bloc `Reprendre`
- bloc `Enregistrés`
- bloc `Mes listes`
- bloc `Hors-ligne`

Règles d'accès :

- `Reprendre` : membre connecté
- `Enregistrés` : gratuit, nécessite un compte
- `Mes listes` : premium
- `Hors-ligne` : premium

Décision de simplification V1 :

- `Sauvegarder` et `Lire ensuite` sont traités comme une seule primitive :
  `bookmark / enregistrer`
- pas de seconde file ou d'objet séparé tant que la maquette n'impose pas un
  comportement distinct

Hydratation :

- invité : aucun fetch personnel, écran gate direct
- connecté non premium :
  - bookmarks
  - progression sync
  - pas d'offline
  - `Mes listes` en état verrouillé premium
- premium :
  - bookmarks
  - progression sync
  - offline local
  - listes personnelles

Note de logique :

- l'écran `Bibliothèque` doit devenir la maison naturelle des sections qui
  vivent aujourd'hui surtout dans `Profil`

---

## Slide 8 — Profil

Rôle produit :

- identité
- statut membre
- préférences
- accès aux réglages
- gestion du compte

Contenu recommandé :

- hero profil
- avatar
- statut invité / membre / premium
- raccourci settings
- actions abonnement / membre
- résumé usage léger

Exigence explicite à ajouter :

- l'utilisateur doit pouvoir changer son avatar

Implication technique :

- surface de modification d'avatar côté mobile
- mutation utilisateur côté Convex
- source de vérité `users.avatarUrl`
- idéalement upload ou URL d'image selon le slice retenu

Ce qui peut rester hors de cette phase :

- édition complète du profil
- édition du nom si non prioritaire

Hydratation :

- utilisateur Clerk stable
- `getMe` Convex pour les champs persistés
- fusion d'affichage Clerk / Convex avec priorité au champ applicatif si défini

---

## Slide 9 — Paywall contextuel

Rôle produit :

- remplacer l'onglet `Premium`
- rendre le premium contextuel et compréhensible

Cas de déclenchement V1 :

- ouverture d'un contenu premium
- tentative de téléchargement offline
- tentative d'ouverture du salon membres
- tentative d'usage des listes premium

Règle d'expérience :

- le paywall n'interrompt pas la lecture publique gratuite
- il ne s'ouvre que sur les fonctions ou contenus verrouillés

Copie recommandée selon contexte :

- `contenu premium`
- `offline premium`
- `listes premium`
- `salon membres premium`

Implication technique :

- composant sheet unique
- payload de contexte
- rendu de variantes par raison

---

## Slide 10 — Collections éditoriales

Définition :

- objet éditorial créé par la rédaction
- groupe plusieurs contenus
- peut servir de série, dossier, parcours ou package

Ne pas confondre avec :

- liste personnelle utilisateur

Surface mobile V1 :

- index des collections
- détail d'une collection
- liste de contenus rattachés
- éventuellement progression utilisateur dans la collection plus tard

Hydratation mobile :

- query publique `listPublishedCollections`
- query publique `getPublishedCollectionById`
- query publique ou assemblée pour récupérer les contenus de la collection

Décision importante :

- le contrat CMS des collections fait partie de cette phase de roadmap
- l'implémentation peut rester en deux temps :
  - temps 1 : modèle de données + logique CMS minimale
  - temps 2 : polish UI et usages avancés
- on ne traite pas les collections comme un sujet purement mobile ou purement
  fixture-only

---

## Slide 11 — CMS collections

Le CMS doit permettre au minimum :

- créer une collection
- modifier son titre, slug, summary, cover
- définir son statut `draft / published / archived`
- ajouter des contenus existants à la collection
- réordonner les contenus d'une collection
- retirer un contenu d'une collection

Flux recommandé côté CMS :

1. créer la collection
2. sauvegarder ses métadonnées
3. rechercher des contenus existants
4. ajouter un contenu à la collection
5. ordonner la collection
6. publier

Recommandation de modélisation :

- table `collections`
- table de jointure ordonnée `collectionItems`

Pourquoi ne pas mettre une simple liste d'ids dans `collections` :

- ordre à maintenir proprement
- meilleure extensibilité
- évite les tableaux à forte mutation dans un seul document
- permet d'ajouter plus tard du metadata par item si besoin

---

## Slide 12 — Agenda

Position produit :

- module de découverte sous `Explorer`
- pas un produit calendrier complet

V1 retenue :

- simple liste d'événements
- détail d'événement simple

Champs recommandés pour V1 :

- title
- summary
- startsAt
- locationLabel
- externalUrl ou communityUrl
- access `free | member | premium`
- mode `online | offline | hybrid`
- status `scheduled | archived`
- coverImageUrl optionnelle
- body ou descriptionLong optionnelle
- ctaLabel optionnel
- ctaUrl optionnelle

Hydratation mobile :

- query publique `listPublishedEvents`
- query publique `getPublishedEventById`
- filtres simples `a venir / en ligne / local`

CMS minimal associé :

- créer un événement
- éditer métadonnées, date, lieu/lien, accès, statut
- publier / archiver
- rattacher éventuellement un lien communauté ou un lien externe

Rendu recommandé :

- la liste montre date, titre, format, accès et lieu/lien
- le détail montre header, description, informations pratiques, badge d'accès
- CTA principal :
  - ouvrir le lien de l'événement
  - rejoindre la communauté liée
  - ou rappeler que l'accès est membre / premium

Ce qu'il ne faut pas faire en V1 :

- vue calendrier
- RSVP complexe
- reminders / notifications
- état de participation dans l'app

---

## Slide 13 — Communauté

Position produit :

- pont vers des surfaces externes
- pas de communauté native interne

V1 retenue :

- hero `Rejoindre la communauté`
- carte Discord communautaire gratuite
- carte `Salon membres` premium
- 1 ou 2 blocs additionnels descriptifs ou externes sur la structure
  communautaire

Hydratation :

- configuration tenant ou module dédié
- pas besoin d'un modèle complexe en V1

Approche recommandée :

- `communityLinks` bornés par schéma
- quelques types supportés : `discord`, `telegram`, `whatsapp`, `newsletter`
- possibilité d'exposer aussi des blocs de structure `salons`, `cercles`,
  `membres` sans logique sociale native

Important :

- le `Salon membres` peut être une simple destination premium
- pas besoin d'implémenter le chat dans l'app

---

## Slide 14 — Search, catégories, taxonomie

La maquette pousse trois entrées de découverte :

- catégories
- collections
- tendances / sujets

Recommandation V1 :

- garder `category` comme axe principal de navigation
- garder `tags` pour les tendances et le search
- ne pas introduire une taxonomie trop sophistiquée tout de suite

Hydratation possible :

- catégories dérivées des contenus publiés au départ
- ou table dédiée plus tard si l'éditorial veut des catégories vides / ordonnées

Décision pragmatique :

- commencer par catégories dérivées si vous voulez aller vite
- passer à une table `categories` si le CMS a besoin d'ordre, d'icônes ou de
  description

---

## Slide 15 — Modèle de modules

État actuel :

- `enabledModules` côté tenant reste trop grossier
- il couvre surtout formats publics + `premium`
- le prototype introduit un besoin plus explicite de pilotage des
  modules/fixtures

La maquette CMS vise en réalité deux niveaux :

- modules visibles
- règles d'accès par feature

Évolution recommandée :

- conserver un niveau de config borné
- distinguer :
  - modules de navigation / présence produit
  - capacités et règles d'accès

Exemples :

- modules : `explore`, `agenda`, `community`, `editorialCollections`
- capabilities : `bookmarks`, `progressSync`, `offline`, `personalLists`,
  `membersRoom`

Note :

- la roadmap doit contenir explicitement un chantier `module system`
- ce chantier vient du prototype CMS et de son pilotage des modules/fixtures
- l'implémentation pourra conclure soit à une vraie table `Module`, soit à une
  config tenant enrichie
- mais ce sujet doit être traité comme un vrai axe de convergence codebase /
  prototype, pas comme un détail secondaire

---

## Slide 16 — Hydratation par écran

### Accueil

- public
- `tenant settings`
- `published feed`
- sections CMS

### Explorer

- public
- `search results` selon query
- résultats multi-type `content / collections / events`
- catégories
- collections
- événements
- navigation liste événement -> détail événement
- communauté

### Bibliothèque

- invité : rendu gate direct
- connecté :
  - bookmarks
  - progression
- premium :
  - bookmarks
  - progression
  - offline
  - listes

### Profil

- `Clerk user`
- `users.getMe`
- statut membre
- avatar actuel
- settings / sign-out / premium CTA

### Paywall

- pas de query lourde
- simple payload contextuel + état auth/membership

---

## Slide 17 — Slices d'implémentation recommandées

### Slice 1 — App shell cible

- nouvelle tab bar `4 tabs`
- suppression de l'onglet `Premium`
- `settings` poussé depuis `Profil`

### Slice 2 — Bibliothèque

- route dédiée
- état invité
- extraction des briques personnelles aujourd'hui dispersées dans `Profil`
- `bookmark = gratuit`
- `sauvegarder / lire ensuite = bookmark`

### Slice 3 — Paywall contextuel

- bottom sheet commune
- déclenchement depuis contenus premium / offline / salon membres / listes

### Slice 4 — Explorer V1

- catégories
- recherche simple
- recherche multi-type `content / collections / events`
- collections
- agenda liste
- détail d'événement simple
- communauté

### Slice 5 — Collections + module system + CMS minimal

- modèle Convex des collections
- création et édition dans le CMS
- rattachement et ordre des contenus
- chantier `module system` issu du prototype CMS
- prise en compte du pilotage modules / fixtures

### Slice 6 — Avatar edit

- mutation utilisateur
- surface mobile simple
- persistance Convex

---

## Slide 18 — Recommandations pour les futurs agents

- toujours lire la maquette mobile HTML avant implémentation
- utiliser le skill `frontend-design` dans les prompts d'implémentation
- privilégier des slices verticales testables
- ne pas réintroduire un onglet `Premium`
- ne pas traiter `Collections éditoriales` et `Listes personnelles` comme un
  même objet
- ne pas embarquer `notifications` dans cette phase
- ne pas surconstruire le modèle de recherche avant validation du besoin réel

---

## Final recommendation

L'ordre recommandé est :

1. app shell `4 tabs`
2. `Bibliothèque`
3. paywall sheet
4. `Explorer` + `Agenda` + `Communauté`
5. collections + module system + CMS minimal
6. avatar edit

Cet ordre permet :

- de faire converger rapidement l'IA et la navigation
- d'exposer vite les parcours invité / membre / premium
- de rendre `Explorer` cohérent avec la recherche, les collections et les
  événements dès V1
- d'absorber explicitement le besoin `modules / fixtures` introduit par le
  prototype CMS
- d'embarquer `Agenda` sans dériver vers un produit calendrier complet
- de garder le produit testable à chaque étape
