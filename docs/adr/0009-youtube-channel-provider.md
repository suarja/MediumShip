# ADR 0004 — YouTube Channel Provider : playlist-first, whitelist éditoriale et réutilisation du cache existant

## Statut

Proposé

## Date

2026-06-07

## Contexte

Le Discovery Engine (ADR 0003) ingère du contenu depuis plusieurs providers enregistrés dans `PROVIDERS`. Wikipedia et RSS sont opérationnels. YouTube est la prochaine source prioritaire pour deux raisons :

1. **Cas créateur** : un tenant peut vouloir importer automatiquement les vidéos de sa propre chaîne YouTube dans le feed de découverte, sans saisie manuelle dans le CMS.
2. **Cas démo** : sans chaîne configurée, le feed ne contient aucune vidéo ingérée. Une whitelist éditoriale de chaînes francophones de qualité donne au feed de découverte une richesse immédiate, symétrique au rôle que joue Wikipedia pour les articles.

Le projet dispose déjà de :
- `convex-youtube-cache` (composant installé), exposant `cache.getVideo(ctx, { videoId })` avec mise en cache automatique des réponses Data API v3.
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

1. `channels.list(channelId, part: "contentDetails")` → récupère l'ID de la playlist _uploads_.
2. `playlistItems.list(playlistId, part: "contentDetails", maxResults: 50)` → liste des `videoId` paginée.
3. Batch `videos.list(ids, part: "snippet,contentDetails")` via `convex-youtube-cache` → titre, description, thumbnail, durée, tags, catégorie.

**Pourquoi pas `search.list` ?** Une requête `search.list` coûte 100 unités YouTube Data API v3. Un appel `playlistItems.list` coûte 1 unité pour 50 vidéos. Avec 10 000 unités/jour, la recherche serait épuisée en quelques heures sur plusieurs tenants. La personnalisation par catégorie se fait au moment du scoring (`getDiscoveryFeed`), pas à l'ingestion — la whitelist fournit le corpus, le moteur gère la pertinence.

### 2. Dual source : whitelist éditoriale + chaîne tenant

Un seul `youtubeProvider` résout les channelIds depuis deux sources, dans cet ordre :

```
channelIds = [
  ...resolveWhitelistChannels(locale, disableWhitelist),  // éditorial / démo
  ...resolveTenantChannels(providerConfig),               // chaîne du créateur
]
```

- **Whitelist** : `YOUTUBE_WHITELIST[locale]` — constante dans `youtube-whitelist.ts` (déjà créé), 17 chaînes FR curatées, liste EN à remplir.
- **Tenant** : `providerConfigs.youtube.channelId` — URL ou ID de chaîne saisi dans le CMS tenant settings.
- **Opt-out whitelist** : `providerConfigs.youtube.disableWhitelist: true` désactive la whitelist pour un tenant qui ne veut que sa propre chaîne.
- **Locale** : `providerConfigs.youtube.locale` (`"fr"` | `"en"`, défaut `"fr"`), miroir du pattern Wikipedia.

### 3. Normalisation vers `kind: "video"`

Toutes les vidéos YouTube ingérées deviennent `kind: "video"` avec :

```ts
type NormalizedYouTubeVideo = {
  tenantSlug: string;
  kind: "video";
  status: "published";
  slug: string;                          // normalizeScoringKey(title) + "-" + videoId[:6]
  title: string;
  summary: string;                       // description tronquée à 300 chars
  category: string;                      // defaultCategory de la whitelist, ou slug du premier tag
  tags: string[];                        // YouTube tags normalisés via normalizeScoringKey, max 8
  isPremium: false;
  heroImageUrl?: string;                 // maxres thumbnail si disponible, sinon hqdefault
  publishedAt: string;                   // snippet.publishedAt ISO 8601
  durationSeconds: number;               // parseDurationSeconds(contentDetails.duration)
  videoSource: {
    kind: "youtube";
    youtubeVideoId: string;
    youtubeUrl: string;                  // https://youtube.com/watch?v=<id>
  };
  source: "youtube";
  externalId: string;                    // videoId YouTube
  canonicalUrl: string;                  // https://youtube.com/watch?v=<id>
};
```

### 4. Réutilisation du cache existant

`cache.getVideo(ctx, { videoId })` (depuis `convex-youtube-cache`) est appelé en batch par lot de 50 IDs. La clé API reste dans `YOUTUBE_DATA_API_KEY`. Aucune nouvelle dépendance n'est introduite.

### 5. Extension de `ingestedContentValidator`

`videoSource` et `durationSeconds` sont ajoutés comme champs optionnels dans le validator partagé de `upsertIngested`. Le type discriminant `source: "youtube"` est ajouté à l'union. Côté schéma Convex, ces champs existent déjà dans `contents` — seul le validator d'ingestion doit être étendu.

### 6. `FetchDemand` non modifié

Le provider YouTube ignore `demand.categories` au moment du fetch (il sync les chaînes, pas des recherches par catégorie). Il lit `demand.serendipityCount` pour décider combien de vidéos récentes ajouter depuis les chaînes whitelist en mode sérendipité. Le contrat `ContentProvider` reste inchangé.

---

## Options considérées

| Option | Rejetée parce que |
|---|---|
| `search.list` par catégorie (comme Wikipedia) | 100 unités/appel — quota épuisé avec plusieurs tenants et catégories |
| Un provider par mode (whitelist + creator séparés) | Même pipeline fetch/normalize/upsert, split inutile |
| OAuth Google pour les vidéos privées | Complexité disproportionnée ; les chaînes publiques couvrent le besoin prototype |
| Stocker les vidéos dans Convex/R2 | Les vidéos restent sur YouTube ; seules les métadonnées sont ingérées |
| Appeler YouTube API directement sans cache | Le composant `convex-youtube-cache` est déjà installé et gère le quota |

---

## Conséquences positives

- Le feed de découverte contient des vidéos dès le premier déploiement (whitelist FR active par défaut).
- Un créateur configure sa chaîne en 30 secondes via le CMS — ses vidéos apparaissent au prochain cron.
- La personnalisation (catégorie/tag affinités) s'applique identiquement aux vidéos YouTube et aux articles Wikipedia.
- Le cache `convex-youtube-cache` évite les appels répétés à l'API — quota préservé même avec plusieurs tenants.
- Le player mobile n'est pas modifié : `videoSource.kind = "youtube"` est déjà géré.

## Conséquences négatives

- La whitelist est statique (dans le code) — ajouter une chaîne demande un déploiement. Une UI CMS de gestion de whitelist est un suivi naturel mais hors scope maintenant.
- Le quota YouTube Data API v3 (10 000 unités/jour) est partagé entre tous les tenants. À surveiller si le nombre de tenants et de chaînes configurées augmente significativement.
- Les vidéos ingérées héritent des tags YouTube tels quels — la qualité du signal de scoring dépend de la qualité du tagging des créateurs.
