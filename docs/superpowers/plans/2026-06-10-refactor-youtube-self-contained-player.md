# Refactor — Player YouTube auto-contenu (sortir du provider natif)

> **Mobile-only refactor** (`app/` + `src/`), aucun changement backend. Branche actuelle `feat/youtube-iframe-player`. **Simplification par suppression** : YouTube quitte le `PersistentMediaPlayer` (conçu pour des players **natifs** expo-audio/expo-video) et devient un **composant inline auto-contenu** sur `/player`, avec **une seule source de vérité**. Résout d'un coup les bugs émergents (autoplay selon le chemin, contrôles désynchronisés) en retirant le second automate.

> **For agentic workers:** REQUIRED SUB-SKILL : `superpowers:subagent-driven-development` ou `superpowers:executing-plans`. **UI `app/`+`src/` → skill `frontend-design`, Jest (`npm test`).** La lecture WebView ne se valide pas en headless → **passe device manuelle** (iOS + Android) en plus du smoke Expo web (`docs/agents/ui-visual-testing.md`). Steps use `- [ ]`.

**Pourquoi.** La tentative de faire de YouTube une session de premier rang du `PersistentMediaPlayer` a créé un **second automate** (`youtubeState`, `youtubePlayIntent`, bridge, host offscreen, slot, `youtubeVisitedPlayerRef`, engine adapter) tissé dans un provider déjà chargé. Conséquences observées :
- **Autoplay marche selon le chemin de navigation** : Reprise/Historique (`pushWithReturn('/player/[id]')`, montage propre sur la route player) **démarre** ; le détail (`playYoutubeVideo()` appelé sur la route détail *puis* navigation) **ne démarre pas** (timing de montage divergent host/slot/`visitedRef`).
- **Contrôles désynchronisés** : `youtubePlayIntent` (nos contrôles) vs l'état réel du player YouTube = **deux sources de vérité** réconciliées à la main.

**Test de suppression.** Retirer « YouTube-dans-le-provider » **reconcentre** la complexité dans un seul composant inline simple → le code supprimé était une mauvaise couture, pas une profondeur qui paie.

## Décisions verrouillées

- **YouTube n'utilise PAS `PersistentMediaPlayer`.** Un composant **`YoutubeInlinePlayer`** auto-contenu possède son état (lecture, position, durée) — **une seule source de vérité = l'état du player YouTube** (via `YoutubePlayerSurface` + `onChangeState`/`onTimeUpdate`). **Plus de `youtubePlayIntent`.**
- **`/player/[id]` branche par type** : `youtube` → rend `YoutubeInlinePlayer` (hors provider) ; `episode`/`hostedVideo` → provider **inchangé**.
- **Le détail route vers `/player`** pour YouTube (comme hébergé/Reprise/Historique : `router.push('/player/[id]')`, **sans** pré-appeler quoi que ce soit). **Convergence** des 4 entrées sur `/player`, montage unique et propre → autoplay fiable.
- **Pas de mini-player cross-navigation pour YouTube.** Background + PiP sont **impossibles** derrière une WebView (limite assumée dès la conception). Quitter `/player` **arrête** la lecture YouTube. C'est le prix de la simplicité, et c'était de toute façon la limite réelle.
- **Reprise / historique / progression : conservés** via `usePlaybackProgress` **dans** `YoutubeInlinePlayer` (backend inchangé ; `getResume`/`getReadingHistory` marchent déjà). `seekTo(preferredResumeSeconds)` appliqué une fois prêt.
- **Autoplay : on ne le bride pas.** Il fonctionne (preuve : Reprise/Historique). `YoutubePlayerSurface` reçoit `play={true}` ; aucune logique « tap-to-start ».
- **Contenu / faible rayon de souffle** : épisode (`expo-audio`) et vidéo **hébergée** (`expo-video`/`VideoPipHost`) **strictement intouchés** ; leurs tests restent verts.
- Tokens/responsive/`midnight`, i18n modulaire, **dead code supprimé dans le même changement**.

## À SUPPRIMER (la machinerie sur-complexe)

- `src/features/media/youtube-player-bridge.tsx` (bridge + `ConnectedYoutubePlayerSurface`).
- `src/features/media/youtube-player-host.tsx` (host offscreen).
- `src/features/media/youtube-player-layout-context.tsx` (slot + `YoutubePlayerLayoutProvider`).
- `createYoutubePlaybackEngine` dans `src/features/media/playback-engine.ts` (le seam revient à 2 adaptateurs natifs — c'est correct).
- Dans `src/features/media/persistent-episode-player.tsx` : `YoutubeVideoTrack`, le kind `youtube` de `ActiveMediaSession`, `playYoutubeVideo`, `youtubeState`, `youtubePlayIntent`, `youtubeCommands`, `isYoutubeDurationFromPlayer`, `youtubePlayerRef`, `youtubeVisitedPlayerRef`, `youtubeHasStartedPlayingRef`, tous les `handleYoutube*`, le wrapper `PersistentMediaPlayerProviderInner`/`YoutubePlayerLayoutProvider`, le rendu `<YoutubePlayerHost>`. Le provider **revient à episode|hostedVideo**.
- Le branchement YouTube dans `src/components/media/persistent-media-mini-player.tsx` (le kind `youtube`).

## À GARDER

- `src/components/media/youtube-player.tsx` (`YoutubePlayerSurface`) — le player contrôlable, déjà bon (`play={play}`, `getCurrentTime`/`seekTo`/events).
- `src/features/media/youtube-player-state.ts` — réducteurs purs + `decideYoutubeResumeSeek` (réutilisés par `YoutubeInlinePlayer`).
- `convex/discovery/feed.ts` (fix `author`) et le cleanup `youtube-player.tsx` — déjà commités.

---

## Read First

- `CLAUDE.md`, `docs/agents/slice-workflow.md`, `docs/agents/ui-visual-testing.md`.
- `src/components/media/youtube-player.tsx` (`YoutubePlayerSurface` — l'API à consommer).
- `src/components/media/video-player-card.tsx` — la branche `source.kind === "youtube"` (Task-1 inline) montre déjà le **patron** : `usePlaybackProgress` + `onTimeUpdate` + `preferredResumeSeconds`. `YoutubeInlinePlayer` en est la version consolidée et seule.
- `src/features/media/use-playback-progress.ts` (signature `{ contentId, currentSeconds, durationSeconds, persistableDurationSeconds, canSyncRemote }`).
- `app/player/[id].tsx` — la branche `isYoutubeVideo` (slot, contrôles externes, focus effects, `playYoutubeVideo`) à remplacer par `YoutubeInlinePlayer`.
- `app/video/[id].tsx` — `onYoutubePlay` (l. 120-135) à réduire à `router.push('/player/[id]')`.
- `src/components/library/resume-card.tsx` / `src/components/history/history-row.tsx` — déjà `pushWithReturn('/player/[id]')` : **ne pas toucher** (c'est la référence qui marche).
- `src/features/media/persistent-episode-player.tsx`, `persistent-media-mini-player.tsx`, `playback-engine.ts` — pour la dépose chirurgicale de YouTube.
- Tests : `__tests__/youtube-player*.test.*`, `__tests__/video-detail.test.tsx`, `__tests__/persistent-media-player.test.tsx`, `src/features/media/playback-engine.test.ts`, `episode-playback`.

Standing rules : tokens + `useResponsive` ; i18n modulaire ; **dead code retiré** ; vérifier `midnight`.

---

## Scope Guard

**Inclut :** créer `YoutubeInlinePlayer` auto-contenu ; le brancher sur `/player` (branche youtube) ; réduire le détail à une navigation ; **supprimer** toute la machinerie YouTube du provider/bridge/host/slot/engine/mini-player ; mettre à jour les tests.

**N'inclut PAS :** backend ; episode/hosted (intouchés) ; mini-player cross-nav YouTube (volontairement abandonné) ; le bug « back recharge le feed » (**suivi séparé**, probablement re-query du feed au focus, non lié à YouTube).

---

## File Structure

- `src/components/media/youtube-inline-player.tsx` — NEW, auto-contenu (état + `usePlaybackProgress` + resume + contrôles).
- `app/player/[id].tsx` — branche youtube → `YoutubeInlinePlayer` ; retrait des focus effects/`playYoutubeVideo`/slot pour youtube.
- `app/video/[id].tsx` — `onYoutubePlay` → simple `router.push`.
- `src/components/media/video-player-card.tsx` — la branche youtube affiche poster + bouton qui route (plus de player inline ici).
- `src/features/media/{persistent-episode-player,persistent-media-mini-player,playback-engine}.tsx/.ts` — dépose de YouTube.
- **Supprimés** : `youtube-player-bridge.tsx`, `youtube-player-host.tsx`, `youtube-player-layout-context.tsx`.
- `__tests__/` — specs `YoutubeInlinePlayer` (mock lib) ; ajuster/retirer les tests de la machinerie supprimée.

---

### Task 1 : `YoutubeInlinePlayer` auto-contenu (Jest-first)

- [ ] **Step 1 (Jest) :** spec un composant qui, donné `{ contentId, videoId, durationSeconds?, canSyncRemote }`, possède son état via `YoutubePlayerSurface` (`onTimeUpdate` → currentSeconds/duration ; `onSnapshotChange`/`onStateChange` → playing/finished), câble `usePlaybackProgress`, applique `preferredResumeSeconds` (resume une fois), et expose des contrôles (play/pause/seek) **dérivés du player** (pas d'« intent » parallèle). Mock `react-native-youtube-iframe`.
- [ ] **Step 2 :** implémenter. `play={true}` au montage (autoplay OK). Tokens/responsive. Réutiliser `youtube-player-state.ts`.
- [ ] **Step 3 :** `npm test` + `tsc`. **Commit** — `feat(video): self-contained inline YouTube player`.

### Task 2 : Brancher `/player` + réduire le détail

- [ ] **Step 1 :** `app/player/[id].tsx` — branche `isYoutubeVideo` rend `<YoutubeInlinePlayer .../>` ; **supprimer** le slot, les `useFocusEffect`/`useEffect` qui appelaient `playYoutubeVideo`, et les contrôles externes propres à youtube (le player a ses contrôles natifs ; garder le lien « Ouvrir dans YouTube » + la note background).
- [ ] **Step 2 :** `app/video/[id].tsx` — `onYoutubePlay` → uniquement `router.push('/player/[id]')`. `video-player-card.tsx` branche youtube → poster + bouton play qui déclenche `onYoutubePlay` (plus de `YoutubePlayerSurface`/`usePlaybackProgress` inline ici).
- [ ] **Step 3 :** `npm test` + `tsc`. **Commit** — `feat(video): route YouTube through /player via inline player`.

### Task 3 : Déposer YouTube du provider/bridge/host/slot/engine

- [ ] **Step 1 :** retirer de `persistent-episode-player.tsx` tout le bloc YouTube (cf. « À SUPPRIMER ») ; `ActiveMediaSession` revient à `episode | hostedVideo` ; supprimer le wrapper `…Inner`/`YoutubePlayerLayoutProvider`. Retirer `playYoutubeVideo` du contexte + fallback.
- [ ] **Step 2 :** retirer le kind `youtube` de `persistent-media-mini-player.tsx` ; retirer `createYoutubePlaybackEngine` de `playback-engine.ts`. **Supprimer** les 3 fichiers bridge/host/layout-context.
- [ ] **Step 3 :** ajuster/retirer les tests de la machinerie supprimée ; **episode + hosted tests verts** ; `grep` qu'aucune référence morte ne subsiste (`playYoutubeVideo`, `youtubePlayIntent`, `Connected…`, `YoutubePlayerHost`, `YoutubePlayerSlot`). **Commit** — `refactor(media): remove YouTube from the persistent native player`.

### Task 4 : Vérification du slice (standard)

- [ ] `npm test` PASS ; `npx tsc --noEmit` clean ; `git status --short` clean.
- [ ] Smoke Expo web phone + iPad (détail vidéo + /player), palette `midnight` + claire.
- [ ] **Passe device (iOS + Android)** : autoplay depuis **détail**, **Reprise**, **Historique** (les 3 doivent démarrer identiquement) ; contrôles synchronisés avec la lecture ; reprise à la bonne position ; quitter /player arrête YouTube (pas de faux mini-player) ; lien « Ouvrir dans YouTube » OK.
- [ ] Non-régression : épisode (lock-screen) + vidéo hébergée (PiP) inchangés.

---

## Self-Review

- **Une seule source de vérité** (l'état du player YouTube) → fin des contrôles désynchronisés.
- **Montage unique sur `/player`** pour les 4 entrées → autoplay fiable et identique partout.
- **Suppression nette** (test de suppression validé) : provider/bridge/host/slot/engine YouTube partent ; le provider redevient simple (2 backends natifs).
- **Limites assumées** : pas de mini-player/background/PiP YouTube — c'était inatteignable, on arrête de payer pour.
- **Contenu** : episode/hosted intouchés et verts ; reprise/historique conservés (backend inchangé).

## After This Slice

- **Bug « back recharge le feed »** — investiguer séparément (probable re-query du feed de découverte au focus/remount, indépendant de YouTube).
- Indice UI optionnel si un 1er tap manuel reste parfois nécessaire selon device.
