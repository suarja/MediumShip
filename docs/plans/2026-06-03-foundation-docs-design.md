# Design des Docs Fondatrices

Ce design définit la première couche documentaire du prototype MediumShip. L'objectif est de donner aux prochains travaux d'ingénierie un vocabulaire produit stable, un petit nombre de décisions d'architecture explicites, et une feuille de route court terme sans surspécifier l'implémentation trop tôt.

## Périmètre

- Créer un `CONTEXT.md` racine pour le domaine produit
- Enregistrer deux ADRs pour le socle technique initial et le modèle de configuration white-label
- Créer des documents `.scratch/` courts pour la roadmap et le périmètre MVP
- Traiter la vidéo comme une capacité produit de premier rang, avec ingestion YouTube et upload direct dans la trajectoire cible
- Ajouter une règle explicite imposant la consultation de `docs/convex-components-descriptions.md` avant tout build Convex custom

## Approche recommandée

Utiliser une structure single-context et des documents courts, en français, relisibles rapidement par les prochains skills. Le modèle produit doit rester stable, les décisions techniques doivent être explicites, et le périmètre MVP doit rester assez étroit pour prototyper vite.

## Direction produit

Le prototype est un socle d'application média mobile white-label pour médias indépendants et créateurs qui veulent une relation directe avec leur audience. Ce n'est pas un réseau social. Il doit supporter dès le départ les contenus éditoriaux texte, audio et vidéo, avec contrôle d'accès premium et couche réutilisable de configuration tenant/theme.

## Direction technique

Le socle par défaut est Expo, React Native, TypeScript, Convex et Clerk. Avant de construire une capacité backend sur mesure, il faut consulter l'inventaire de composants Convex maintenu dans `docs/convex-components-descriptions.md`, en particulier pour le stockage, la vidéo, le billing, les notifications, les workflows et le contrôle d'accès.
