# Operable CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first operable internal CMS for MediumShip as a mono-tenant web app with admin auth, Convex-backed editorial CRUD, tenant config editing, and a simple preview wired to the existing public content model.

**Architecture:** Keep the Expo mobile app at the repo root unchanged for milestone 1 stability, and introduce the CMS as a separate `apps/cms` Next.js app with its own dependencies. Reuse the existing Convex backend and shared schema-bounded tenant model, protect every CMS data access in Convex with a minimal admin guard, and ship the first slice as one dashboard page that can create/edit/publish content, update the mobile-facing tenant config, and preview saved content with the same theme and fields consumed by the public app.

**Tech Stack:** Next.js App Router, React, TypeScript, Clerk, Convex, Zod, Jest, Expo mobile app at repo root

---

## File Structure

- `apps/cms/package.json` — CMS-specific scripts and dependencies
- `apps/cms/tsconfig.json` — CMS TypeScript config
- `apps/cms/next.config.ts` — Next config for importing shared root files
- `apps/cms/next-env.d.ts` — Next TS env typings
- `apps/cms/.gitignore` — local CMS build artifacts
- `apps/cms/app/layout.tsx` — root CMS layout and global styles
- `apps/cms/app/page.tsx` — first CMS dashboard route
- `apps/cms/app/globals.css` — CMS visual system and layout tokens
- `apps/cms/app/providers.tsx` — Clerk + Convex client providers for the CMS
- `apps/cms/components/cms/dashboard.tsx` — main signed-in CMS surface
- `apps/cms/components/cms/editorial-list.tsx` — bounded content list with create/select/status controls
- `apps/cms/components/cms/content-form.tsx` — editorial create/edit form for `contents`
- `apps/cms/components/cms/tenant-settings-form.tsx` — tenant config editor for palette/modules/feed sections
- `apps/cms/components/cms/preview-pane.tsx` — simple preview using saved Convex content + tenant theme
- `apps/cms/lib/env.ts` — CMS env validation
- `apps/cms/lib/format.ts` — small display helpers for the CMS UI
- `apps/cms/lib/default-content.ts` — draft factory for new `article` / `episode` / `video`
- `apps/cms/lib/types.ts` — local form/view model types used by the dashboard
- `apps/cms/__tests__/preview-pane.test.tsx` — preview rendering test
- `apps/cms/__tests__/default-content.test.ts` — new-content factory test
- `convex/schema.ts` — add admin role + editorial timestamps/indexes without breaking public reads
- `convex/cms/authz.ts` — minimal Convex admin guard
- `convex/cms/queries.ts` — viewer, content list/detail, tenant settings, preview queries
- `convex/cms/mutations.ts` — content CRUD, status transitions, tenant config update
- `convex/content/queries.ts` — keep public read model stable, only additive shared helpers if needed
- `convex/tenants/seed.ts` — seed admin-friendly demo content/status mix
- `.env.example` — add CMS-related env keys

### Task 1: Scaffold `apps/cms` and the first protected dashboard shell

**Files:**
- Create: `apps/cms/package.json`
- Create: `apps/cms/tsconfig.json`
- Create: `apps/cms/next.config.ts`
- Create: `apps/cms/next-env.d.ts`
- Create: `apps/cms/.gitignore`
- Create: `apps/cms/app/layout.tsx`
- Create: `apps/cms/app/page.tsx`
- Create: `apps/cms/app/providers.tsx`
- Create: `apps/cms/app/globals.css`
- Create: `apps/cms/lib/env.ts`
- Modify: `.env.example`

- [ ] **Step 1: Check the existing public model and web references before scaffolding**

Read:
- `docs/plans/2026-06-03-mediumship-architecture-design.md`
- `docs/research/2026-06-03-reference-repositories.md`
- `../editia/web/app/layout.tsx`
- `../editia/web/app/globals.css`

Expected decision notes:
- keep Expo at repo root
- create `apps/cms` instead of adding admin routes to Expo
- use Clerk in the CMS, but keep real authorization in Convex
- keep the first CMS page mono-locale and internal

- [ ] **Step 2: Create the CMS package manifest**

Create `apps/cms/package.json`:

```json
{
  "name": "mediumship-cms",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest --runInBand"
  },
  "dependencies": {
    "@clerk/nextjs": "^6.39.1",
    "convex": "^1.40.0",
    "next": "16.2.3",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.15.30",
    "@types/react": "^19.2.2",
    "@types/react-dom": "^19.2.2",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 3: Add the CMS TypeScript and Next config**

Create `apps/cms/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

Create `apps/cms/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["convex"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
```

- [ ] **Step 4: Validate CMS environment variables**

Create `apps/cms/lib/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});
```

Modify `.env.example`:

```bash
# Expo client env
EXPO_PUBLIC_CONVEX_URL=
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=

# CMS web client env
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

# Optional bootstrap allowlist for Convex CMS authz
CMS_ADMIN_EMAILS=
```

- [ ] **Step 5: Create the provider shell and the first page**

Create `apps/cms/app/providers.tsx`:

```tsx
"use client";

import { ClerkProvider, SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";
import type { PropsWithChildren } from "react";

import { env } from "../lib/env";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

function ConvexAuthBridge({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return (
    <ConvexProviderWithAuth
      client={convex}
      useAuth={() => ({
        isLoading: !isLoaded,
        isAuthenticated: !!isSignedIn,
        fetchAccessToken: () => getToken({ template: "convex" }),
      })}
    >
      {children}
    </ConvexProviderWithAuth>
  );
}

export function Providers({ children }: PropsWithChildren) {
  return (
    <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexAuthBridge>{children}</ConvexAuthBridge>
    </ClerkProvider>
  );
}

export function SignedOutGate() {
  return (
    <SignedOut>
      <main className="login-shell">
        <p className="eyebrow">MediumShip CMS</p>
        <h1>Admin access required</h1>
        <p>Use the same Clerk tenant as the mobile app, then Convex will enforce admin access.</p>
        <SignInButton mode="modal">
          <button className="primary-button">Sign in</button>
        </SignInButton>
      </main>
    </SignedOut>
  );
}

export function SignedInGate({ children }: PropsWithChildren) {
  return <SignedIn>{children}</SignedIn>;
}
```

Create `apps/cms/app/page.tsx`:

```tsx
import { SignedInGate, SignedOutGate } from "./providers";
import { Dashboard } from "../components/cms/dashboard";

export default function Page() {
  return (
    <>
      <SignedOutGate />
      <SignedInGate>
        <Dashboard />
      </SignedInGate>
    </>
  );
}
```

- [ ] **Step 6: Install CMS dependencies**

Run:

```bash
npm install --prefix apps/cms
```

Expected:
- `apps/cms/node_modules` exists
- `apps/cms/package-lock.json` is created

- [ ] **Step 7: Verify the shell boots**

Run:

```bash
npm run dev --prefix apps/cms
```

Expected:
- Next starts
- signed-out state renders even before Convex CMS queries exist

- [ ] **Step 8: Commit**

```bash
git add .env.example apps/cms
git commit -m "Scaffold cms app shell"
```

### Task 2: Add minimal Convex admin authz and CMS read APIs

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/cms/authz.ts`
- Create: `convex/cms/queries.ts`
- Modify: `convex/tenants/seed.ts`

- [ ] **Step 1: Extend the schema for CMS roles and editor-friendly indexes**

Update `convex/schema.ts`:

```ts
users: defineTable({
  tokenIdentifier: v.string(),
  clerkId: v.string(),
  email: v.optional(v.string()),
  name: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  lastSeenAt: v.optional(v.string()),
  cmsRole: v.optional(v.union(v.literal("admin"))),
  deletedAt: v.optional(v.number()),
})
```

Add fields and indexes to `contents`:

```ts
updatedAt: v.number(),
createdByTokenIdentifier: v.optional(v.string()),
updatedByTokenIdentifier: v.optional(v.string()),
```

Add indexes:

```ts
.index("by_tenant_and_updatedAt", ["tenantSlug", "updatedAt"])
.index("by_tenant_and_slug", ["tenantSlug", "slug"])
```

- [ ] **Step 2: Create the minimal admin guard**

Create `convex/cms/authz.ts`:

```ts
import type { QueryCtx, MutationCtx } from "../_generated/server";

declare const process: { env: Record<string, string | undefined> };

type CmsCtx = QueryCtx | MutationCtx;

function emailAllowlist(): Set<string> {
  return new Set(
    (process.env.CMS_ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireCmsAdmin(ctx: CmsCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }

  const storedByToken = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  const stored =
    storedByToken ??
    (await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique());

  const normalizedEmail = identity.email?.toLowerCase() ?? "";
  const isAllowlisted = emailAllowlist().has(normalizedEmail);
  const isAdmin = stored?.cmsRole === "admin" || isAllowlisted;

  if (!isAdmin) {
    throw new Error("Forbidden");
  }

  return {
    identity,
    user: stored ?? null,
    email: normalizedEmail,
  };
}
```

- [ ] **Step 3: Add the read-side CMS queries**

Create `convex/cms/queries.ts`:

```ts
import { v } from "convex/values";

import { query } from "../_generated/server";
import { defaultTenant } from "../../src/features/tenant/default-tenant";
import { requireCmsAdmin } from "./authz";

export const getViewer = query({
  args: {},
  handler: async (ctx) => {
    const { identity, user, email } = await requireCmsAdmin(ctx);
    return {
      email,
      name: user?.name ?? identity.name ?? null,
      cmsRole: user?.cmsRole ?? "admin",
    };
  },
});

export const listContents = query({
  args: { tenantSlug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);
    const tenantSlug = args.tenantSlug ?? defaultTenant.slug;
    return await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_updatedAt", (q) => q.eq("tenantSlug", tenantSlug))
      .order("desc")
      .take(100);
  },
});

export const getContent = query({
  args: { id: v.id("contents") },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getTenantSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireCmsAdmin(ctx);
    return await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", defaultTenant.slug))
      .unique();
  },
});
```

- [ ] **Step 4: Seed a richer status mix for the CMS**

Modify `convex/tenants/seed.ts` so it inserts:
- one `published` article
- one `draft` article or episode
- one `archived` video

Expected:
- the CMS list can demonstrate the full workflow immediately

- [ ] **Step 5: Regenerate Convex types and validate**

Run:

```bash
npx convex dev --once
```

Expected:
- generated API updates cleanly
- no schema or function validator error

- [ ] **Step 6: Commit**

```bash
git add convex/schema.ts convex/cms convex/tenants/seed.ts convex/_generated
git commit -m "Add cms authz and read APIs"
```

### Task 3: Implement editorial CRUD and the `draft/published/archived` workflow

**Files:**
- Create: `convex/cms/mutations.ts`
- Create: `apps/cms/lib/default-content.ts`
- Create: `apps/cms/lib/types.ts`
- Create: `apps/cms/components/cms/dashboard.tsx`
- Create: `apps/cms/components/cms/editorial-list.tsx`
- Create: `apps/cms/components/cms/content-form.tsx`
- Create: `apps/cms/__tests__/default-content.test.ts`

- [ ] **Step 1: Lock the new draft factory with a failing test**

Create `apps/cms/__tests__/default-content.test.ts`:

```ts
import { buildDefaultContent } from "../lib/default-content";

describe("buildDefaultContent", () => {
  it("creates a draft article with tenant-safe defaults", () => {
    const result = buildDefaultContent("article");

    expect(result.status).toBe("draft");
    expect(result.kind).toBe("article");
    expect(result.slug).toMatch(/^new-article-/);
    expect(result.tags).toEqual([]);
    expect(result.isPremium).toBe(false);
  });
});
```

- [ ] **Step 2: Add create/update/status mutations**

Create `convex/cms/mutations.ts` with:
- `createContent`
- `updateContent`
- `setContentStatus`
- `updateTenantSettings`

Key rules:
- every mutation calls `requireCmsAdmin`
- `slug` is unique per `tenantSlug`
- `publishedAt` is set when moving to `published` and cleared when reverting to `draft`
- `updatedAt` is always refreshed

Core status mutation logic:

```ts
const nextPublishedAt =
  args.status === "published"
    ? existing.publishedAt ?? new Date().toISOString()
    : args.status === "draft"
      ? undefined
      : existing.publishedAt;

await ctx.db.patch(existing._id, {
  status: args.status,
  publishedAt: nextPublishedAt,
  updatedAt: Date.now(),
  updatedByTokenIdentifier: identity.tokenIdentifier,
});
```

- [ ] **Step 3: Implement the CMS dashboard client**

Create `apps/cms/components/cms/dashboard.tsx` so it:
- reads `api.cms.queries.getViewer`
- reads `api.cms.queries.listContents`
- reads `api.cms.queries.getTenantSettings`
- keeps the selected content id in local state
- creates a new draft with `createContent`
- updates content with `updateContent`
- switches workflow state with `setContentStatus`

Use this page skeleton:

```tsx
"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { api } from "../../../../convex/_generated/api";
import { EditorialList } from "./editorial-list";
import { ContentForm } from "./content-form";
import { TenantSettingsForm } from "./tenant-settings-form";
import { PreviewPane } from "./preview-pane";

export function Dashboard() {
  const viewer = useQuery(api.cms.queries.getViewer, {});
  const contents = useQuery(api.cms.queries.listContents, {});
  const tenant = useQuery(api.cms.queries.getTenantSettings, {});
  const createContent = useMutation(api.cms.mutations.createContent);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!viewer || !contents || !tenant) {
    return <main className="cms-loading">Loading CMS…</main>;
  }

  return (
    <main className="cms-grid">
      <EditorialList
        items={contents}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={async (kind) => {
          const id = await createContent({ kind });
          setSelectedId(id);
        }}
      />
      <ContentForm selectedId={selectedId} />
      <aside className="cms-side">
        <TenantSettingsForm tenant={tenant} />
        <PreviewPane selectedId={selectedId} />
      </aside>
    </main>
  );
}
```

- [ ] **Step 4: Verify the CRUD loop manually**

Run:

```bash
npm run dev --prefix apps/cms
```

Manual checks:
- sign in with an allowlisted Clerk email
- create an article draft
- edit title/summary/body and save
- publish it
- archive another item

- [ ] **Step 5: Commit**

```bash
git add apps/cms convex/cms/mutations.ts
git commit -m "Add cms editorial crud"
```

### Task 4: Add tenant config editing and a public-model preview

**Files:**
- Create: `apps/cms/components/cms/tenant-settings-form.tsx`
- Create: `apps/cms/components/cms/preview-pane.tsx`
- Create: `apps/cms/__tests__/preview-pane.test.tsx`
- Modify: `convex/cms/queries.ts`
- Modify: `convex/cms/mutations.ts`

- [ ] **Step 1: Add a failing preview test**

Create `apps/cms/__tests__/preview-pane.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";

import { PreviewPane } from "../components/cms/preview-pane";

describe("PreviewPane", () => {
  it("renders article copy with tenant palette accents", () => {
    render(
      <PreviewPane
        preview={{
          tenant: { slug: "demo-media", themeConfig: { paletteName: "brick" } },
          content: {
            _id: "x",
            kind: "article",
            status: "draft",
            title: "A draft story",
            summary: "Preview body",
            category: "Analysis",
            tags: [],
            isPremium: false,
          },
        }}
      />,
    );

    expect(screen.getByText("A draft story")).toBeInTheDocument();
    expect(screen.getByText("Preview body")).toBeInTheDocument();
    expect(screen.getByText("Draft preview")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Extend CMS queries with a preview payload**

Add to `convex/cms/queries.ts`:

```ts
export const getPreview = query({
  args: { id: v.id("contents") },
  handler: async (ctx, args) => {
    await requireCmsAdmin(ctx);
    const content = await ctx.db.get(args.id);
    if (!content) {
      return null;
    }

    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", content.tenantSlug))
      .unique();

    return { content, tenant };
  },
});
```

- [ ] **Step 3: Add tenant config mutation for mobile-facing settings**

In `convex/cms/mutations.ts`, implement `updateTenantSettings` with validation based on the existing shared helpers:
- `isThemePaletteName`
- `normalizeEnabledModules`
- `normalizeFeedSections`

Expected payload:

```ts
{
  paletteName: "brick",
  enabledModules: ["articles", "episodes", "videos", "premium"],
  feedSections: [
    { kind: "article", title: "Latest stories" },
    { kind: "episode", title: "New episodes" }
  ]
}
```

- [ ] **Step 4: Render the preview and settings forms**

`TenantSettingsForm` should:
- edit `paletteName`
- toggle `enabledModules`
- edit the titles/order of `feedSections`
- call `updateTenantSettings`

`PreviewPane` should:
- call `api.cms.queries.getPreview` when `selectedId` exists
- use `resolveTheme({ paletteName })` from `src/features/theme/palette-catalog.ts`
- render one simple article/episode/video card/detail view based on `kind`
- show the current workflow label: `Draft preview`, `Published preview`, or `Archived preview`

- [ ] **Step 5: Verify the config + preview loop**

Manual checks:
- change the tenant palette and confirm the preview colors switch
- disable `videos`, save, and confirm the tenant settings round-trip
- rename a feed section, save, and confirm the new title persists
- select a draft content item and confirm the preview still renders even though the public mobile query would not expose it

- [ ] **Step 6: Commit**

```bash
git add apps/cms convex/cms
git commit -m "Add cms tenant settings and preview"
```

### Task 5: Final verification and handoff

**Files:**
- Modify: `docs/plans/2026-06-03-mediumship-architecture-design.md` only if the implementation revealed a material decision change
- Modify: `docs/superpowers/plans/2026-06-03-operable-cms.md` only to check boxes while executing

- [ ] **Step 1: Run the targeted validation suite**

Run:

```bash
npm test -- --runInBand __tests__/content-selectors.test.ts __tests__/home-feed.test.tsx
npm run build --prefix apps/cms
npm test --prefix apps/cms
```

Expected:
- existing public mobile tests still pass
- CMS builds cleanly
- CMS local tests pass

- [ ] **Step 2: Smoke-test both surfaces**

Manual checks:
- root app still opens and shows the milestone 1 public feed
- CMS signs in, lists content, edits content, updates tenant config, and previews saved items

- [ ] **Step 3: Commit the verified slice**

```bash
git add apps/cms convex docs/superpowers/plans/2026-06-03-operable-cms.md .env.example
git commit -m "Start milestone 2 operable cms"
```
