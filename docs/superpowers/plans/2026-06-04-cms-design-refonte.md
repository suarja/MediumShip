# CMS Design Refonte — closing milestone 2

> **For agentic workers:** Implement task-by-task, commit after each task. This is primarily a **design refonte**: rebuild the `apps/cms` UI to match the mockup pixel-perfectly, wired to the **existing** Convex backend (do not rewrite the backend). One functional brick — YouTube enrichment — is added inside the content editor. Together this closes milestone 2.

**Goal:** Recreate the mockup CMS (`docs/podapp/project/cms/`) as the real Next.js app in `apps/cms`: a 3-tab workspace (**Contenus / Tenant / Preview**) on the warm-paper design system, driven by the Convex queries/mutations that already exist.

---

## Read first (sources of truth)

1. **The mockup — read every file top to bottom** (per `docs/podapp/README.md`: recreate the *visual output* pixel-perfect; do **not** copy the prototype's internal structure):
   - `docs/podapp/project/cms/index.html` — shell + script order
   - `docs/podapp/project/cms/styles.css` (~723 lines) — the full design system (`:root` tokens, topbar, tabs, sidebar, item list, fields, phone previews)
   - `docs/podapp/project/cms/app.jsx` — topbar + hash-routed tabs Contenus/Tenant/Preview
   - `docs/podapp/project/cms/contents.jsx` — sidebar (new Article/Épisode/Vidéo, search, status filters w/ counts, item list w/ pills) + typed editor form + cover `ImageUpload`
   - `docs/podapp/project/cms/tenant.jsx` — `IdentitySection` (brand) + palette/modules/feed + live `MobilePhonePreview`
   - `docs/podapp/project/cms/preview.jsx` — phone screens (Article/Podcast/Player/Paywall/Home) via `getTheme`
   - `docs/podapp/project/cms/state.jsx` — mockup data shape (map it onto the real Convex docs, don't reproduce it)

2. **The current real CMS** (keep its auth shell + Convex wiring, restyle the rest): `apps/cms/components/cms/{admin-shell,admin-login-shell,dashboard,editorial-list,content-form,tenant-settings-form,preview-pane}.tsx`, `apps/cms/app/globals.css`.

3. **Existing backend (reuse, do not rebuild):**
   - Queries: `api.cms.queries.{getViewer,listContents,getContent,getTenantSettings,getPreview}`
   - Mutations: `api.cms.mutations.{createContent,updateContent,setContentStatus,updateTenantSettings,bootstrapAdmin}`
   - URL validation helper already present: `apps/cms/lib/content-url-warnings.ts` (`collectContentUrlWarnings`).

## Backend reality — scope honestly (do not promise unbacked features)

- **No file storage exists.** The mockup's `ImageUpload` / logo / app-icon **uploads cannot be wired to real binary upload** in this pass. Style those widgets per the mockup, but back them with a **URL field** (and, for video covers, the YouTube enrichment in Task 4). A true upload (Convex storage / R2) is a separate later slice — note it, don't build it.
- `tenants` supports `name`, `themeConfig.paletteName`, `enabledModules`, `feedSections`. `updateTenantSettings` currently does **not** accept `name` — extend it minimally if the Tenant tab edits the brand name (Task 5).
- Mono-locale **FR** (labels in French, matching the mockup). Fonts (Newsreader / Hanken Grotesk / JetBrains Mono) are the app's brand fonts — load the same Google Fonts in the CMS as `index.html` does.

---

### Task 1: Port the design system (tokens, fonts, base)

**Files:** `apps/cms/app/globals.css`, `apps/cms/app/layout.tsx`

- [ ] Replace the CMS visual tokens with the mockup `:root` (paper `--bg #EFECE5`, brick `--accent #B14424`, ink scale, `--success/--warn/--danger/--premium`, radii, the three font vars). Bring over the base resets and `::selection`.
- [ ] Load the same Google Fonts (`Newsreader`, `Hanken Grotesk`, `JetBrains Mono`, plus `Instrument Serif`/`Manrope`/`Geist` if the CSS references them) in `layout.tsx` `<head>` (or via `next/font`).
- [ ] Keep the existing Clerk signed-out gate, but restyle it to the new tokens.
- [ ] Verify the page renders on the new palette. **Commit** `style(cms): port mockup design tokens`.

### Task 2: App shell — topbar + 3-tab hash routing

**Files:** `apps/cms/components/cms/admin-shell.tsx` (or a new `workspace.tsx`), `apps/cms/app/page.tsx`

- [ ] Build the `.topbar` (grid `auto 1fr auto`, sticky, blur): brand (`M` mark + name + `CMS` kicker), centered pill `.tabs` (**Contenus / Tenant / Preview** with `◇ ⚙ ▶` glyphs, `.tab.on` = ink fill), and the `.user` block (use `getViewer` for name/email/avatar initial).
- [ ] Implement tab switching. Mockup uses `location.hash`; in Next prefer `useState` + `?tab=` search param (or hash) — keep the back/forward + refresh behavior. Active tab persists.
- [ ] Replace the current single-grid `Dashboard` with this tabbed shell rendering `<ContentsTab/>`, `<TenantTab/>`, `<PreviewTab/>`. **Commit** `feat(cms): tabbed workspace shell`.

### Task 3: Contenus tab (list + typed editor)

**Files:** `apps/cms/components/cms/contents-tab.tsx` (new), reuse/restyle `editorial-list.tsx` + `content-form.tsx`

- [ ] **Sidebar** (`.sidebar__card`): "Contenus" header; new-row buttons **Article / Épisode / Vidéo** → `createContent({ kind })` then select; `.search` input (filter by title/slug/tag client-side over `listContents`); `.filterset` status rows **Tous / Published / Draft / Archived** each with a live `.count`; `.itemlist` items showing pills (incl. `pill--premium`), title, slug, summary, meta.
- [ ] **Editor** (right): fields typed by `kind` (article: body; episode: audioUrl; video: source kind + youtube/hosted URLs), styled with the mockup `Field`/`.input` classes. Keep the **draft/published/archived** status actions wired to `setContentStatus`, and **Save** wired to `updateContent`.
- [ ] **Cover** (`ImageUpload` look): back it with a `heroImageUrl` URL field for now (no binary upload). Keep the existing `collectContentUrlWarnings` confirm-before-save.
- [ ] **Commit** `feat(cms): contenus tab matching mockup`.

### Task 4: YouTube enrichment brick (inside the Contenus editor)

Lets an editor paste a YouTube URL on a `video` and auto-fill cover + duration + `youtubeVideoId` + title. **Proven pattern to mirror:** `../editia/web/convex/youtube/{helpers,enrich}.ts`, `../editia/web/convex/convex.config.ts`, and the enrich-button UX in `../editia/web/components/builder/course/lesson-detail-editor.tsx`.

**Files:** `package.json`, `convex/convex.config.ts` (new), `convex/youtube/helpers.ts`, `convex/youtube/enrich.ts`, `__tests__/youtube-helpers.test.ts`, `apps/cms/components/cms/content-form.tsx`, `.env.example`

- [ ] **Component:** `npm install convex-youtube-cache@^1.0.1`; create `convex/convex.config.ts` (`defineApp(); app.use(youtubeCache)` from `convex-youtube-cache/convex.config`); add `YOUTUBE_DATA_API_KEY=` to `.env.example`; set it in the deployment via `npx convex env set YOUTUBE_DATA_API_KEY <key>`.
- [ ] **Helpers:** copy `extractYoutubeVideoId` + `formatDuration` from Editia verbatim into `convex/youtube/helpers.ts`, and add:
  ```ts
  export function parseDurationSeconds(iso8601: string): number {
    const m = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    return (+(m[1]??0))*3600 + (+(m[2]??0))*60 + (+(m[3]??0));
  }
  ```
  Add `__tests__/youtube-helpers.test.ts` (id extraction for watch?v=/youtu.be/shorts/embed + null; `parseDurationSeconds("PT1H2M3S")===3723`).
- [ ] **Action** `convex/youtube/enrich.ts` (`"use node"`), auth-guarded, **returns** data (does not patch — MediumShip saves explicitly):
  ```ts
  "use node";
  import { v } from "convex/values";
  import { YouTubeMetadataCache } from "convex-youtube-cache";
  import { action } from "../_generated/server";
  import { components } from "../_generated/api";
  import { requireCmsAdmin } from "../cms/authz";
  import { extractYoutubeVideoId, parseDurationSeconds } from "./helpers";

  export const enrichFromYoutube = action({
    args: { youtubeUrl: v.string() },
    handler: async (ctx, { youtubeUrl }) => {
      await requireCmsAdmin(ctx);
      const videoId = extractYoutubeVideoId(youtubeUrl);
      if (!videoId) return { enriched: false as const, reason: "not-a-youtube-url" };
      const apiKey = process.env.YOUTUBE_DATA_API_KEY;
      if (!apiKey) return { enriched: false as const, reason: "missing-api-key" };
      const cache = new YouTubeMetadataCache(components.youtubeMetadata, { apiKey });
      const data = await cache.getVideo(ctx, { videoId });
      if (!data) return { enriched: false as const, reason: "not-found-or-quota" };
      return {
        enriched: true as const,
        title: data.title,
        durationSeconds: data.duration ? parseDurationSeconds(data.duration) : 0,
        thumbnailUrl: data.thumbnailUrl,
        youtubeVideoId: videoId,
      };
    },
  });
  ```
- [ ] **Button** in the editor's youtube branch: `useAction(api.youtube.enrich.enrichFromYoutube)`, `enriching`/`error` state, disabled when empty/enriching. On success fill `heroImageUrl=thumbnailUrl`, `durationSeconds=String(...)`, `title` (only if empty), and persist `youtubeVideoId` on save (replace the hardcoded `youtubeVideoId: ""` in `save()` using a client-safe copy of `extractYoutubeVideoId` — **don't** import the `"use node"` module). Friendly message per `reason`.
- [ ] `npx convex dev --once` + `npx jest __tests__/youtube-helpers.test.ts` green. **Commit** `feat(cms): youtube url enrichment`.

### Task 5: Tenant tab

**Files:** `apps/cms/components/cms/tenant-tab.tsx` (new, restyle `tenant-settings-form.tsx`), maybe `convex/cms/mutations.ts`

- [ ] Build the `IdentitySection` look: brand **name** (editable — extend `updateTenantSettings` to accept `name` and patch it), logo / app-icon widgets styled per mockup but **display-only / URL-backed** (no storage yet — leave a `// TODO: real upload needs Convex storage`).
- [ ] Palette selector, `enabledModules` toggles, `feedSections` title/order editor — all wired to `updateTenantSettings` (already supported).
- [ ] Live `MobilePhonePreview` reflecting palette/feed using `resolveTheme({ paletteName })` from `src/features/theme/palette-catalog.ts`.
- [ ] **Commit** `feat(cms): tenant tab matching mockup`.

### Task 6: Preview tab

**Files:** `apps/cms/components/cms/preview-tab.tsx` (new, restyle `preview-pane.tsx`)

- [ ] Phone-frame screens from the mockup (Article / Podcast / Player / Paywall / Home) on a left rail, themed with `resolveTheme` and fed by `getPreview` for the selected content. Show palette/typo labels. Keep the draft/published/archived label.
- [ ] **Commit** `feat(cms): preview tab matching mockup`.

### Task 7: Close milestone 2 — verify

- [ ] `npx jest` (root) green; `cd apps/cms && npx tsc --noEmit && npm run build` clean.
- [ ] Manual smoke (admin sign-in): create/edit/publish/archive; search + status filters; YouTube enrich on a video; tenant palette/modules/feed round-trip with live preview; preview screens render for a draft.
- [ ] Tick the remaining boxes in `docs/superpowers/plans/2026-06-03-operable-cms.md` Task 5. **Commit** `chore: close milestone 2 operable cms`.

---

## Out of scope (separate slices / milestone 3)
- Real binary uploads (cover / logo / app icon) via Convex storage or R2.
- Hosted-video upload, premium gating, bookmarks, offline downloads, incident banner (architecture **milestone 3**).
- Any mobile change beyond confirming an enriched cover renders.

## Gotchas
- Recreate the mockup's *visual output*, not its prototype JS structure; wire to the real Convex API instead of the mockup's `state.jsx` fixtures.
- `convex/youtube/enrich.ts` must stay `"use node"`; keep helpers pure so the CMS client + tests import them without the Node runtime.
- `convex-youtube-cache` needs `YOUTUBE_DATA_API_KEY`; without it the action returns `{ enriched: false, reason: "missing-api-key" }` — handle gracefully, never throw.
- Never hardcode colors in the mobile app; the CMS is a separate web design system (the mockup tokens) and does **not** consume the mobile theme palette.
