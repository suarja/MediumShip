# Milestone 3 — Premium, hosted video, offline

> **For agentic workers:** Implement task-by-task, commit after each task. This is the monetization + robustness milestone from `docs/plans/2026-06-03-mediumship-architecture-design.md` (§ Milestone 3). It is large, so it is split into **three shippable sub-phases (3A / 3B / 3C)** — treat each as an independent vertical slice that ships on its own. Do **not** start 3B before 3A is verified.

**Goal:** Turn MediumShip from a free reader into a monetizable, robust premium media app: a real member entitlement that unlocks premium content, hosted-video upload from the CMS, bookmarks, cross-device progress, offline premium downloads, and a clean incident/degraded experience.

---

## Read first

- **Architecture scope:** `docs/plans/2026-06-03-mediumship-architecture-design.md` § *Milestone 3* + § *Member access* (`CmsRole`, member capabilities) + § *Resilience Strategy*.
- **Mockup (design inspiration):** `docs/podapp/project/sections.jsx` and `docs/podapp/project/cms/preview.jsx` — read the **Paywall** (preview.jsx ~146-195) and **Player** (~103-145) screens; the mobile `sections.jsx` premium/abonnement/player blocks (~39-104). Recreate the *visual intent*, themed via `theme.colors.*` (never hardcode colors — see CLAUDE.md).
- **Proven Convex component patterns (reuse, don't reinvent):**
  - **R2 storage:** `../editia/web/convex/media/r2.ts` (singleton `new R2(components.r2)` + `r2.clientApi<DataModel>({})` exposing `generateUploadUrl`/`syncMetadata`); client `useUploadFile(api.media.r2)` (`../editia/web/components/builder/course/lesson-cover-uploader.tsx`, `r2-image.tsx`). Component **76 Cloudflare R2** in `docs/convex-components-descriptions.md`. Env: `R2_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`.
  - **Premium entitlement:** `../editia/web/convex/` (`convex-revenuecat` component + schema entitlement fields). The YouTube enrichment we just shipped (`convex/youtube/`) shows the component-registration + auth-guarded action pattern to mirror.

## What ALREADY exists (audit before building — do not duplicate)

- ✅ **Premium *flag* + gating UI:** `content.isPremium`, `src/components/content/premium-access-banner.tsx`, gates on `app/{article,episode,video,player}/[id].tsx`, `app/(app)/premium.tsx`, premium filtering in `src/features/tenant/public-config.ts`, premium module toggle in tenant config.
  - ⚠️ **Gap:** the gate currently blocks *everyone* — there is **no way for a user to become premium**. 3A makes it unlockable.
- ✅ **Hosted-video playback:** the persistent media player + `app/player/[id].tsx` already play `videoSource.kind === "hosted"` `playbackUrl`.
  - ⚠️ **Gap:** `playbackUrl` is pasted by hand; no upload. 3A adds R2 upload.
- ✅ **Local progress:** `src/features/media/playback-progress.ts` (AsyncStorage, guest-first).
  - ⚠️ **Gap:** not synced across devices for members. 3B adds Convex sync.
- ❌ Not started: entitlement model, R2 upload, bookmarks, progress sync, offline downloads, incident banner.

## ⚠️ Decision to confirm with the user before 3A

**How does a user become premium?** Options:
1. **Simple entitlement flag (recommended MVP):** a `members`/entitlement field on the Convex user, grantable from the CMS (admin) + readable by mobile. Unlocks the full gating loop end-to-end *now*, no store review. RevenueCat layers on later writing the same field.
2. **RevenueCat IAP** (Editia's pattern, `convex-revenuecat`): real mobile in-app purchase. Heavier (store setup, webhooks).
3. **Stripe** (web checkout): less natural for a mobile-first guest app.

This plan assumes **Option 1 first** (testable slice), RevenueCat-ready. Confirm before implementing 3A Task 1.

---

# Sub-phase 3A — Monetization loop (entitlement + hosted-video upload)

**Outcome:** an admin can grant premium to a user; that user unlocks premium content end-to-end; editors upload hosted videos (and covers) from the CMS instead of pasting URLs.

### Task 3A.1: Member entitlement model + read path
- Schema: add entitlement to `users` (e.g. `isMember: v.optional(v.boolean())` + `memberSince`, RevenueCat-ready fields optional).
- Convex: `requireMember`/`getMemberStatus` helper; a query the mobile app calls to know if the signed-in user is a member.
- CMS: a minimal admin control to grant/revoke member status on a user (mono-tenant, admin-guarded).
- Mobile: replace the "blocked for everyone" premium gate with a real check — member → content plays; guest/non-member → paywall (themed, from the mockup Paywall screen). Sign-in CTA wired.
- Test the gate logic (member vs not) at a pure seam. **Commit.**

### Task 3A.2: Register R2 + server client
- `npm install @convex-dev/r2`; add `app.use(r2)` to `convex/convex.config.ts` (already has `youtubeCache`).
- Create `convex/media/r2.ts` mirroring `../editia/web/convex/media/r2.ts` (`export const r2 = new R2(components.r2); export const { generateUploadUrl, syncMetadata } = r2.clientApi<DataModel>({});` + a key→URL resolver). Add an auth gate in `checkUpload` (require admin) — do not ship the ungated version.
- Set R2 env vars via `npx convex env set`. `npx convex dev --once` clean. **Commit.**

### Task 3A.3: Hosted-video + cover upload in the CMS
- In `apps/cms/components/cms/content-form.tsx`, for `video` + `hosted` source, replace the pasted `playbackUrl` with `useUploadFile(api.media.r2)` (mirror `lesson-cover-uploader.tsx`): upload → store the resolved URL/key in `playbackUrl`/`uploadKey`.
- Same widget for the cover (`heroImageUrl`) — now a real upload, superseding the URL-only field from the design refonte.
- Manual: upload a video in the CMS → it plays in the mobile player. **Commit.**

### Task 3A.4: Verify 3A
- Root `npx jest`, root `tsc`, CMS `tsc` + `next build`.
- Manual: grant member → premium content unlocks; upload hosted video → plays. **Commit** `chore: ship milestone 3A`.

---

# Sub-phase 3B — Engagement (bookmarks + member progress sync)

### Task 3B.1: Bookmarks
- Schema: `bookmarks` table (`tokenIdentifier`, `contentId`, `createdAt`) + index by user.
- Convex: `toggleBookmark` mutation (member/auth-guarded), `listBookmarks` query.
- Mobile: bookmark button on detail screens + a "Saved" list; guest → sign-in CTA. Themed.
- Test mutation/query seam. **Commit.**

### Task 3B.2: Member progress sync
- Build on `src/features/media/playback-progress.ts`: keep AsyncStorage for guests; for signed-in members, also read/write a Convex `playbackProgress` table (`tokenIdentifier`, `contentId`, `seconds`, `updatedAt`), last-write-wins, throttled.
- On play, resume from the max(local, remote). On sign-in, optionally migrate local → remote.
- **Commit**, then **verify 3B** (`chore: ship milestone 3B`).

---

# Sub-phase 3C — Robustness (offline premium + incident/degraded)

### Task 3C.1: Offline premium downloads
- Member-only: download `Article` (text+cover), `Episode` (mp3), `HostedVideo` (R2 file) for offline via `expo-file-system`; track downloaded items locally; play/read from the local copy when offline. (YouTube videos are **not** downloadable — note it.)
- Gate behind member entitlement; surface a "Downloads" list. **Commit.**

### Task 3C.2: Incident banner + degraded mode polish
- External status channel: a lightweight remote-config/status fetch → a dismissible incident banner (reuse `src/components/content/degraded-banner.tsx` styling).
- Tighten existing network-degradation states (cache-first reads, clear offline messaging). **Commit**, then **verify 3C** (`chore: ship milestone 3C`).

---

## Constraints & gotchas
- **Never hardcode colors** — all UI from `theme.colors.*` / `withAlpha` (CLAUDE.md rule). Verify against `midnight`.
- Keep the app **guest-first**: every member capability degrades to a sign-in CTA for guests; public reading never requires auth.
- Components that need the Node runtime stay isolated; keep pure helpers importable by the CMS client + tests.
- Each sub-phase must stay a **testable vertical slice** (CLAUDE delivery rules) — ship 3A before 3B before 3C.
- Set all new component env vars (`R2_*`, RevenueCat keys if used) via `npx convex env set`, names only in `.env.example`.

## Out of scope (later)
- The product wishlist in `docs/FEATURES.md` (events/agenda, editorial push notifications) — separate from the architecture's M3.
- Multi-backend failover (architecture defers this in favour of graceful degradation).
