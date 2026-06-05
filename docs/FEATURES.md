Oui, vous êtes déjà proches d’un **MVP crédible de média mobile**.

Mais attention : ne rajoute pas des features “parce que c’est cool”. Ajoute uniquement ce qui renforce une de ces 4 promesses :

1. **consommer mieux**
2. **revenir plus souvent**
3. **monétiser**
4. **personnaliser pour un client white-label**

## Ce que tu as déjà

Tu as le cœur :

* podcasts / épisodes MP3
* vidéos YouTube
* vidéos uploadées / stockées
* articles
* CMS
* application mobile
* bookmarks à venir
* téléchargement offline à venir

Ça couvre déjà : **média éditorial premium**.

## Les features à considérer

### 1. Événements / Agenda

Très pertinent, surtout pour médias politiques, podcasts, communautés, creators premium.

Types d’événements :

* live YouTube à venir
* live audio
* conférence
* rencontre physique
* masterclass
* débat
* sortie d’un épisode programmée
* Q&A abonnés premium
* projection / événement communautaire
* meeting local / groupe local
* webinar
* émission spéciale

Fonctions minimales :

* titre
* description
* date / heure
* lieu ou lien
* type : live, rencontre, conférence, publication
* accès : gratuit / premium
* bouton “me rappeler”
* notification avant événement
* ajout au calendrier

**Verdict : à intégrer.** C’est simple et très vendable.

---

### 2. Notifications éditoriales

Pas juste push générique. Il faut des notifications utiles.

Types :

* nouvel article
* nouvel épisode
* nouvelle vidéo
* événement bientôt
* live dans 30 minutes
* contenu premium publié
* sélection hebdo

Et côté utilisateur :

* choisir ses catégories
* activer/désactiver les alertes
* recevoir uniquement premium / audio / vidéo / événements

**Verdict : très important.** C’est l’un des vrais avantages d’une app propriétaire.

---

### 3. Collections / Séries

Très important pour structurer le contenu.

Exemples :

* “Présidentielle 2027”
* “Les grands entretiens”
* “Comprendre l’économie”
* “Archives”
* “Formation politique”
* “Dossiers spéciaux”
* “Saison 1”

Une collection peut contenir :

* articles
* épisodes
* vidéos
* événements

**Verdict : gros levier UX.** Ça transforme un flux en bibliothèque éditoriale.

---

### 4. Paywall / Accès premium

Même si tu ne branches pas encore le paiement, il faut modéliser :

* contenu gratuit
* contenu réservé membres
* contenu réservé abonnés
* aperçu gratuit
* article partiellement verrouillé
* épisode premium
* vidéo premium
* événement premium

**Verdict : indispensable à modéliser maintenant**, même si paiement plus tard.

---

### 5. Progression de lecture / écoute

Très utile pour podcasts et articles longs.

Fonctions :

* reprendre un podcast où on s’est arrêté
* marquer comme écouté
* marquer comme lu
* historique récent
* “continuer”

**Verdict : priorité moyenne-haute.** Ça donne une vraie sensation native/premium.

---

### 6. Recherche + filtres

Pas forcément Algolia au début.

Minimum :

* recherche titre
* filtre type : article / podcast / vidéo / événement
* filtre catégorie
* filtre premium / gratuit

**Verdict : utile dès que tu as plus de 30 contenus.**

---

### 7. Pages catégories

Tu as besoin de verticales éditoriales.

Exemples génériques :

* Actualités
* Analyses
* Podcasts
* Vidéos
* Événements
* Bibliothèque
* Premium

Pour client politique :

* Présidentielle 2027
* Institutions
* Économie
* International
* Décryptage
* Entretiens
* Agenda

**Verdict : nécessaire pour le white-label.**

---

### 8. CTA communautaires

Pas une communauté interne. Juste des ponts.

Exemples :

* rejoindre Discord
* rejoindre Telegram
* s’inscrire newsletter
* devenir membre
* soutenir
* proposer un sujet
* contacter l’équipe
* rejoindre un groupe local

**Verdict : très bon pour les mouvements / créateurs engagés. Simple à faire.**

---

### 9. Back-office “programmation”

Côté CMS, une feature très importante :

* brouillon
* publié
* programmé
* archivé
* mis en avant

Et côté contenu :

* `publishedAt`
* `scheduledAt`
* `featuredUntil`
* `status`

**Verdict : important.** Ça professionnalise le CMS.

---

### 10. Home configurable

C’est clé pour ton modèle white-label.

La home ne doit pas être hardcodée. Elle doit avoir des blocs :

* hero content
* latest articles
* latest episodes
* featured video
* upcoming events
* premium CTA
* collections
* community CTA

Chaque tenant/client peut choisir l’ordre.

**Verdict : stratégique.** C’est ça qui rend ton app vendable comme socle personnalisable.

## Priorité réelle maintenant

Je ferais cette roadmap :

### Phase 3 — Engagement utilisateur

1. Bookmarks
2. Historique / progression
3. Notifications
4. Téléchargement offline audio
5. Événements simples

### Phase 4 — Média premium

1. Paywall logique
2. Collections / séries
3. Premium screen
4. CTA soutien / abonnement
5. Contenu programmé

### Phase 5 — White-label solide

1. Theme config
2. Home configurable
3. Catégories custom
4. Feature flags
5. Import/export tenant config

## Le vrai “next best feature”

Si tu veux mon avis direct : **fais les événements + collections avant les commentaires/likes.**

Commentaires/likes = réseau social, modération, bruit.
Événements/collections = média premium, structure éditoriale, valeur commerciale.

Donc le trio le plus intelligent maintenant :

1. **Collections**
2. **Événements**
3. **Notifications**

Avec ça, tu passes de “app qui affiche du contenu” à **plateforme média propriétaire**.


Tu connais déjà la maquette mobile actuelle puisque c’est toi qui l’as conçue. Je veux maintenant que tu la fasses évoluer, sans repartir de zéro.

Objectif :
améliorer l’architecture UX et le design de l’app pour mieux intégrer les fonctionnalités réelles et les futurs modules activables depuis le CMS, avec la possibilité de rendre certaines features premium ou non selon le client.

Contexte produit à prendre en compte :
- app média mobile white-label
- approche guest-first
- lecture publique sans auth
- auth réservée surtout aux fonctions membres : premium, bookmarks, téléchargements offline, sync, personnalisation
- contenus multi-format : articles, épisodes audio, vidéos YouTube, vidéos hébergées
- certains modules doivent pouvoir être activés ou désactivés depuis le CMS selon le tenant
- la navigation, le home feed et certaines pages doivent rester configurables côté CMS
- l’onglet/page Premium fixe n’a pas forcément de sens pour tous les tenants

Nouveau point important :
le CMS ne doit pas seulement permettre d’activer ou désactiver des modules, mais aussi de définir si certaines features sont gratuites ou premium pour l’utilisateur final.

Il faut donc penser un système simple permettant au client CMS de décider, feature par feature, ce qui est :
- gratuit
- réservé aux membres / premium

Exemples à considérer :
- bookmarks : plutôt gratuit par défaut
- téléchargements offline : premium probable
- reprise / progression sync : potentiellement premium ou member-only
- création de listes personnelles : potentiellement premium
- création de collections personnelles / séries personnelles : potentiellement premium
- collections / séries éditoriales créées par l’application : distinctes des collections créées par l’utilisateur final
- agenda / événements : accès libre ou premium selon le tenant
- CTA communautaires / communauté : parfois libre, parfois réservé aux membres

Point de design important :
il faut bien distinguer :
- collections éditoriales créées par l’équipe / l’application
- collections, listes ou séries créées par l’utilisateur final
- contenu premium
- feature premium
- module activé/désactivé au niveau tenant

Sujets à résoudre dans la maquette :
- mieux intégrer l’écran Profil avec bookmarks, téléchargements, statut membre, progression/reprise, et éventuellement les listes ou collections personnelles
- définir comment intégrer Agenda / Events
- définir comment intégrer Collections / Series éditoriales
- définir comment intégrer les collections / listes personnelles utilisateur
- voir où placer Search + filtres
- clarifier les pages catégories / pages thématiques
- intégrer les CTA communautaires
- repenser la place de Premium dans les parcours et la navigation
- distinguer ce qui doit être fixe dans l’app vs configurable depuis le CMS
- distinguer ce qui peut être premium ou non via CMS sans rendre l’expérience trop complexe

Ce que j’attends :
1. une recommandation claire de navigation mobile
2. une architecture d’information plus cohérente
3. une proposition de home feed modulaire pilotable depuis le CMS
4. une proposition concrète pour Profil, Agenda, Collections éditoriales, collections personnelles, Search, Category pages, Community CTA et Premium
5. une proposition simple de modèle CMS pour activer/désactiver une feature et la marquer premium ou non
6. une recommandation sur quelles features devraient être gratuites vs premium par défaut
7. ce qu’il faut changer en priorité dans la maquette actuelle
8. les anti-patterns à éviter

Contraintes :
- rester simple, modulaire et CMS-friendly
- éviter un système de règles trop complexe
- éviter de surcharger la navigation avec trop d’entrées fixes
- partir de la maquette actuelle, pas d’un concept abstrait
- ne code rien

Format :
- sois concret, concis et structuré
- donne une recommandation claire, pas seulement des options
- si tu proposes un système premium feature-by-feature, garde-le minimal et lisible côté CMS