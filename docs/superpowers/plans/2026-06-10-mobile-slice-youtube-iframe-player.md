# Slice — Player YouTube contrôlable (IFrame Player API)

> **Mobile-only vertical slice** (`app/` + `src/`), aucun changement backend. Brancher depuis `dev` (à jour). Remplace l'embed YouTube **opaque** (iframe nu en WebView) par le **YouTube IFrame Player API** (`react-native-youtube-iframe`), pour rendre la lecture **contrôlable** : capter la position, **reprendre** où on s'était arrêté, et faire entrer YouTube dans le **player persistant** (mini-player en navigation). Le backend reprise/historique livré le 2026-06-10 est **agnostique du moteur** → il se branche tel quel.

> **For agentic workers:** REQUIRED SUB-SKILL : `superpowers:subagent-driven-development` ou `superpowers:executing-plans`. **UI `app/`+`src/` → skill `frontend-design`, mockups `docs/podapp/project/mobile-mockups/` = vérité visuelle, Jest (`npm test`).** La lecture WebView ne se valide pas en headless → **passe manuelle sur device** (iOS **et** Android si possible) en plus du smoke Expo web (`docs/agents/ui-visual-testing.md`). Steps use `- [ ]`.

**Goal :** aujourd'hui une vidéo YouTube est un `<iframe src>` nu dans une `react-native-webview` (`src/components/media/video-player-card.tsx`, branche `source.kind === "youtube"`) : **boîte noire** — impossible de lire `getCurrentTime()` ni de `seekTo()`, et elle **se recharge à zéro** au remount (fermer/restaurer repart du début). Cible : un player **contrôlable** qui (1) **capte** la progression et la sauve via le `usePlaybackProgress` existant, (2) **reprend** à la position sauvegardée (`seekTo` au chargement), (3) **survit à la navigation** dans le player persistant comme l'épisode/la vidéo hébergée.

**Contexte stratégique :** le produit s'appuie fortement sur du contenu **importé depuis YouTube** (provider + whitelist + moteur de découverte). YouTube est donc un type vidéo **primaire**, pas marginal — d'où l'investissement justifié dans un player de qualité.

## Décisions verrouillées

- **YouTube devient une session de premier rang du player persistant.** Étendre `ActiveMediaSession` (`src/features/media/persistent-episode-player.tsx`) avec un kind **`youtube`**, et écrire un **`createYoutubePlaybackEngine`** qui satisfait l'interface `PlaybackEngine` existante (`src/features/media/playback-engine.ts` : `currentTime/duration/isPlaying/play/pause/seekTo`). **Réutilise** `usePlaybackProgress` (reprise/sauvegarde) + `useContentEngagement` (déjà câblé) → **zéro changement backend**, et l'item YouTube hérite **gratuitement** de la barre de progression dans l'Historique / la carte Reprise.
- **Tech player : `react-native-youtube-iframe`** (s'appuie sur `react-native-webview`, **déjà installé**). C'est le wrapper mûr du IFrame Player API : `ref.getCurrentTime()` / `getDuration()` / `seekTo()` + events `onChangeState`/`onReady`. Pas de bridge `postMessage` à réécrire à la main.
- **Pas de PiP OS pour YouTube — le mini-player EST le PiP.** Le vrai PiP iOS exige un `AVPlayer` (réservé à la vidéo hébergée via `VideoPipHost`) : inaccessible derrière une WebView. À la place, la WebView YouTube est **montée de façon persistante** dans le provider (analogue à `VideoPipHost`) → un **mini-player docké in-app** qui survit à la navigation. **Ne pas exposer de bouton PiP** sur la vidéo YouTube.
- **Lecture en arrière-plan / écran verrouillé : non.** Les embeds YouTube se mettent en pause quand l'app passe en fond — **comportement accepté et documenté** (pas de Now Playing / lock-screen pour YouTube, contrairement à l'audio/hébergé).
- **`embeddable=false` : hors scope.** Le flag est appliqué côté serveur par YouTube ; le IFrame API reste de l'embedding → ces vidéos ne se débloquent pas. Elles sont **déjà filtrées à l'ingestion** (Lot A) ; garder le **deep-link « Ouvrir dans YouTube »** (`getYoutubeLaunchUrl`) comme repli. Ne pas tenter de les « débloquer ».
- **Contenu / faible rayon de souffle.** Ne toucher **que** le chemin `source.kind === "youtube"` + le nouveau kind de session. La vidéo **hébergée** (`expo-video`, `VideoPipHost`) et l'**audio** (`expo-audio`) restent **intouchées** ; leurs tests doivent rester verts.
- **Fondation.** Tokens de thème uniquement (jamais de hex/taille en dur), `useResponsive`, vérifier `midnight` ; i18n modulaire ; **dead code retiré dans le même changement** (la construction d'HTML iframe nu `buildYoutubeEmbedHtml` disparaît).

---

## Read First

**Protocole agent (obligatoire) :**
- `CLAUDE.md` (fondation mobile, tests, commit workflow).
- `docs/agents/slice-workflow.md` (rôles, boucle, invariants).
- `docs/agents/ui-visual-testing.md` (smoke Expo web ; **+ passe device manuelle** car WebView non drivable headless).

**Player & seam existants (à étendre, pas réécrire) :**
- `src/features/media/playback-engine.ts` → interface `PlaybackEngine` + `VideoPlaybackState`. **Cible du nouvel adaptateur** `createYoutubePlaybackEngine`.
- `src/features/media/persistent-episode-player.tsx` → `ActiveMediaSession` (union à étendre), montage du player, application de `preferredResumeSeconds` (la logique de reprise « une fois par contenu » est ici, l. 415-462), `<VideoPipHost>` (modèle de host persistant). **Le YouTube host se calque dessus.**
- `src/features/media/use-playback-progress.ts` + `playback-progress.ts` → prennent `currentSeconds`/`durationSeconds`/`persistableDurationSeconds` (**agnostiques du moteur** : rien à changer).
- `src/features/media/video-pip-host.tsx` → patron du host persistant survivant à la navigation (à imiter pour `YoutubePlayerHost`).
- `src/components/media/video-player-card.tsx` → branche `source.kind === "youtube"` (l. 125-221) à **remplacer** ; garder le repli « Ouvrir dans YouTube » (`getYoutubeLaunchUrl`) et l'état `unavailable`.
- `src/features/content/selectors.ts` → `getYoutubeVideoId` / `getYoutubeEmbedUrl` / `getYoutubeLaunchUrl` (l. 79-112). L'IFrame API a besoin du **videoId** (`getYoutubeVideoId`), pas de l'URL d'embed.
- `app/video/[id].tsx` (route YouTube → faire pointer vers `/player/[id]` comme l'hébergé, l. 110-115) ; `app/player/[id].tsx` (surface player qui lit `usePersistentMediaPlayer()`).
- `src/features/tenant/public-config.ts` → `hasCapability(enabledModules, "progressSync")` (gate de la sync membre, déjà utilisé l. 178-181 du provider).

**Tests à garder verts :** `__tests__/episode-playback.test.tsx`, `src/features/media/video-pip.test.ts`, `src/features/media/playback-engine.test.ts`, `__tests__/playback-progress.test.ts`, `__tests__/detail-hero.test.tsx`, et tout test ciblant `video-player-card`.

Standing rules : tokens + `useResponsive` (jamais de littéral) ; i18n modulaire ; **dead code retiré** ; vérifier `midnight`.

---

## Scope Guard

**Inclut :**
- Dépendance `react-native-youtube-iframe` + composant player YouTube contrôlable.
- Capture de position + reprise (`seekTo` au chargement) pour YouTube, via `usePlaybackProgress` inchangé.
- `createYoutubePlaybackEngine` (3ᵉ adaptateur du seam) + kind de session `youtube` + `playYoutubeVideo` + host persistant (mini-player docké).
- Route détail YouTube → player persistant ; repli « Ouvrir dans YouTube » conservé.
- i18n des nouveaux libellés ; nettoyage de l'ancien embed iframe nu.

**N'inclut PAS :**
- Backend (le modèle reprise/historique est déjà là et suffit).
- PiP OS pour YouTube (impossible) ; lecture background YouTube (impossible) — documenter, pas implémenter.
- « Débloquer » les chaînes `embeddable=false` (hors de portée technique).
- Toute modification du player **hébergé** (`expo-video`/`VideoPipHost`) ou **audio**.

---

## File Structure

- `package.json` — +`react-native-youtube-iframe`.
- `src/components/media/youtube-player.tsx` — player contrôlable (WebView IFrame API), expose `currentTime`/`duration`/état + `seekTo`/`play`/`pause` via ref/props (NEW).
- `src/features/media/playback-engine.ts` — +`createYoutubePlaybackEngine`.
- `src/features/media/youtube-player-host.tsx` — host persistant survivant à la navigation, calqué sur `video-pip-host` (NEW).
- `src/features/media/persistent-episode-player.tsx` — +kind `youtube` dans `ActiveMediaSession`, +`playYoutubeVideo`, branchement engine/host/resume.
- `src/components/media/video-player-card.tsx` — branche YouTube → délègue au player persistant ; suppression de `buildYoutubeEmbedHtml`.
- `app/video/[id].tsx` — play YouTube route vers `/player/[id]`.
- `src/i18n/locales/{fr,en}/video.ts` — libellés (si nouveaux).
- `__tests__/` — specs Jest (engine, message/état purs, composant mocké).

---

### Task 1 : Player YouTube contrôlable + capture/reprise inline (MVP indépendant)

> **Frontière MVP :** à la fin de cette task, une vidéo YouTube **capte sa position, la sauvegarde et reprend** — sans encore le mini-player persistant. Mergeable seul.

- [ ] **Step 1 :** `npm i react-native-youtube-iframe` ; vérifier qu'il résout via `react-native-webview` déjà présent (pas de dev-build requis pour la WebView).
- [ ] **Step 2 (Jest-first) :** extraire la **logique pure** testable — décision de reprise (réutiliser `resolveResumeTarget`/`resolveProgressAction` de `playback-progress.ts`) et un petit réducteur d'état player YouTube (`onChangeState` → `{ isPlaying, hasFinished }`). Specs Jest sans rendu.
- [ ] **Step 3 :** `youtube-player.tsx` — `<YoutubePlayer videoId play onChangeState ... />`, polling `getCurrentTime()`/`getDuration()` (~toutes les 1 s pendant la lecture), exposés au parent via callbacks `onTime({ currentSeconds, durationSeconds })`. **Reprise :** au `onReady`/premier play, `seekTo(preferredResumeSeconds)` si fourni. Tokens/responsive ; `playsinline`/`allowsInlineMediaPlayback`. Tester en mockant `react-native-youtube-iframe`.
- [ ] **Step 4 :** brancher inline dans la branche `source.kind === "youtube"` de `video-player-card.tsx` : alimenter `usePlaybackProgress({ contentId, durationSeconds, currentSeconds, canSyncRemote })`, appliquer `preferredResumeSeconds` au player, `saveFinal` à la fermeture. **Supprimer** `buildYoutubeEmbedHtml` + l'ancien rendu iframe nu (dead code). Garder le bouton « Ouvrir dans YouTube » et l'état `unavailable`.
- [ ] **Step 5 :** `npm test` + `npx tsc --noEmit` clean. **Commit** — `feat(video): controllable YouTube player with resume (IFrame API)`.

### Task 2 : Adaptateur moteur `createYoutubePlaybackEngine` (seam)

- [ ] **Step 1 (Jest) :** spec `createYoutubePlaybackEngine` → satisfait `PlaybackEngine` : `currentTime/duration/isPlaying/isBuffering/error/justFinished` lus d'un `VideoPlaybackState`-like, `play/pause/seekTo` délèguent à un handle (ref du player ou commandes). Mêmes invariants que `createVideoPlaybackEngine`.
- [ ] **Step 2 :** implémenter dans `playback-engine.ts` (3ᵉ adaptateur — « deux adaptateurs = un vrai seam », on en a trois maintenant, le seam est confirmé).
- [ ] **Step 3 :** Jest + `tsc` clean. **Commit** — `feat(media): youtube playback engine adapter`.

### Task 3 : Session persistante + mini-player docké (parité navigation)

- [ ] **Step 1 :** étendre `ActiveMediaSession` avec `{ kind: "youtube" } & { contentId, title, youtubeVideoId, artworkUrl?, durationSeconds? }` ; ajouter `playYoutubeVideo(track)` dans le provider (sur le modèle de `playHostedVideo`, en flushant la progression du média précédent).
- [ ] **Step 2 :** `youtube-player-host.tsx` — monte la WebView YouTube **persistante** dans l'arbre du provider (calqué sur `video-pip-host.tsx`) ; survit à la navigation ; pousse `currentTime`/état dans le state lu par l'engine ; applique la reprise « une fois par contenu » (réutiliser le pattern `appliedResumeRef`/`pendingResumeRef`).
- [ ] **Step 3 :** câbler l'engine YouTube dans le sélecteur d'engine du provider (à côté de hosted/episode) ; **mini-player docké** pour le kind `youtube` (réserver l'espace layout comme l'épisode via `usePersistentMediaPlayerSpace`) ; **pas de bouton PiP**.
- [ ] **Step 4 :** `app/video/[id].tsx` → play YouTube `router.push('/player/[id]')` (comme l'hébergé) ; `app/player/[id].tsx` rend la surface YouTube. i18n des libellés nouveaux.
- [ ] **Step 5 :** `npm test` + `tsc` clean ; tests hébergé/audio **toujours verts**. **Commit** — `feat(video): persistent YouTube session with docked mini-player`.

### Task 4 : Vérification du slice (standard — toujours)

- [ ] `npm test` (Jest) PASS ; `npx tsc --noEmit` clean ; `git status --short` clean. (Pas de Convex dans ce slice.)
- [ ] **Smoke Expo web** (`docs/agents/ui-visual-testing.md`) phone + iPad sur le détail vidéo (rendu, états, palette **`midnight`** + claire).
- [ ] **Passe device manuelle (obligatoire, non headless)** : sur un appareil réel, vérifier (a) la **reprise** (rouvrir une vidéo YouTube → reprend à la bonne seconde), (b) la **barre de progression** de cet item dans l'Historique + la carte Reprise, (c) le **mini-player docké** survit à la navigation, (d) noter le **comportement background/lock** (pause attendue), (e) le repli « Ouvrir dans YouTube » marche. Couvrir iOS **et** Android si possible.
- [ ] Confirmer **non-régression** : vidéo hébergée (PiP natif), audio épisode (lock-screen) inchangés.

---

## Self-Review

- **Réutilisation du seam** : YouTube satisfait `PlaybackEngine` comme les deux autres backends → reprise/historique/mini-player **gratuits**, **zéro backend**. La logique de reprise « une fois par contenu » du provider est réutilisée, pas dupliquée.
- **Honnêteté des limites** : pas de PiP OS ni de background pour YouTube (impossible derrière WebView) — assumé et documenté, le mini-player docké est la réponse UX ; `embeddable=false` reste filtré + repli deep-link.
- **Contenu** : seule la branche `youtube` bouge ; hébergé/audio intouchés et testés verts.
- **Incrémental** : Task 1 livre déjà reprise+historique YouTube (mergeable seule) ; Tasks 2-3 ajoutent la parité mini-player.
- **Fondation** : tokens/responsive/`midnight`, i18n modulaire, ancien embed iframe nu supprimé.

## After This Slice

- Si le background/lock YouTube est jugé trop dégradé en usage réel : envisager un repli « audio-only continue » (hors scope, probablement impossible proprement avec YouTube ToS).
- Re-tester `embeddable` à l'ingestion si YouTube change le comportement du IFrame API.
- Décision de garder/retirer le deep-link « Ouvrir dans YouTube » selon le ressenti une fois la reprise en place.
