# ADR 0009 — YouTube Channel Provider : playlist-first, whitelist éditoriale et métadonnées par vidéo

## Statut

Proposé

## Date

2026-06-07

## Contexte

Le Discovery Engine (ADR 0003) ingère du contenu depuis plusieurs providers enregistrés dans `PROVIDERS`. Wikipedia et RSS sont opérationnels. YouTube est la prochaine source prioritaire pour deux raisons :

1. **Cas créateur** : un tenant peut vouloir importer automatiquement les vidéos de sa propre chaîne YouTube dans le feed de découverte, sans saisie manuelle dans le CMS.
2. **Cas démo** : sans chaîne configurée, le feed ne contient aucune vidéo ingérée. Une whitelist éditoriale de chaînes francophones de qualité donne au feed de découverte une richesse immédiate, symétrique au rôle que joue Wikipedia pour les articles.

Le projet dispose déjà de :
- `convex-youtube-cache` (composant installé), exposant `cache.getVideo` / `cache.getVideos`. **Important : le cache stocke un sous-ensemble curaté des métadonnées — `videoId, title, description, thumbnailUrl, duration, channelId, channelTitle, publishedAt, viewCount, likeCount`. Il ne stocke NI `tags` NI `categoryId`.** Il sert le chemin CMS enrich (lookups répétés de la même URL), pas l'ingestion par lot.
- `YOUTUBE_DATA_API_KEY` en variable d'environnement Convex.
- `convex/youtube/helpers.ts` : `extractYoutubeVideoId`, `parseDurationSeconds`, `formatDuration`.
- `convex/youtube/enrich.ts` : `enrichFromYoutube` (action CMS, réutilise le cache).
- L'interface `ContentProvider` + le registre `PROVIDERS` + `upsertIngested` (idempotent sur `(tenantSlug, source, externalId)`).
- `providerConfigs` dans les tenants (pattern utilisé par Wikipedia pour la locale).

Le schéma `contents` expose `kind: "video"` et `videoSource: { kind: "youtube", youtubeVideoId }` — les vidéos YouTube ingérées seront lisibles par le player mobile sans modification.

---

## Décision

### 1. Playlist-first, pas search-first

On n'utilise **pas** `search.list` pour aller chercher des vidéos par catégorie. On utilise :

1. **Playlist _uploads_ dérivée par calcul de string, zéro appel réseau** : `uploadsPlaylistId = "UU" + channelId.slice(2)` (mapping stable et documenté `UC…` → `UU…`). On **supprime** l'appel `channels.list`.
2. `playlistItems.list(playlistId, part: "contentDetails", maxResults: 50)` → liste des `videoId` paginée (1 unité par page de 50).
3. `videos.list(ids, part: "snippet,contentDetails")` **en appel direct** → titre, description, thumbnails, durée, **`snippet.tags`**, `categoryId`, `publishedAt` (1 unité par lot de 50).

**Pourquoi pas `search.list` ?** 100 unités/requête contre 1 unité pour `playlistItems`/`videos`. La personnalisation se fait au scoring (`getDiscoveryFeed`), pas à l'ingestion — la whitelist fournit le corpus, le moteur gère la pertinence.

### 2. Dual source : whitelist éditoriale + chaîne tenant

Un seul `youtubeProvider` résout les channels depuis deux sources, dans cet ordre :

```
channels = [
  ...resolveWhitelistChannels(locale, disableWhitelist),  // éditorial / démo
  ...resolveTenantChannels(providerConfig),               // chaîne du créateur
]
```

- **Whitelist** : `YOUTUBE_WHITELIST[locale]` — constante dans `youtube-whitelist.ts`, 17 chaînes FR curatées (chacune avec une `defaultCategory`), liste EN à remplir.
- **Tenant** : `providerConfigs.youtube.channelId` (+ `defaultCategory` optionnelle).
- **Opt-out whitelist** : `providerConfigs.youtube.disableWhitelist: true`.
- **Locale** : `providerConfigs.youtube.locale` (`"fr"` | `"en"`, défaut `"fr"`).

### 3. Normalisation vers `kind: "video"` — tags PAR VIDÉO

Chaque vidéo porte **ses propres** tags, extraits de `snippet.tags` — exactement comme une page Wikipedia porte ses catégories. La `defaultCategory` de la chaîne n'est plus qu'un **fallback** pour les vidéos sans tags.

```ts
type NormalizedYouTubeVideo = {
  tenantSlug: string;
  kind: "video";
  status: "published";
  slug: string;                          // buildYouTubeSlug(title, videoId)
  title: string;
  summary: string;                       // truncateSummary(description, 300)
  category: string;                      // tags[0] ?? channel.defaultCategory ?? normalizeScoringKey(channelTitle)
  tags: string[];                        // extractYouTubeTags(snippet.tags) : normalizeScoringKey, drop <3, dedup, cap 8
  isPremium: false;
  heroImageUrl?: string;                 // thumbnails.maxres ?? high ?? medium
  publishedAt: string;                   // snippet.publishedAt ISO 8601
  durationSeconds: number;               // parseDurationSeconds(contentDetails.duration)
  videoSource: {
    kind: "youtube";
    youtubeVideoId: string;
    youtubeUrl: string;                  // https://youtube.com/watch?v=<id>
  };
  source: "youtube";
  externalId: string;                    // videoId YouTube
  canonicalUrl: string;
};
```

**Conséquence directe** : les vidéos d'une même chaîne tombent dans des catégories différentes. Une vidéo Nota Bene (chaîne « histoire ») qui parle d'intelligence artificielle portera le tag `intelligence-artificielle` et remontera pour un utilisateur qui aime la tech, indépendamment de la catégorie nominale de la chaîne. C'est ce que la première version (catégorie = chaîne) interdisait.

### 4. Métadonnées par vidéo en appel direct + idempotence (pas de cache à l'ingestion)

Le provider **n'utilise pas** `convex-youtube-cache` : le cache ne stocke pas les `tags`, qui sont le signal de personnalisation. `videos.list` direct coûte la même chose (1 u/50) et renvoie tout. Deux garde-fous remplacent le bénéfice du cache, et le surpassent :

- **Filtre d'idempotence** : avant `videos.list`, on retire les `videoId` déjà présents dans `contents` (via `by_tenant_source_external`, internal query `filterNewExternalIds`). Une vidéo déjà ingérée n'est **jamais** re-fetchée.
- **Early-exit pagination** : `playlistItems.list` s'arrête dès qu'on retombe sur un `videoId` connu.

En régime permanent, une chaîne sans nouvelle vidéo coûte ~1 unité (le `playlistItems` de découverte), souvent zéro `videos.list`. Le composant `convex-youtube-cache` reste utilisé **uniquement** par `convex/youtube/enrich.ts` (chemin CMS, lookups répétés de la même URL).

**Runtime** : sans le cache, le provider est du plain-`fetch` pur → il tourne dans le runtime V8, comme `wikipedia` et `rss`. Pas de `"use node"`, `runDiscoveryIngestion` reste V8.

### 5. Extension du modèle `source` — trois endroits

Le literal `"youtube"` doit être ajouté à **trois** validateurs/types (sinon les écritures échouent) :

1. `convex/schema.ts` → union `contents.source`.
2. `convex/discovery/ingest.ts` → `ingestedContentValidator.source`, plus `videoSource` (union `youtube`|`hosted`) et `durationSeconds` en optionnels.
3. `convex/content/source.ts` → type `ContentSource`.

`videoSource` et `durationSeconds` existent déjà dans le **schéma** `contents` ; seul `ingestedContentValidator` doit les ajouter. L'isolation source est gratuite : `isEditorialContent()` renvoie `source === "cms"`, donc YouTube est auto-exclu des surfaces éditoriales et inclus dans `getDiscoveryFeed`. **Ne pas modifier `content/queries.ts`.**

### 6. `FetchDemand` ignoré

Le provider YouTube sync des chaînes, pas des recherches par catégorie — il **ignore** `demand` (comme RSS). Le contrat `ContentProvider` reste inchangé.

---

## Coût quota — exemple concret

YouTube Data API v3 : **10 000 unités/jour** par projet. Coût **par appel** (pas par vidéo) : `playlistItems.list` = 1 u (50 ids), `videos.list` = 1 u (50 vidéos), `search.list` = 100 u (non utilisé).

**Chaîne Nota Bene, run quotidien :**
- **Run #1 (cold start)** : playlist uploads dérivée (0 appel) → 150 vidéos récentes listées (3× `playlistItems` = 3 u) → métadonnées récupérées (3× `videos.list` = 3 u). **Total : 6 u.** Les 150 vidéos sont écrites dans `contents`.
- **Run #2 (lendemain)** : Nota Bene a publié 1 vidéo. Listing avec early-exit (1× `playlistItems` = 1 u) → filtre idempotence : 149 déjà connues, 1 nouvelle → métadonnée de cette seule vidéo (1× `videos.list` = 1 u). **Total : 2 u.**

**Whitelist entière (17 chaînes) :** ~102 u au tout premier run, puis **~34 u/jour** en régime permanent. Soit **0,3 %** du budget journalier. Même à raison d'un run horaire (24×/jour), on reste autour de 8 %. Le quota n'est pas une contrainte au stade prototype ; s'il le devenait (centaines de chaînes × plusieurs tenants), la sortie est une demande d'augmentation de quota Google (formulaire gratuit) ou un cache partagé — un sujet de scaling, pas de prototype.

---

## Options considérées

| Option | Rejetée parce que |
|---|---|
| `search.list` par catégorie (comme Wikipedia) | 100 unités/appel — quota épuisé avec plusieurs tenants et catégories |
| **`convex-youtube-cache` pour l'ingestion** | **le cache ne stocke pas `tags`/`categoryId` — il écrase le signal de personnalisation par vidéo. `videos.list` direct coûte autant (1 u/50) et renvoie tout.** |
| Catégorie = catégorie de la chaîne (1er jet) | colle toutes les vidéos d'une chaîne dans une seule catégorie → personnalisation impossible, contenu non pertinent proposé |
| `channels.list` pour la playlist uploads | inutile — `uploadsPlaylistId = "UU" + channelId.slice(2)` est un mapping stable, 0 appel |
| Un provider par mode (whitelist + creator séparés) | même pipeline fetch/normalize/upsert, split inutile |
| OAuth Google pour les vidéos privées | complexité disproportionnée ; les chaînes publiques couvrent le besoin prototype |
| Stocker les vidéos dans Convex/R2 | les vidéos restent sur YouTube ; seules les métadonnées sont ingérées |

---

## Conséquences positives

- Le feed de découverte contient des vidéos dès le premier déploiement (whitelist FR active par défaut).
- **Personnalisation granulaire** : chaque vidéo porte ses propres tags, donc une même chaîne alimente plusieurs centres d'intérêt. Le scoring traite vidéos YouTube et articles Wikipedia de façon identique.
- Un créateur configure sa chaîne en 30 secondes (suivi CMS) — ses vidéos apparaissent au prochain cron.
- Quota négligeable grâce au filtre d'idempotence + early-exit (~34 u/jour en régime permanent).
- Le player mobile n'est pas modifié : `videoSource.kind = "youtube"` est déjà géré.
- Provider 100 % plain-`fetch` → runtime V8, homogène avec `wikipedia`/`rss`, pas de `"use node"`.

## Conséquences négatives

- La whitelist est statique (dans le code) — ajouter une chaîne demande un déploiement. Une UI CMS de gestion de whitelist est un suivi naturel, hors scope.
- Le quota YouTube Data API v3 (10 000 u/jour) est partagé entre tous les tenants — à surveiller à grande échelle (voir section quota).
- La qualité du signal dépend du tagging des créateurs : une vidéo sans `snippet.tags` retombe sur la `defaultCategory` de la chaîne (fallback). C'est un plancher acceptable, pas le cas nominal.
