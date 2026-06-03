# Expo + Convex + Clerk Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable MediumShip prototype foundation with Expo, Convex, Clerk, a white-label app shell, modular i18n, responsive iPhone/iPad primitives, and a minimum editorial domain for `Article`, `Episode`, and `Video`.

**Architecture:** Use a single Expo app at the repo root with Expo Router for navigation, Convex for backend state and content queries, and Clerk for authentication. Base the mobile wiring first on proven patterns from `../editia/mobile`, use `../Ideo/IdeoMobile` as a secondary reference for additional Convex/Expo patterns, use modular translation files split by page/feature, and introduce a responsive primitive from the start so the first screens already account for iPhone and iPad.

**Tech Stack:** Expo, React Native, TypeScript, Expo Router, Convex, Clerk, React Native Testing Library, Jest, Zod

---

## File Structure

- `package.json` — app scripts and dependencies
- `app/_layout.tsx` — root providers and navigation shell
- `app/(tabs)/index.tsx` — home feed
- `app/article/[id].tsx` — article detail
- `app/episode/[id].tsx` — episode detail
- `app/video/[id].tsx` — video detail
- `app/premium.tsx` — premium screen
- `app/profile.tsx` — profile screen
- `src/theme/tokens.ts` — white-label theme tokens
- `src/lib/polyfills.ts` — mobile runtime polyfills required before auth providers
- `src/lib/i18n/index.ts` — i18n initialization
- `src/lib/i18n/resources.ts` — translation resource aggregation
- `src/lib/responsive/use-responsive.ts` — responsive phone/tablet primitive
- `src/i18n/en/common.json` — shared English strings
- `src/i18n/en/home.json` — home screen English strings
- `src/i18n/en/profile.json` — profile screen English strings
- `src/i18n/fr/common.json` — shared French strings
- `src/i18n/fr/home.json` — home screen French strings
- `src/i18n/fr/profile.json` — profile screen French strings
- `src/features/tenant/default-tenant.ts` — initial tenant config
- `src/features/content/types.ts` — shared content model types
- `src/features/content/selectors.ts` — view-model helpers for content cards and details
- `src/components/content/content-card.tsx` — reusable feed card
- `src/components/layout/screen.tsx` — app screen wrapper
- `src/lib/env.ts` — environment variable validation
- `convex/schema.ts` — Convex schema
- `convex/tenants.ts` — tenant queries
- `convex/content.ts` — content queries
- `convex/clerk.ts` — Clerk/Convex auth wiring if needed by chosen integration
- `convex/seed.ts` — initial seed mutation
- `tests/content/selectors.test.ts` — domain tests
- `tests/content-card.test.tsx` — card rendering tests
- `.env.example` — required environment variables

### Task 1: Scaffold the Expo app and base tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `babel.config.js`
- Create: `app.json`
- Create: `app/_layout.tsx`
- Create: `src/lib/env.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Check Convex component guidance before setup**

Read:
- `docs/convex-components-descriptions.md`
- `docs/adr/0001-choose-expo-convex-clerk.md`
- `docs/research/2026-06-03-reference-repositories.md`

Expected decision notes:
- Use Clerk for auth
- Use `ConvexProviderWithClerk` for authenticated mobile queries
- Keep R2/Mux/RevenueCat decisions open for later tasks
- Do not introduce custom backend abstractions before checking components

- [ ] **Step 2: Initialize the Expo app in-place**

Run:

```bash
npx create-expo-app@latest . --template
```

Expected:
- `package.json` exists at repo root
- Expo Router-ready scaffold is generated

- [ ] **Step 3: Install the base dependencies**

Run:

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-status-bar
npx expo install expo-localization expo-secure-store
npm install convex @clerk/clerk-expo i18next react-i18next zod
npm install -D jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

Expected:
- runtime and test dependencies are present

- [ ] **Step 4: Create environment validation**

Create `src/lib/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_CONVEX_URL: z.string().url(),
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

export const env = envSchema.parse({
  EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
});
```

- [ ] **Step 5: Add `.env.example`**

Create `.env.example`:

```bash
EXPO_PUBLIC_CONVEX_URL=
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

- [ ] **Step 6: Ensure generated files are ignored correctly**

Append to `.gitignore` if missing:

```gitignore
.expo/
.env.local
coverage/
```

- [ ] **Step 7: Verify the app boots**

Run:

```bash
npx expo start --offline --clear
```

Expected:
- Metro starts
- no missing dependency error

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json babel.config.js app.json app src/lib/env.ts .env.example .gitignore
git commit -m "Scaffold Expo foundation"
```

### Task 2: Install Convex guidance and bootstrap the backend

**Files:**
- Create: `convex/schema.ts`
- Create: `convex/tenants.ts`
- Create: `convex/content.ts`
- Create: `convex/seed.ts`
- Create: `convex/README.md`
- Modify: `package.json`

- [ ] **Step 1: Install Convex AI guidance**

Run:

```bash
npx convex ai-files install
```

Expected:
- Convex guidance files are added or refreshed

- [ ] **Step 2: Initialize Convex**

Run:

```bash
npx convex dev
```

Expected:
- `convex/` scaffold is created
- local dev setup prompts for project linkage

- [ ] **Step 3: Define the first schema**

Create `convex/schema.ts`:

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tenants: defineTable({
    slug: v.string(),
    name: v.string(),
    theme: v.object({
      primary: v.string(),
      accent: v.string(),
      background: v.string(),
      foreground: v.string(),
    }),
    enabledModules: v.array(v.string()),
  }).index("by_slug", ["slug"]),
  contents: defineTable({
    tenantSlug: v.string(),
    kind: v.union(v.literal("article"), v.literal("episode"), v.literal("video")),
    title: v.string(),
    summary: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    isPremium: v.boolean(),
    heroImageUrl: v.optional(v.string()),
    publishedAt: v.string(),
    articleBody: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    videoSource: v.optional(
      v.object({
        provider: v.union(v.literal("youtube"), v.literal("hosted")),
        playbackId: v.string(),
      }),
    ),
  })
    .index("by_tenant", ["tenantSlug"])
    .index("by_tenant_kind", ["tenantSlug", "kind"]),
});
```

- [ ] **Step 4: Add tenant query**

Create `convex/tenants.ts`:

```ts
import { query } from "./_generated/server";

export const getDefaultTenant = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", "demo-media"))
      .unique();
  },
});
```

- [ ] **Step 5: Add content queries**

Create `convex/content.ts`:

```ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const listFeed = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contents")
      .withIndex("by_tenant", (q) => q.eq("tenantSlug", args.tenantSlug))
      .collect();
  },
});

export const getById = query({
  args: { id: v.id("contents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
```

- [ ] **Step 6: Add a seed mutation**

Create `convex/seed.ts`:

```ts
import { mutation } from "./_generated/server";

export const seedDemoContent = mutation({
  args: {},
  handler: async (ctx) => {
    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", "demo-media"))
      .unique();

    if (!existingTenant) {
      await ctx.db.insert("tenants", {
        slug: "demo-media",
        name: "Demo Media",
        theme: {
          primary: "#101828",
          accent: "#B42318",
          background: "#FCFCFD",
          foreground: "#101828",
        },
        enabledModules: ["articles", "episodes", "videos", "premium"],
      });
    }
  },
});
```

- [ ] **Step 7: Verify Convex type generation**

Run:

```bash
npx convex dev --once
```

Expected:
- generated files exist in `convex/_generated`
- schema compiles

- [ ] **Step 8: Commit**

```bash
git add package.json convex
git commit -m "Bootstrap Convex schema and queries"
```

### Task 3: Wire Clerk authentication into the Expo shell

**Files:**
- Modify: `app/_layout.tsx`
- Create: `src/lib/polyfills.ts`
- Create: `src/components/layout/screen.tsx`
- Create: `app/profile.tsx`
- Create: `app/premium.tsx`
- Create: `src/features/tenant/default-tenant.ts`

- [ ] **Step 1: Add the root provider shell**

Create `src/lib/polyfills.ts`:

```ts
if (typeof navigator !== "undefined" && navigator.onLine === undefined) {
  Object.defineProperty(navigator, "onLine", {
    get: () => true,
    configurable: true,
  });
}
```

Update `app/_layout.tsx`:

```tsx
import "../src/lib/polyfills";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { env } from "../src/lib/env";

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL);
const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  clearToken: (key: string) => SecureStore.deleteItemAsync(key),
};

function useAuth() {
  const auth = useClerkAuth();

  return {
    ...auth,
    isLoaded: auth.isLoaded,
    isSignedIn: auth.isSignedIn,
    getToken: auth.getToken,
  };
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Stack screenOptions={{ headerShown: false }} />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

Note:
- keep the `navigator.onLine` polyfill before any Clerk import, as observed in both `../editia/mobile` and `../Ideo/IdeoMobile`
- if Clerk + Convex shows post-login auth flicker or data loss, port the more defensive stabilized auth wrapper from `../Ideo/IdeoMobile/src/app/_layout.tsx`

- [ ] **Step 2: Add a simple screen wrapper**

Create `src/components/layout/screen.tsx`:

```tsx
import { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FCFCFD" },
  content: { flex: 1, padding: 16 },
});
```

- [ ] **Step 3: Add default tenant config used by the first shell**

Create `src/features/tenant/default-tenant.ts`:

```ts
export const defaultTenant = {
  slug: "demo-media",
  name: "Demo Media",
  theme: {
    primary: "#101828",
    accent: "#B42318",
    background: "#FCFCFD",
    foreground: "#101828",
  },
};
```

- [ ] **Step 4: Add placeholder profile and premium routes**

Create `app/profile.tsx`:

```tsx
import { Text } from "react-native";
import { Screen } from "../src/components/layout/screen";

export default function ProfileScreen() {
  return (
    <Screen>
      <Text>Profile</Text>
    </Screen>
  );
}
```

Create `app/premium.tsx`:

```tsx
import { Text } from "react-native";
import { Screen } from "../src/components/layout/screen";

export default function PremiumScreen() {
  return (
    <Screen>
      <Text>Premium</Text>
    </Screen>
  );
}
```

- [ ] **Step 5: Verify providers compile**

Run:

```bash
npx tsc --noEmit
```

Expected:
- no TypeScript errors from provider wiring

- [ ] **Step 6: Commit**

```bash
git add app/_layout.tsx app/profile.tsx app/premium.tsx src/components/layout/screen.tsx src/features/tenant/default-tenant.ts
git commit -m "Wire Clerk and Convex providers"
```

### Task 4: Scaffold modular i18n and responsive primitives

**Files:**
- Create: `src/lib/i18n/index.ts`
- Create: `src/lib/i18n/resources.ts`
- Create: `src/lib/responsive/use-responsive.ts`
- Create: `src/i18n/en/common.json`
- Create: `src/i18n/en/home.json`
- Create: `src/i18n/en/profile.json`
- Create: `src/i18n/fr/common.json`
- Create: `src/i18n/fr/home.json`
- Create: `src/i18n/fr/profile.json`

- [ ] **Step 1: Create translation resources by page**

Create `src/i18n/en/common.json`:

```json
{
  "loading": "Loading",
  "premium": "Premium"
}
```

Create `src/i18n/fr/common.json`:

```json
{
  "loading": "Chargement",
  "premium": "Premium"
}
```

Create `src/i18n/en/home.json` and `src/i18n/fr/home.json` with only home-screen keys.

- [ ] **Step 2: Aggregate resources**

Create `src/lib/i18n/resources.ts`:

```ts
import commonEn from "../../i18n/en/common.json";
import homeEn from "../../i18n/en/home.json";
import profileEn from "../../i18n/en/profile.json";
import commonFr from "../../i18n/fr/common.json";
import homeFr from "../../i18n/fr/home.json";
import profileFr from "../../i18n/fr/profile.json";

export const resources = {
  en: { common: commonEn, home: homeEn, profile: profileEn },
  fr: { common: commonFr, home: homeFr, profile: profileFr },
} as const;
```

- [ ] **Step 3: Initialize i18n**

Create `src/lib/i18n/index.ts`:

```ts
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";

void i18n.use(initReactI18next).init({
  resources,
  lng: getLocales()[0]?.languageCode ?? "en",
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
```

- [ ] **Step 4: Add responsive primitive**

Create `src/lib/responsive/use-responsive.ts`, inspired by `../editia/mobile/lib/hooks/useResponsiveSpacing.ts`:

```ts
import { useWindowDimensions } from "react-native";

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const shortestSide = Math.min(width, height);
  const isTablet = shortestSide >= 768;

  return {
    width,
    height,
    isTablet,
    multiplier: isTablet ? 1.5 : 1,
    contentMaxWidth: isTablet ? 720 : width,
    screenPadding: (isTablet ? 24 : 16) * (isTablet ? 1.5 : 1),
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n src/lib/responsive src/i18n
git commit -m "Add modular i18n and responsive primitives"
```

### Task 5: Define the multi-format content model and test its selectors

**Files:**
- Create: `src/features/content/types.ts`
- Create: `src/features/content/selectors.ts`
- Create: `tests/content/selectors.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing selector test**

Create `tests/content/selectors.test.ts`:

```ts
import { describe, expect, it } from "@jest/globals";
import { buildCardMeta } from "../../src/features/content/selectors";

describe("buildCardMeta", () => {
  it("labels article, episode, and video distinctly", () => {
    expect(
      buildCardMeta({
        kind: "article",
        title: "Election notes",
        summary: "Summary",
        category: "Politics",
        isPremium: false,
      }),
    ).toMatchObject({ eyebrow: "Article", locked: false });

    expect(
      buildCardMeta({
        kind: "episode",
        title: "Morning briefing",
        summary: "Summary",
        category: "Podcast",
        isPremium: true,
      }),
    ).toMatchObject({ eyebrow: "Episode", locked: true });
  });
});
```

- [ ] **Step 2: Run the test to verify failure**

Run:

```bash
npx jest tests/content/selectors.test.ts --runInBand
```

Expected:
- FAIL because `buildCardMeta` does not exist yet

- [ ] **Step 3: Define the content types**

Create `src/features/content/types.ts`:

```ts
export type ContentKind = "article" | "episode" | "video";

export type ContentItem = {
  id?: string;
  kind: ContentKind;
  title: string;
  summary: string;
  category: string;
  isPremium: boolean;
  heroImageUrl?: string;
  articleBody?: string;
  audioUrl?: string;
  videoSource?: {
    provider: "youtube" | "hosted";
    playbackId: string;
  };
};
```

- [ ] **Step 4: Implement the selector**

Create `src/features/content/selectors.ts`:

```ts
import { ContentItem } from "./types";

const kindLabel: Record<ContentItem["kind"], string> = {
  article: "Article",
  episode: "Episode",
  video: "Video",
};

export function buildCardMeta(item: Pick<
  ContentItem,
  "kind" | "category" | "isPremium"
>) {
  return {
    eyebrow: kindLabel[item.kind],
    category: item.category,
    locked: item.isPremium,
  };
}
```

- [ ] **Step 5: Re-run the selector test**

Run:

```bash
npx jest tests/content/selectors.test.ts --runInBand
```

Expected:
- PASS

- [ ] **Step 6: Commit**

```bash
git add package.json src/features/content tests/content
git commit -m "Define multi-format content model"
```

### Task 6: Build the first feed and detail screens

**Files:**
- Create: `src/components/content/content-card.tsx`
- Create: `tests/content-card.test.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `app/article/[id].tsx`
- Create: `app/episode/[id].tsx`
- Create: `app/video/[id].tsx`

- [ ] **Step 1: Write the failing card rendering test**

Create `tests/content-card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react-native";
import { ContentCard } from "../src/components/content/content-card";

describe("ContentCard", () => {
  it("renders title and premium badge", () => {
    render(
      <ContentCard
        item={{
          kind: "video",
          title: "Campaign debrief",
          summary: "Long-form video recap",
          category: "Analysis",
          isPremium: true,
        }}
      />,
    );

    expect(screen.getByText("Campaign debrief")).toBeTruthy();
    expect(screen.getByText("Premium")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify failure**

Run:

```bash
npx jest tests/content-card.test.tsx --runInBand
```

Expected:
- FAIL because `ContentCard` does not exist yet

- [ ] **Step 3: Implement `ContentCard`**

Create `src/components/content/content-card.tsx`:

```tsx
import { StyleSheet, Text, View } from "react-native";
import { ContentItem } from "../../features/content/types";
import { buildCardMeta } from "../../features/content/selectors";

export function ContentCard({ item }: { item: ContentItem }) {
  const meta = buildCardMeta(item);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{meta.eyebrow}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.summary}>{item.summary}</Text>
      {meta.locked ? <Text style={styles.badge}>Premium</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 8,
  },
  eyebrow: { fontSize: 12, textTransform: "uppercase", color: "#B42318" },
  title: { fontSize: 18, fontWeight: "600", color: "#101828" },
  summary: { fontSize: 14, color: "#475467" },
  badge: { fontSize: 12, color: "#B42318", fontWeight: "700" },
});
```

- [ ] **Step 4: Re-run the card test**

Run:

```bash
npx jest tests/content-card.test.tsx --runInBand
```

Expected:
- PASS

- [ ] **Step 5: Build the first feed route**

Create `app/(tabs)/index.tsx`:

```tsx
import { ScrollView } from "react-native";
import { ContentCard } from "../../src/components/content/content-card";
import { Screen } from "../../src/components/layout/screen";

const demoFeed = [
  {
    kind: "article" as const,
    title: "Editorial opening",
    summary: "Why owned media matters in 2027.",
    category: "Editorial",
    isPremium: false,
  },
  {
    kind: "episode" as const,
    title: "Morning briefing",
    summary: "Daily audio update.",
    category: "Podcast",
    isPremium: false,
  },
  {
    kind: "video" as const,
    title: "Campaign debrief",
    summary: "Long-form analysis video.",
    category: "Analysis",
    isPremium: true,
  },
];

export default function HomeScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {demoFeed.map((item) => (
          <ContentCard key={item.title} item={item} />
        ))}
      </ScrollView>
    </Screen>
  );
}
```

- [ ] **Step 6: Add detail routes**

Create `app/article/[id].tsx`, `app/episode/[id].tsx`, `app/video/[id].tsx` with the same minimal structure:

```tsx
import { Text } from "react-native";
import { Screen } from "../../src/components/layout/screen";

export default function DetailScreen() {
  return (
    <Screen>
      <Text>Detail screen</Text>
    </Screen>
  );
}
```

- [ ] **Step 7: Verify the foundation app**

Run:

```bash
npx jest --runInBand
npx tsc --noEmit
```

Expected:
- tests pass
- TypeScript passes

- [ ] **Step 8: Commit**

```bash
git add app src/components tests
git commit -m "Add multi-format feed shell"
```

### Task 7: Connect the feed UI to Convex data and seed demo content

**Files:**
- Modify: `convex/seed.ts`
- Modify: `app/(tabs)/index.tsx`
- Modify: `app/article/[id].tsx`
- Modify: `app/episode/[id].tsx`
- Modify: `app/video/[id].tsx`

- [ ] **Step 1: Extend the seed with one article, episode, and video**

Append inside `convex/seed.ts`:

```ts
    const existingContent = await ctx.db
      .query("contents")
      .withIndex("by_tenant", (q) => q.eq("tenantSlug", "demo-media"))
      .collect();

    if (existingContent.length === 0) {
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "article",
        title: "Editorial opening",
        summary: "Why owned media matters in 2027.",
        category: "Editorial",
        tags: ["media", "strategy"],
        isPremium: false,
        publishedAt: new Date().toISOString(),
        articleBody: "Draft article body",
      });

      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "episode",
        title: "Morning briefing",
        summary: "Daily audio update.",
        category: "Podcast",
        tags: ["audio"],
        isPremium: false,
        publishedAt: new Date().toISOString(),
        audioUrl: "https://example.com/audio.mp3",
      });

      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "video",
        title: "Campaign debrief",
        summary: "Long-form analysis video.",
        category: "Analysis",
        tags: ["video", "youtube"],
        isPremium: true,
        publishedAt: new Date().toISOString(),
        videoSource: {
          provider: "youtube",
          playbackId: "dQw4w9WgXcQ",
        },
      });
    }
```

- [ ] **Step 2: Run the seed**

Run:

```bash
npx convex run seed:seedDemoContent
```

Expected:
- demo tenant and demo content exist

- [ ] **Step 3: Replace static feed data with `useQuery`**

Update `app/(tabs)/index.tsx`:

```tsx
import { ScrollView, Text } from "react-native";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ContentCard } from "../../src/components/content/content-card";
import { Screen } from "../../src/components/layout/screen";

export default function HomeScreen() {
  const items = useQuery(api.content.listFeed, { tenantSlug: "demo-media" });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {items?.map((item) => (
          <ContentCard key={item._id} item={item} />
        )) ?? <Text>Loading…</Text>}
      </ScrollView>
    </Screen>
  );
}
```

- [ ] **Step 4: Add real detail fetches**

Use the same pattern in each detail route:

```tsx
import { Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Screen } from "../../src/components/layout/screen";

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useQuery(api.content.getById, id ? { id: id as never } : "skip");

  return (
    <Screen>
      <Text>{item?.title ?? "Loading…"}</Text>
    </Screen>
  );
}
```

- [ ] **Step 5: Verify the full foundation loop**

Run:

```bash
npx convex dev --once
npx jest --runInBand
npx tsc --noEmit
```

Expected:
- Convex schema passes
- tests pass
- TypeScript passes

- [ ] **Step 6: Commit**

```bash
git add convex app
git commit -m "Connect feed shell to Convex data"
```

## Self-Review

- The scope is intentionally limited to foundation work only: app shell, auth, content model, feed shell, and backend connection.
- The plan does not yet implement direct-upload video, YouTube enrichment workflows, payments, or community features.
- The first executable story after this plan should be: sign into the app, fetch seeded multi-format content, and open article/episode/video detail placeholders.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-03-expo-convex-clerk-foundation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
