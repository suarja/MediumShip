# ADR 0003 — Content Discovery Engine : recommandations simples, providers découplés et redécouverte des archives

## Statut

Accepté

## Date

2026-06-06

## Contexte

Le projet initial est une application mobile white-label pour médias indépendants, créateurs de contenu, podcasts, chaînes YouTube, communautés éditoriales et mouvements citoyens.

Le socle déjà envisagé ou partiellement implémenté contient :

* une application mobile Expo / React Native ;
* un CMS web ;
* des articles ;
* des épisodes audio / podcasts MP3 ;
* des vidéos YouTube ;
* des vidéos uploadées / stockées ;
* des collections / séries ;
* des catégories ;
* des bookmarks ;
* du téléchargement offline ;
* des profils utilisateurs ;
* une logique potentielle de contenus premium ;
* un backend Convex ;
* une architecture pensée pour être personnalisable par client / tenant.

Au fil de la réflexion, le problème produit s’est déplacé.

La question initiale était :

> Comment créer une app mobile white-label de média premium, comparable dans l’esprit à Élucid ou Omerta ?

Puis la réflexion a évolué vers :

> Comment créer une expérience mobile plus intéressante qu’un simple catalogue chronologique d’articles, vidéos et podcasts ?

La piste centrale retenue est celle d’un **moteur de découverte / redécouverte de contenus**, capable de remettre en circulation des contenus anciens, d’explorer des archives, de personnaliser progressivement un feed, et de fonctionner sur plusieurs sources de contenu.

Cette décision découle d’un travail de reverse engineering conceptuel autour de deux références :

1. **Gleeph**, pour la logique de profil de goût et de recommandation personnalisée.
2. **Xikipedia**, pour la logique de feed éducatif random / semi-algorithmique basé sur des contenus encyclopédiques.

---

## Recherche 1 — Gleeph

### Ce qui est factuel

Gleeph est une application française de gestion de bibliothèque personnelle et de réseau social de lecteurs. Les fiches App Store et Google Play indiquent qu’elle permet d’ajouter des livres, de scanner des codes-barres, d’organiser une bibliothèque virtuelle, de créer des étagères, et de recevoir des suggestions de lecture selon les goûts littéraires de l’utilisateur.

Gleeph dispose aussi d’une dimension professionnelle via Gleeph.pro, qui met en avant un réseau de lecteurs et des technologies de recommandation pour les acteurs de la chaîne du livre. Gleeph.pro mentionne explicitement un algorithme nommé **Fahrenheit**.

Un article de 20 Minutes indique que Gleeph fonde ses recommandations sur des similarités de bibliothèques virtuelles, selon ses concepteurs.

Des articles professionnels mentionnent aussi l’utilisation ou la mise à disposition de l’algorithme Fahrenheit pour des acteurs de la librairie.

### Ce qui n’est pas confirmé

Nous ne connaissons pas l’algorithme exact de Gleeph.

Nous ne pouvons pas confirmer :

* les features internes exactes ;
* les pondérations utilisées ;
* la présence ou non d’embeddings ;
* la présence ou non de collaborative filtering pur ;
* la présence ou non de modèles ML avancés ;
* la façon exacte dont Fahrenheit calcule la compatibilité livre / lecteur ;
* les signaux implicites réellement utilisés.

Toute hypothèse sur leur algorithme doit donc rester une **inférence**, pas un fait.

### Hypothèse de fonctionnement utile pour notre projet

Gleeph semble transformer une bibliothèque personnelle en **profil de goût**.

Les signaux plausibles sont :

* livres possédés ;
* livres lus ;
* livres aimés ;
* wishlist ;
* livres scannés ;
* étagères personnalisées ;
* notes ;
* avis ;
* livres consultés ;
* ajouts après recommandation ;
* similarité avec d’autres lecteurs.

Le modèle probable est hybride :

1. **content-based filtering**
   Recommandation à partir des propriétés des livres : auteur, genre, résumé, éditeur, collection, thèmes, langue, popularité.

2. **collaborative filtering**
   Recommandation à partir de lecteurs similaires : “les utilisateurs qui ont une bibliothèque proche de la vôtre ont aussi aimé X”.

3. **business / editorial layer**
   Pondération de nouveautés, sorties récentes, campagnes éditoriales ou livres à promouvoir.

4. **explication personnalisée**
   L’utilisateur ne reçoit pas seulement une recommandation, mais aussi une justification : pourquoi ce livre peut lui correspondre.

### Ce que nous retenons de Gleeph

Le point clé n’est pas “recommander des livres”.

Le point clé est :

> Transformer des interactions personnelles en profil de goût exploitable.

Transposition pour notre projet :

| Gleeph                            | Notre produit              |
| --------------------------------- | -------------------------- |
| Livre                             | ContentItem / Insight      |
| Auteur                            | Entity                     |
| Genre                             | Category                   |
| Étagère                           | Collection                 |
| Livre aimé                        | Interaction(type: like)    |
| Livre dans wishlist               | Bookmark                   |
| Bibliothèque personnelle          | UserLibrary / UserHistory  |
| Recommandation de livre           | Discovery recommendation   |
| Compatibilité livre / lecteur     | Relevance score            |
| “Pourquoi ce livre est pour vous” | Recommendation explanation |

La leçon produit :

> Plus l’utilisateur lit, écoute, regarde, sauvegarde ou ignore du contenu, plus l’application peut lui proposer des contenus pertinents et expliquer ces recommandations.

---

## Recherche 2 — Xikipedia

### Ce qui est factuel

Xikipedia est une application open source décrite comme “Wikipedia as a social media feed”. Le projet transforme des contenus Wikipédia en feed social / doomscrollable. Le repository GitHub est public.

Le README explique que l’algorithme de Xikipedia utilise des scores associés aux posts / catégories et une stratégie de sélection mixte :

* 40 % : sélection pondérée par score ;
* 42 % : sélection du post au score le plus élevé ;
* 18 % : sélection complètement random.

Le projet utilise les catégories et liens internes des articles comme signaux. Les actions utilisateur modifient les scores. Le README donne des poids explicites, par exemple skip, like, clic sur un article ou clic sur une image.

Xikipedia est sous licence **AGPL-3.0**, donc toute réutilisation directe du code doit être considérée avec prudence.

Wikipedia propose aussi des copies téléchargeables de ses contenus, utilisables pour mirroring, sauvegarde, usage offline ou requêtes de base de données.

### Ce que nous retenons de Xikipedia

Xikipedia prouve qu’un feed de découverte éducative peut être construit sans ML lourd.

Le mécanisme minimal est :

1. récupérer un corpus de contenus ;
2. extraire des catégories / tags / liens ;
3. afficher des contenus dans un feed ;
4. enregistrer des interactions ;
5. modifier des scores de préférences ;
6. recommander des contenus via un mix entre pertinence et hasard.

Le point clé :

> Un feed utile n’a pas besoin d’un modèle ML complexe au départ. Un scoring pondéré, transparent et contrôlé peut suffire pour une première version.

---

## Évolution de la réflexion produit

### Étape 1 — App média white-label

Le produit initial est un socle mobile pour médias indépendants :

* articles ;
* vidéos ;
* podcasts ;
* CMS ;
* app mobile ;
* contenu premium ;
* notifications ;
* bookmarks ;
* offline.

Ce modèle est utile, mais il risque de rester un simple catalogue de contenu.

### Étape 2 — App documentaire politique

Une piste a émergé autour d’une app citoyenne / politique pour 2027 :

* dossiers ;
* thématiques ;
* propositions ;
* candidats ;
* programmes ;
* sources ;
* contenus explicatifs.

Nous avons conclu que les entités politiques devaient rester génériques :

| Concept politique         | Primitive générique       |
| ------------------------- | ------------------------- |
| Dossier                   | Collection                |
| Thématique                | Category                  |
| Proposition               | Insight                   |
| Candidat                  | Entity                    |
| Parti / mouvement         | Entity                    |
| Programme                 | Collection(type: program) |
| Position                  | Stance                    |
| Source officielle         | Source                    |
| Article / vidéo / podcast | ContentItem               |

Décision intermédiaire : ne pas créer un modèle figé `Candidate`, `Proposal`, `Program`, mais spécialiser des primitives génériques.

### Étape 3 — Feed éducatif type Xikipedia

Une autre piste a émergé : porter l’esprit de Xikipedia en mobile, potentiellement en français, avec un feed de découverte éducative.

Cette idée est intéressante, mais elle devient plus puissante si elle n’est pas traitée comme une app isolée.

### Étape 4 — Chaînon manquant

La synthèse finale :

> Le vrai différenciateur du produit white-label n’est pas seulement de publier des contenus dans une app mobile. C’est de transformer les contenus existants d’un média en expérience de redécouverte personnalisée.

Le problème client devient :

> Les archives d’un média ou créateur meurent dans les timelines chronologiques.

YouTube, Spotify, Substack ou un CMS classique affichent souvent :

* les derniers contenus ;
* les contenus populaires ;
* des playlists ou collections ;
* un ordre chronologique.

Mais les anciens contenus restent sous-exploités.

Notre produit peut proposer :

> Une app propriétaire qui redonne vie aux archives par un feed de découverte semi-personnalisé.

---

## Décision

Nous décidons de créer un module générique nommé :

> **Content Discovery Engine**

Ce module doit être indépendant des sources de contenu.

Il doit permettre :

* d’importer des contenus depuis plusieurs providers ;
* de normaliser ces contenus en un modèle canonique ;
* d’enrichir les contenus avec catégories, tags, entities, sources et insights ;
* d’enregistrer les interactions utilisateur ;
* de construire progressivement un profil de préférences ;
* de générer un feed de découverte ;
* de mélanger pertinence, hasard, diversité, nouveauté et archives ;
* d’expliquer pourquoi un contenu est recommandé ;
* de fonctionner d’abord sans ML lourd ;
* de rester compatible avec une évolution future vers embeddings, similarité sémantique ou collaborative filtering.

---

## Décision architecturale

Nous adoptons une architecture inspirée hexagonale / port-adapter, mais légère.

L’objectif n’est pas de créer une architecture abstraite excessive.

L’objectif est de découpler clairement :

1. l’ingestion ;
2. la normalisation ;
3. l’enrichissement ;
4. la recommandation ;
5. l’affichage.

### Couches

#### 1. Providers / Sources

Les providers récupèrent des contenus externes ou internes.

Exemples :

* CMSProvider ;
* WikipediaProvider ;
* YouTubeProvider ;
* PodcastRSSProvider ;
* UploadedMediaProvider ;
* ExternalURLProvider.

Chaque provider doit être remplaçable et découplé.

#### 2. Canonical Content Model

Tous les contenus importés sont normalisés en `ContentItem`.

Exemples :

* une vidéo YouTube devient `ContentItem(type: "video")` ;
* un épisode RSS devient `ContentItem(type: "episode")` ;
* un article Wikipédia devient `ContentItem(type: "wiki_article")` ou `ContentItem(type: "article")` ;
* un article du CMS devient `ContentItem(type: "article")` ;
* une vidéo uploadée devient `ContentItem(type: "video")`.

#### 3. Enrichment Layer

L’enrichissement ajoute :

* catégories ;
* tags ;
* entities ;
* sources ;
* insights ;
* résumés ;
* durée ;
* image ;
* metadata ;
* niveau d’accès ;
* langue ;
* score éditorial.

Au départ, cet enrichissement peut être manuel ou semi-automatique.

Plus tard, il pourra utiliser IA, embeddings ou extraction automatique.

#### 4. Interaction Layer

Chaque action utilisateur est capturée :

* view ;
* open ;
* skip ;
* like ;
* bookmark ;
* finish ;
* share ;
* download ;
* hide ;
* follow category ;
* follow entity.

Ces interactions alimentent le profil utilisateur.

#### 5. Preference Layer

Le profil utilisateur est un ensemble de scores pondérés :

* score par category ;
* score par tag ;
* score par entity ;
* score par source ;
* score par contentType.

Ce profil doit être simple, inspectable et recalculable.

#### 6. Discovery Engine

Le moteur génère un feed à partir de :

* préférences utilisateur ;
* contenus non vus ;
* diversité ;
* fraîcheur ;
* archives ;
* contenus mis en avant ;
* hasard contrôlé ;
* pénalités sur contenus ignorés ou déjà vus.

---

## Modèle conceptuel

### ContentSource

Représente la source d’origine.

```ts
type ContentSource = {
  id: string;
  tenantId: string;
  type:
    | "cms"
    | "wikipedia"
    | "youtube"
    | "podcast_rss"
    | "upload"
    | "external_url";

  name: string;
  url?: string;
  config?: Record<string, unknown>;
  enabled: boolean;

  createdAt: number;
  updatedAt: number;
};
```

### ContentItem

Contenu canonique.

```ts
type ContentItem = {
  id: string;
  tenantId: string;

  sourceId?: string;
  externalId?: string;
  canonicalUrl?: string;

  type:
    | "article"
    | "video"
    | "episode"
    | "wiki_article";

  title: string;
  slug?: string;
  description?: string;
  body?: string;

  mediaUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;

  categoryIds: string[];
  tagIds: string[];
  entityIds: string[];
  insightIds?: string[];
  collectionIds?: string[];

  access: "free" | "member" | "premium";
  status: "draft" | "scheduled" | "published" | "archived";

  publishedAt?: number;
  importedAt?: number;
  updatedAt: number;
};
```

### Collection

Regroupement éditorial.

```ts
type Collection = {
  id: string;
  tenantId: string;

  type:
    | "dossier"
    | "series"
    | "playlist"
    | "course"
    | "guide"
    | "campaign"
    | "program"
    | "special";

  title: string;
  slug: string;
  description?: string;
  coverImage?: string;

  ownerEntityId?: string;

  status: "draft" | "published" | "archived";
  featured?: boolean;

  createdAt: number;
  updatedAt: number;
};
```

### Category

Axe éditorial principal.

```ts
type Category = {
  id: string;
  tenantId: string;

  name: string;
  slug: string;
  description?: string;

  parentId?: string;
  order?: number;

  createdAt: number;
  updatedAt: number;
};
```

### Tag

Mot-clé transversal.

```ts
type Tag = {
  id: string;
  tenantId: string;

  name: string;
  slug: string;

  createdAt: number;
  updatedAt: number;
};
```

### Entity

Personne, organisation, candidat, auteur, expert, média, etc.

```ts
type Entity = {
  id: string;
  tenantId: string;

  type:
    | "person"
    | "candidate"
    | "party"
    | "organization"
    | "movement"
    | "author"
    | "expert"
    | "media"
    | "source";

  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  websiteUrl?: string;

  metadata?: Record<string, unknown>;

  createdAt: number;
  updatedAt: number;
};
```

### Insight

Unité courte de connaissance, proposition, idée, principe, définition ou question.

```ts
type Insight = {
  id: string;
  tenantId: string;

  type:
    | "claim"
    | "proposal"
    | "principle"
    | "lesson"
    | "question"
    | "quote"
    | "stat"
    | "definition";

  title: string;
  slug: string;
  summary: string;
  explanation?: string;

  categoryIds: string[];
  tagIds: string[];
  entityIds?: string[];
  sourceIds?: string[];

  access: "free" | "member" | "premium";
  status: "draft" | "published" | "archived";

  createdAt: number;
  updatedAt: number;
};
```

### Stance

Position d’une entité sur un insight.

```ts
type Stance = {
  id: string;
  tenantId: string;

  entityId: string;
  insightId: string;

  value:
    | "supports"
    | "opposes"
    | "mixed"
    | "unclear"
    | "unknown";

  explanation?: string;
  sourceIds?: string[];

  createdAt: number;
  updatedAt: number;
};
```

### Source

Source documentaire.

```ts
type Source = {
  id: string;
  tenantId: string;

  title: string;
  url?: string;
  publisher?: string;
  author?: string;
  publishedAt?: number;

  type:
    | "official_program"
    | "speech"
    | "interview"
    | "article"
    | "report"
    | "video"
    | "podcast"
    | "book"
    | "wikipedia"
    | "other";

  createdAt: number;
  updatedAt: number;
};
```

### Interaction

Signal utilisateur.

```ts
type Interaction = {
  id: string;
  tenantId: string;
  userId: string;

  targetType:
    | "content"
    | "insight"
    | "collection"
    | "category"
    | "entity";

  targetId: string;

  type:
    | "view"
    | "open"
    | "skip"
    | "like"
    | "bookmark"
    | "finish"
    | "share"
    | "download"
    | "hide"
    | "follow";

  createdAt: number;
};
```

### UserPreference

Profil de préférences pondéré.

```ts
type UserPreference = {
  id: string;
  tenantId: string;
  userId: string;

  targetType:
    | "category"
    | "tag"
    | "entity"
    | "source"
    | "contentType";

  targetId: string;

  score: number;
  updatedAt: number;
};
```

### FeedSession

Trace optionnelle d’un feed généré.

```ts
type FeedSession = {
  id: string;
  tenantId: string;
  userId: string;

  mode:
    | "random"
    | "personalized"
    | "archive"
    | "editorial"
    | "mixed";

  itemIds: string[];

  generatedAt: number;
};
```

---

## Providers envisagés

### CMSProvider

Provider interne.

Il lit les contenus déjà créés dans le CMS :

* articles ;
* vidéos ;
* épisodes ;
* contenus uploadés ;
* collections ;
* catégories.

C’est le provider prioritaire car il correspond au socle déjà construit.

### WikipediaProvider

Provider de démonstration / discovery éducatif.

Il sert à créer une expérience type Xikipedia mobile, potentiellement en français.

Il permet de tester :

* feed random ;
* découverte éducative ;
* tags / catégories ;
* bookmarks ;
* historique ;
* scoring simple.

La source Wikipédia a l’avantage d’être abondante, accessible, et adaptée à une démo de découverte.

### PodcastRSSProvider

Provider pour podcasts.

Il lit un flux RSS et extrait les épisodes via les balises `<enclosure>` contenant les URLs audio.

Il permet de convertir un podcast externe en `ContentItem(type: "episode")`.

### YouTubeProvider

Provider pour chaînes ou playlists whitelistées.

Il permet de transformer des vidéos YouTube en `ContentItem(type: "video")`.

À utiliser prudemment selon les quotas API, les règles YouTube et le niveau de dépendance accepté.

### UploadedMediaProvider

Provider pour médias uploadés directement.

Il permet de gérer :

* vidéos stockées ;
* audios stockés ;
* miniatures ;
* métadonnées.

---

## Algorithme MVP

Le MVP ne doit pas utiliser d’infrastructure ML.

Le moteur doit commencer par un scoring simple, inspiré de Xikipedia et du reverse engineering conceptuel de Gleeph.

### Interaction weights initiaux

```ts
const interactionWeights = {
  view: 5,
  open: 20,
  skip: -10,
  like: 50,
  bookmark: 75,
  finish: 100,
  share: 80,
  download: 60,
  hide: -100,
  follow: 90,
};
```

Ces poids sont arbitraires et doivent être ajustables.

### Mise à jour des préférences

Quand un utilisateur interagit avec un contenu, on met à jour les préférences associées :

* catégories du contenu ;
* tags ;
* entities ;
* source ;
* type de contenu.

Exemple :

```txt
User likes article about epistemology:
- category: philosophie +50
- tag: épistémologie +50
- entity: Karl Popper +50
- source: Wikipedia +10
- contentType: article +10
```

### Scoring de feed

```txt
score(item) =
  categoryAffinity
+ tagAffinity
+ entityAffinity
+ sourceAffinity
+ contentTypeAffinity
+ freshnessBoost
+ archiveBoost
+ editorialBoost
+ diversityBoost
+ randomDiscovery
- alreadySeenPenalty
- skippedPenalty
```

### Répartition initiale du feed

Le feed doit éviter l’enfermement algorithmique.

Répartition proposée :

```txt
60 % personnalisé
20 % archives / redécouverte
10 % éditorial / featured
10 % random / surprise
```

Pour une démo type Xikipedia :

```txt
40 % pondéré par préférences
40 % meilleur score
20 % random
```

Cette répartition est inspirée du principe mixte de Xikipedia, sans copier nécessairement son implémentation exacte. Xikipedia utilise publiquement une logique 40 % pondérée, 42 % meilleur score, 18 % random.

### Explication des recommandations

Chaque recommandation doit pouvoir être expliquée simplement :

* “Recommandé car vous avez sauvegardé plusieurs contenus sur l’économie.”
* “Recommandé car vous avez terminé plusieurs épisodes de ce média.”
* “À découvrir : contenu ancien lié à vos thèmes suivis.”
* “Surprise : sélection aléatoire pour sortir de vos habitudes.”
* “Archive remise en avant.”

C’est important pour la confiance utilisateur.

---

## Modes de feed

### Editorial Feed

Contenus sélectionnés manuellement par le média.

Utilisation :

* home ;
* à la une ;
* lancement d’un dossier ;
* campagne éditoriale ;
* contenus premium.

### Chronological Feed

Contenus récents par ordre chronologique.

Utilisation :

* onglet vidéos ;
* onglet podcasts ;
* derniers articles ;
* actualités.

### Discovery Feed

Feed semi-personnalisé.

Utilisation :

* onglet Découvrir ;
* redécouverte des archives ;
* contenus recommandés ;
* contenus surprise ;
* feed éducatif.

### Archive Feed

Feed orienté anciens contenus.

Utilisation :

* “redécouvrir les classiques” ;
* “vous avez manqué ceci” ;
* “archives liées à vos intérêts”.

### Random Feed

Feed aléatoire ou semi-aléatoire.

Utilisation :

* démo Xikipedia-like ;
* exploration ;
* sérendipité ;
* mode “surprends-moi”.

---

## Valeur produit

### Pour l’utilisateur final

Le Discovery Engine permet :

* de découvrir des contenus pertinents sans chercher ;
* de retrouver des archives invisibles ;
* de construire une bibliothèque personnelle ;
* de recevoir des recommandations compréhensibles ;
* de sortir du pur chronologique ;
* de remplacer une partie du doomscrolling par de la découverte éducative.

### Pour un média / créateur

Le Discovery Engine permet :

* de donner une seconde vie aux archives ;
* d’augmenter la consommation de contenus anciens ;
* d’améliorer la rétention ;
* de mieux comprendre les intérêts de l’audience ;
* de proposer une expérience propriétaire différente de YouTube / Spotify / Substack ;
* de transformer un catalogue en expérience personnalisée.

### Pour le produit white-label

Le Discovery Engine devient une brique différenciante :

> Mediumship ne crée pas seulement une app mobile pour médias. Mediumship transforme les contenus existants d’un média en expérience de découverte personnalisée.

---

## Application à différents cas d’usage

### Média indépendant

* ContentItem = articles, vidéos, podcasts
* Collection = dossiers
* Category = rubriques
* Entity = auteurs, invités, experts
* Insight = idées clés
* Source = références
* Discovery Feed = redécouverte des archives

### App politique / citoyenne

* ContentItem = articles, vidéos, podcasts explicatifs
* Collection = programmes, dossiers
* Category = thématiques
* Entity = candidats, partis, mouvements
* Insight = propositions
* Stance = positions
* Source = programmes officiels, interviews, rapports
* Discovery Feed = exploration des sujets

### App éducative

* ContentItem = leçons, vidéos, audios
* Collection = modules
* Category = matières
* Entity = professeurs, auteurs
* Insight = concepts, définitions, principes
* Source = documents, livres, ressources
* Discovery Feed = révision / exploration

### App sport / coaching

* ContentItem = vidéos d’exercice, articles, audios
* Collection = programmes
* Category = muscles, objectifs
* Entity = coachs, athlètes
* Insight = principes techniques
* Source = études, vidéos, références
* Discovery Feed = contenus adaptés aux objectifs

### App business / créateurs

* ContentItem = articles, vidéos, podcasts
* Collection = guides, playbooks
* Category = acquisition, offre, productivité
* Entity = experts, entreprises
* Insight = frameworks
* Source = livres, interviews, posts, podcasts
* Discovery Feed = apprentissage progressif

---

## Choix techniques

### Backend

Backend principal : **Convex**.

Convex doit gérer au départ :

* stockage des contenus normalisés ;
* sources ;
* providers ;
* interactions ;
* préférences ;
* bookmarks ;
* feed generation ;
* crons de synchronisation ;
* actions d’ingestion ;
* queries pour l’app mobile ;
* mutations d’interaction.

### Pourquoi Convex suffit au MVP

Le MVP ne nécessite pas :

* entraînement ML ;
* infrastructure vectorielle ;
* batch pipeline complexe ;
* collaborative filtering distribué ;
* modèles lourds.

Un système de scoring pondéré suffit.

### Ce qui peut être ajouté plus tard

Si le produit prouve son usage, on pourra ajouter :

* embeddings de contenus ;
* similarité sémantique ;
* clustering automatique ;
* auto-tagging ;
* résumé automatique ;
* extraction d’entities ;
* recommandation collaborative ;
* jobs Python externes ;
* vector store ;
* modèles de ranking plus avancés.

Mais ces éléments sont explicitement **hors scope MVP**.

---

## Scope MVP recommandé

### Phase 1 — Content Discovery minimal

Inclure :

* `ContentSource`
* `ContentItem.sourceId`
* `Interaction`
* `UserPreference`
* `CMSProvider`
* `WikipediaProvider`
* feed discovery simple
* bookmarks
* historique
* scoring pondéré simple
* affichage de la source d’origine

Ne pas inclure :

* embeddings ;
* ML ;
* collaborative filtering ;
* multi-provider complexe ;
* personnalisation avancée ;
* vidéo/audio multi-source avancés.

### Phase 2 — Multi-source contrôlé

Ajouter :

* PodcastRSSProvider ;
* YouTubeProvider whitelisté ;
* UploadedMediaProvider ;
* explication de recommandation ;
* filtres par source ;
* mode “archives” ;
* mode “surprise”.

### Phase 3 — Redécouverte média

Ajouter :

* feed par tenant ;
* home configurable ;
* onglet “Découvrir” ;
* archiveBoost ;
* editorialBoost ;
* recommendations by category ;
* stats de contenu redécouvert ;
* dashboard CMS simple.

### Phase 4 — Intelligence sémantique

Ajouter seulement si justifié :

* embeddings ;
* auto-tagging ;
* similarité sémantique ;
* recommandations liées ;
* résumés automatiques ;
* questions / insights générés.

---

## Non-objectifs

Ne pas construire maintenant :

* un réseau social ;
* un clone de YouTube ;
* un clone de Gleeph ;
* un clone exact de Xikipedia ;
* un moteur ML avancé ;
* un système de recommandation opaque ;
* une plateforme politique complète ;
* un système de commentaires ouvert ;
* une infra de ranking complexe ;
* une app encyclopédique exhaustive ;
* un agrégateur multi-source non contrôlé ;
* un crawler généraliste.

---

## Risques

### Risque 1 — Sur-architecture

Le terme “hexagonal” peut pousser à créer trop d’abstractions trop tôt.

Mitigation :

* créer des interfaces simples ;
* implémenter seulement 2 providers au départ ;
* garder le core lisible ;
* documenter les ports ;
* éviter les patterns inutiles.

### Risque 2 — Scope creep multi-source

Ajouter vidéo, audio, Wikipedia, YouTube, RSS, CMS, upload et IA trop tôt peut tuer le prototype.

Mitigation :

* commencer avec CMSProvider + WikipediaProvider ;
* ajouter RSS ou YouTube seulement après validation ;
* maintenir un `ContentItem` canonique.

### Risque 3 — Recommandation de mauvaise qualité

Un scoring simple peut recommander des contenus faibles.

Mitigation :

* garder une sélection éditoriale ;
* introduire un `editorialBoost` ;
* permettre de masquer un contenu ;
* expliquer les recommandations ;
* conserver une part de random contrôlé.

### Risque 4 — Bulle algorithmique

Un feed trop personnalisé peut enfermer l’utilisateur.

Mitigation :

* imposer une part de surprise ;
* intégrer sourceDiversity ;
* ajouter archiveBoost ;
* proposer “Explorer hors de mes habitudes”.

### Risque 5 — Licences

Xikipedia est sous licence AGPL-3.0.

Mitigation :

* ne pas copier le code directement ;
* s’inspirer du concept et des principes ;
* documenter toute réutilisation éventuelle ;
* vérifier les licences des contenus et APIs.

### Risque 6 — Dépendances externes

YouTube, RSS, APIs externes et Wikipedia peuvent imposer des contraintes.

Mitigation :

* garder les providers isolés ;
* stocker un modèle canonique ;
* afficher la source ;
* prévoir désactivation provider ;
* prévoir cache.

### Risque 7 — Coût ML prématuré

Ajouter embeddings et IA trop tôt peut complexifier inutilement.

Mitigation :

* scoring déterministe d’abord ;
* instrumentation des interactions ;
* ML seulement si les données prouvent l’intérêt.

---

## Conséquences positives

Cette décision permet :

* de rendre le produit plus différenciant ;
* de valoriser les archives ;
* de créer un module réutilisable white-label ;
* de commencer sans ML ;
* de garder une architecture extensible ;
* de découpler les sources de contenu ;
* de préparer l’avenir algorithmique sans s’y enfermer ;
* de créer une démo mobile forte type Xikipedia ;
* de proposer aux médias une valeur plus claire que “une app catalogue”.

---

## Conséquences négatives

Cette décision ajoute :

* plus de complexité domaine ;
* plus de modèles ;
* un besoin de scoring ;
* un besoin d’instrumentation ;
* un besoin de qualité éditoriale ;
* un risque de feed médiocre si les contenus sont mal taggés ;
* un besoin de discipline pour ne pas ajouter trop de providers.

---

## Décision finale

Nous allons construire le **Content Discovery Engine** comme module transversal du socle white-label.

La première version sera simple :

* sources découplées ;
* contenus normalisés ;
* interactions enregistrées ;
* préférences pondérées ;
* feed mixte : personnalisé + archives + éditorial + random ;
* recommandations explicables ;
* aucun ML lourd.

Nous implémenterons d’abord cette logique dans Convex, avec une architecture port-adapter légère.

La priorité est de prouver :

1. que l’utilisateur interagit avec le feed ;
2. qu’il sauvegarde des contenus ;
3. qu’il revient ;
4. que les archives sont redécouvertes ;
5. que le module est réutilisable pour plusieurs tenants / verticales.

---

## Plan d’implémentation immédiat

### Étape 1 — Documentation

* Ajouter cette ADR.
* Mettre à jour `CONTEXT.md`.
* Ajouter une section `Discovery Engine`.
* Ajouter le vocabulaire :

  * ContentSource
  * Provider
  * ContentItem
  * Interaction
  * UserPreference
  * FeedSession
  * DiscoveryFeed

### Étape 2 — Modèle Convex

Créer ou adapter :

* `contentSources`
* `contentItems`
* `interactions`
* `userPreferences`
* `feedSessions`
* relations vers :

  * categories
  * tags
  * entities
  * insights
  * collections
  * sources

### Étape 3 — Providers MVP

Créer :

* `CMSProvider`
* `WikipediaProvider`

Ne pas créer encore :

* YouTubeProvider ;
* PodcastRSSProvider ;
* ML enrichment ;
* embeddings.

### Étape 4 — Feed MVP

Créer :

* `recordInteraction`
* `updateUserPreferences`
* `generateDiscoveryFeed`
* `getDiscoveryFeed`
* `explainRecommendation`

### Étape 5 — UI mobile

Ajouter un onglet ou écran :

* `Discover`
* carte de contenu ;
* source visible ;
* boutons :

  * passer ;
  * aimer ;
  * sauvegarder ;
  * ouvrir ;
* explication simple :

  * “Recommandé car…”
  * “Archive remise en avant”
  * “Sélection surprise”

### Étape 6 — Mesure

Tracer :

* vues ;
* skips ;
* likes ;
* bookmarks ;
* opens ;
* finish ;
* contenus redécouverts ;
* distribution des sources ;
* rétention sur le feed.

---

## Notes de recherche conservées

### Gleeph

* Gleeph prouve l’intérêt de transformer une bibliothèque personnelle en profil de goût.
* Le cœur perçu n’est pas seulement la recommandation, mais la compatibilité expliquée.
* Pour notre produit, l’équivalent est de transformer une bibliothèque de contenus, idées et interactions en profil intellectuel ou éditorial.

### Xikipedia

* Xikipedia prouve qu’un feed éducatif peut fonctionner avec du random pondéré.
* Son approche montre qu’un feed de découverte peut être construit sans ML lourd.
* Son mélange pertinence / top score / random est une bonne inspiration.
* Son code ne doit pas être copié sans analyse de licence AGPL-3.0.

### Synthèse

Le produit à construire n’est pas :

> une app média classique.

Ni :

> une app Xikipedia indépendante.

Ni :

> une copie de Gleeph.

Mais :

> un socle mobile white-label capable de transformer des contenus existants en feed de découverte intelligent, explicable et personnalisable.

---

## Phrase produit retenue

> Mediumship transforme les contenus existants d’un média en expérience mobile de découverte personnalisée.

Ou, version plus commerciale :

> Vos archives ne dorment plus. Elles deviennent un feed vivant, personnalisé et propriétaire.
