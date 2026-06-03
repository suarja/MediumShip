# Benchmark Concurrentiel Fonctionnel

Benchmark rapide des acteurs les plus proches de MediumShip, avec un objectif simple : identifier ce qui relève désormais du standard de marché, ce qui est surinvesti par les concurrents, et où MediumShip peut se différencier.

Date de référence : 3 juin 2026.

## Hypothèse de départ

MediumShip n'a pas vocation à devenir un clone vidéo, un LMS générique, ni une plateforme de communauté pure. Le pari produit est un socle white-label pour médias et créateurs éditoriaux qui doivent pouvoir publier du texte, de l'audio et de la vidéo dans une app propriétaire monétisable.

## Acteurs observés

### Audiorista

- Positionnement : apps iOS/Android de contenu premium multi-format
- Signal fort : audio, vidéo, texte, podcasts, ebooks, cours dans une même offre
- Signal infra : mention explicite de Mux, RevenueCat, Firebase et Branch sur la page pricing
- Lecture : le concurrent le plus proche du scénario "média éditorial multi-format"

Sources :
- <https://www.audiorista.com/>
- <https://www.audiorista.com/pricing>

### Uscreen

- Positionnement : membership vidéo avec apps mobiles/TV et communauté
- Signal fort : vidéo au centre, live streaming, catalogues, monétisation récurrente, communauté
- Lecture : référence forte pour la couche vidéo + membership, moins pour le texte éditorial

Sources :
- <https://www.uscreen.tv/how-it-works/>
- <https://www.uscreen.tv/pricing/>

### Passion.io

- Positionnement : app mobile de créateur/coaching/cours
- Signal fort : contenu interactif, offline, subscriptions, offres, communauté
- Lecture : fort sur le packaging creator business, moins pertinent comme modèle éditorial média

Sources :
- <https://passion.io/>
- <https://passion.io/blog/passion-io-pricing-guide-to-creator-app-costs-and-value>

### Kajabi Branded App

- Positionnement : business système tout-en-un avec app de marque
- Signal fort : cours, communauté, coaching, produits, push notifications, achats in-app
- Lecture : très fort sur l'écosystème business, moins spécialisé sur l'expérience média native

Sources :
- <https://www.kajabi.com/features/branded-app>
- <https://www.kajabi.com/pricing?lang=en>

### Disciple

- Positionnement : communauté premium white-label avec contenus, cours, événements et livestreams
- Signal fort : groupes, feed, DMs, événements, push, paywall, home customisable, app stores
- Lecture : très fort sur la couche communauté et appartenance, moins sur un univers éditorial structuré multi-format

Sources :
- <https://www.disciple.community/>
- <https://www.disciple.community/pricing>

## Ce que le marché semble considérer comme standard

- App de marque iOS/Android
- Push notifications
- Paywall / subscriptions / memberships
- Home personnalisable
- Bibliothèque de contenu structurée
- Vidéo au minimum crédible
- Capacité à organiser plusieurs formats ou plusieurs surfaces de contenu

## Ce qui n'est pas nécessairement standard mais revient souvent

- Communauté intégrée
- Événements / livestreams
- Offline / downloads
- Outils de marketing intégrés
- Analytics plus poussées

## Ce qui ressort des acteurs observés

### 1. La vidéo est devenue une attente de marché

Uscreen en fait son centre. Audiorista l'intègre nativement avec Mux. Disciple la traite comme une brique importante via vidéo minutes et livestreams. Kajabi et Passion la prennent aussi en charge dans des offres plus larges.

Conclusion : ignorer la vidéo affaiblirait la crédibilité commerciale de MediumShip.

### 2. Mais très peu d'acteurs sont réellement équilibrés sur le triptyque texte + audio + vidéo

Uscreen sur-indexe la vidéo.
Disciple sur-indexe la communauté.
Kajabi et Passion sur-indexent cours, coaching, business system.
Audiorista est le plus proche d'une offre de contenu multi-format.

Conclusion : la différenciation de MediumShip ne doit pas être "encore une app vidéo", mais "une app média propriétaire multi-format".

### 3. Le white-label n'est pas seulement visuel

Les concurrents vendent :
- branding
- présence en app stores
- menus et homes personnalisés
- modules activables
- monétisation

Conclusion : le modèle `Tenant + ThemeConfig + FeatureFlag + surfaces éditoriales configurables` est le bon angle.

### 4. Communauté est utile, mais pas forcément P0

Disciple en fait le cœur.
Uscreen l'ajoute comme levier de rétention.
Kajabi et Passion la cadrent comme complément de produits/cours.

Conclusion : une communauté native riche n'est pas nécessaire pour le premier MVP de MediumShip. Des `CommunityLink` et des mécaniques légères de rétention suffisent au départ.

## Position produit recommandée pour MediumShip

MediumShip doit se positionner comme :

> un socle white-label mobile-first pour médias indépendants et créateurs éditoriaux qui veulent distribuer, organiser et monétiser texte, audio et vidéo dans une app propriétaire.

Pas comme :

- un clone d'Uscreen
- un clone de Disciple
- un clone de Kajabi
- un LMS de coachings
- un réseau social de niche

## Stack fonctionnelle MVP recommandée

### P0 - obligatoire

- Branding white-label
- Authentification
- Feed éditorial multi-format
- `Article`, `Episode`, `Video` comme types de contenu pairs
- Collections, catégories, tags
- Écran détail article
- Écran détail épisode + audio basique
- Écran détail vidéo
- Paywall et entitlement de base
- Notifications push prêtes à brancher

### P1 - très recommandé

- Import YouTube avec enrichissement de métadonnées
- Modèle prêt pour upload vidéo direct
- Bookmarks
- Playback progress audio/vidéo
- Profil membre
- Pages éditoriales configurables par tenant

### P2 - ensuite

- Upload direct complet
- Pipeline vidéo plus riche si nécessaire
- Événements / live
- Communauté native légère
- Offline
- Analytics avancées

## Implication technique immédiate

Avant tout design backend custom, MediumShip doit vérifier `docs/convex-components-descriptions.md`, notamment pour :

- Cloudflare R2
- Mux
- RevenueCat
- Stripe
- Expo Push Notifications
- Workflow
- Webhook Receiver
- convex-tenants
- convex-authz

## Décision produit qui en découle

La vidéo doit rester dans le MVP, mais elle ne doit plus être présentée comme le centre exclusif du produit. Le centre du produit est l'expérience éditoriale propriétaire multi-format. La vidéo est une capacité critique à l'intérieur de cet ensemble.
