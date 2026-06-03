# Roadmap

## Phase 0 - Fondation documentaire

- Finaliser `CONTEXT.md`
- Enregistrer les premiers ADRs
- Verrouiller le périmètre MVP et le vocabulaire cœur
- Garder l'inventaire de composants Convex comme entrée obligatoire de conception

## Phase 1 - Squelette app et backend

- Initialiser l'app shell Expo
- Installer et configurer Convex
- Installer et configurer Clerk
- Définir le premier modèle tenant et configuration de thème
- Ajouter routing, primitives de layout et tokens de thème

## Phase 2 - Expérience éditoriale cœur

- Modéliser `Content`, `Article`, `Episode`, `Video`, `Collection`, `Category` et `Tag`
- Construire le feed d'accueil
- Construire le détail article
- Construire le détail épisode avec lecture audio basique
- Construire le détail vidéo avec un premier parcours crédible de bout en bout

## Phase 3 - Fondation vidéo et accès

- Évaluer les composants Convex pour Cloudflare R2, Mux et les métadonnées YouTube
- Décider le premier chemin d'ingestion vidéo : YouTube-first, upload direct d'abord, ou les deux de manière limitée
- Ajouter les états premium, les points d'entrée du paywall et les checks d'entitlement
- Préparer des flux de publication déclenchables par notifications

## Phase 4 - Finition prototype

- Ajouter profil et contenus sauvegardés
- Raffiner le theming white-label
- Intégrer progressivement les exports design livrés
- Reserrer les états loading, empty et gated

## Tâches Candidates

- Comparer RevenueCat et Stripe pour le premier chemin de monétisation
- Décider si la vidéo hébergée démarre avec R2 seul ou une pipeline vidéo plus riche
- Définir le workflow éditorial back-office minimum viable
- Choisir la première narration de tenant de démo et la direction visuelle

## Principales Incertitudes

- Profondeur de l'intégration YouTube dans le premier prototype
- Arbitrage entre complexité de l'upload direct et valeur démo
- Quels composants Convex doivent être traités comme accélérateurs de prototype versus choix d'architecture durables
