# Séparer le cœur produit de la configuration tenant

MediumShip doit modéliser séparément le cœur produit réutilisable et la configuration spécifique à chaque tenant. L'identité du tenant, les tokens de thème, les modules activés et certaines surfaces éditoriales doivent être représentés comme de la configuration autour d'un domaine stable de contenu et d'accès, plutôt que comme des forks du produit.

## Options Considérées

- Cœur produit stable plus configuration tenant
- Branching par client et customisation codée en dur
- Abstraction SaaS multi-tenant complète dès le départ

## Conséquences

- On préserve la vitesse de prototype tout en gardant la réutilisation possible pour de futurs clients.
- On réduit le risque de cloner l'application pour chaque nouvelle marque.
- On évite de s'enfermer trop tôt dans une isolation multi-tenant complexe de niveau production avant validation commerciale.
