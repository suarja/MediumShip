# Périmètre MVP

## Dans le scope

- Fondation app Expo
- Base React Native + TypeScript
- Setup backend Convex
- Authentification Clerk
- Configuration tenant et tokens de thème
- Feed d'accueil avec cartes de contenus mixtes
- Détail article
- Détail épisode de podcast
- Lecture audio basique
- Support vidéo comme capacité de premier rang
- Au moins un parcours vidéo basé sur YouTube
- Modèle de données prêt pour de la vidéo hébergée en upload direct
- Écran premium mock et états de contenu gated
- Écran profil
- Intégration progressive d'exports design externes

## Explicitement reporté

- Paiement complet prêt production
- Travail de publication App Store
- Téléchargement offline
- Back-office éditorial complet
- Analytics avancés
- Commentaires et likes internes
- Couche de communauté interne native
- Search avancée
- Pipeline d'import YouTube automatisée au-delà du premier scope validé
- Isolation multi-tenant prête production

## Notes

- La vidéo est obligatoire pour la crédibilité produit et ne peut pas être traitée comme du polish optionnel.
- Avant toute implémentation backend custom, vérifier `docs/convex-components-descriptions.md` pour identifier un composant Convex existant.
- L'upload direct fait partie de la direction cible du produit même si le premier prototype commence par un chemin YouTube plus étroit.
