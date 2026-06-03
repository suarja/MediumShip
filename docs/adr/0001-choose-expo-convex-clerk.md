# Choisir Expo, Convex et Clerk comme socle du prototype

Le premier prototype MediumShip sera construit avec Expo et React Native côté client, Convex comme backend principal, et Clerk pour l'authentification. Cette combinaison optimise la vitesse de livraison mobile, la boucle full-stack, et la possibilité de réutiliser des composants Convex existants pour le stockage, la vidéo, le billing, les notifications, les workflows et d'autres capacités backend.

## Options Considérées

- Expo + Convex + Clerk
- Expo + Supabase + Clerk
- Expo + backend Node custom + Postgres

## Conséquences

- On gagne une boucle de prototypage rapide et un backend qui peut rester compact grâce à la réutilisation de composants Convex maintenus.
- On accepte une dépendance à l'écosystème Convex et il faudra valider la maturité des composants avant d'en faire des dépendances structurantes.
- Les décisions liées à l'auth, au stockage, à la vidéo et à la monétisation doivent être confrontées à `docs/convex-components-descriptions.md` avant tout build custom.
