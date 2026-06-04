# Hand-off — Milestone 3B + 3C

> Prompt prêt à coller à un agent. Implémente les sous-phases 3B puis 3C du plan
> `docs/superpowers/plans/2026-06-04-milestone-3-premium-video-offline.md`.
> **3A est déjà shippé et vérifié** (entitlement modulaire + upload R2) — voir le récap de vérif plus bas.

---

## Prompt

Implémente les sous-phases **3B puis 3C** du plan `docs/superpowers/plans/2026-06-04-milestone-3-premium-video-offline.md`, tâche par tâche, **commit après chaque tâche** (`Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`). Lis le plan en entier d'abord. **3A est déjà shippé et vérifié** (entitlement modulaire `entitlements` + `useIsMember()`/`requireMember` + upload R2) — ne le refais pas, **appuie-toi dessus**. Ne commence pas 3C avant que 3B soit vérifié.

### 3B — Engagement

1. **Bookmarks** (3B.1) : table `bookmarks` (`tokenIdentifier`, `contentId`, `createdAt`) + index par user ; mutation `toggleBookmark` et query `listBookmarks` **gardées auth/membre** (réutilise le pattern de garde de `convex/entitlements/authz.ts`) ; bouton bookmark sur les écrans détail (article/episode/video) + une liste « Enregistrés ». Invité → CTA sign-in (guest-first). Teste le seam mutation/query. Commit.
2. **Sync progression membre** (3B.2) : construis sur `src/features/media/playback-progress.ts` (garde AsyncStorage pour les invités) ; pour un membre signé-in, lis/écris aussi une table Convex `playbackProgress` (`tokenIdentifier`, `contentId`, `seconds`, `updatedAt`), last-write-wins, throttlé. À la lecture, reprends à `max(local, remote)`. Optionnel : migrer local→remote au sign-in. Commit puis **vérifie 3B** (`chore: ship milestone 3B`).

### 3C — Robustesse

1. **Téléchargements offline premium** (3C.1) : membres uniquement — télécharge `Article` (texte+cover), `Episode` (mp3), `HostedVideo` (fichier R2) via `expo-file-system` ; track local des items téléchargés ; lecture/lecture depuis la copie locale hors-ligne. **YouTube non téléchargeable** (note-le). Gate derrière l'entitlement membre (`useIsMember()`), liste « Téléchargements ». Commit.
2. **Bannière incident + mode dégradé** (3C.2) : canal de statut externe (remote-config/status fetch léger) → bannière incident dismissible (réutilise le style de `src/components/content/degraded-banner.tsx`) ; resserre les états de dégradation réseau existants (lectures cache-first, message offline clair). Commit puis **vérifie 3C** (`chore: ship milestone 3C`).

### Réfs à réutiliser

- Entitlement / garde déjà en place : `convex/entitlements/{queries,authz}.ts` + hook `src/features/membership/use-is-member.ts`.
- R2 (pour télécharger le fichier hébergé) : `convex/media/r2.ts` (`getKeyUrl`).
- Progression locale existante : `src/features/media/playback-progress.ts`.
- Patterns mobiles éprouvés dans `../editia/mobile` (bookmarks, offline) avant d'inventer.

### Contraintes

- **Jamais de couleur hardcodée** : tout via `theme.colors.*` / `withAlpha`, vérifie contre la palette `midnight` (cf. `CLAUDE.md`).
- **Guest-first** : chaque capacité membre dégrade en CTA sign-in ; la lecture publique ne demande jamais d'auth.
- Helpers purs testables séparés du runtime ; chaque sous-phase = slice verticale testable.
- Variables d'env éventuelles via `npx convex env set`, noms seuls dans `.env.example`.
- **Vérif de fin de chaque sous-phase :** `npx jest` (root), root `tsc`, CMS `tsc` + `next build` propres.
- NE PAS toucher au wishlist `docs/FEATURES.md` ni au multi-backend failover (hors scope).

---

## Vérification 3A (déjà fait — contexte)

| Tâche 3A | État | Notes |
|---|---|---|
| 3A.1 Entitlement modulaire | ✅ | Table `entitlements` (`source: manual\|revenuecat\|stripe`), read API stable (`getMyEntitlement` → `{isPro}`, null = invité), `requireMember` guard, seam pur `isProFromEntitlement`. Seam RevenueCat documenté. |
| — gate mobile | ✅ | `useIsMember()` + `resolvePremiumGate` (pur, testé) sur article/episode/video/player ; `PremiumPaywall` thémé ; invité = non-membre → paywall. |
| — CMS Users tab | ✅ | `users-tab.tsx` + `listUsers` query + `grantMembership`/`revokeMembership` gardés `requireCmsAdmin`. |
| 3A.2 R2 register | ✅ | `app.use(r2)` dans `convex.config.ts`, `convex/media/r2.ts` avec `checkUpload` admin-gardé, `getKeyUrl` public/signé. |
| 3A.3 Upload CMS | ✅ | `R2UploadField` pour cover + vidéo hébergée (`playbackUrl`/`uploadKey`), fallback URL distante conservé. |
| 3A.4 Verify | ✅ | jest 95/95, root tsc, CMS tsc + `next build` propres. |
