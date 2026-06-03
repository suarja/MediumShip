# Guest-First Public Read Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current auth-first Expo foundation into a guest-first public reading app with a real multi-format feed, public content detail screens, and first-pass degraded-network handling.

**Architecture:** Keep the current Expo app at the repo root for this milestone to avoid path churn before the CMS exists. Split the work into four vertical slices: public routing, editorial domain + seed data, feed/detail UI, and degraded-state/network primitives. Clerk remains installed but becomes optional for reading; Convex becomes the public read source of truth.

**Tech Stack:** Expo Router, React Native, TypeScript, Convex, Clerk, Jest, React Native Testing Library, i18next

---

## File Structure

- `app/index.tsx` — public entry gate; always route into the app shell.
- `app/(app)/_layout.tsx` — tab shell without auth redirect; tab access stays public.
- `app/(app)/home.tsx` — public multi-format feed screen.
- `app/(app)/profile.tsx` — guest-aware account screen with sign-in CTA.
- `app/(app)/premium.tsx` — guest-aware premium explainer surface.
- `app/article/[id].tsx` — public article detail.
- `app/episode/[id].tsx` — public episode detail.
- `app/video/[id].tsx` — public video detail.
- `src/features/content/types.ts` — shared editorial and view-model types.
- `src/features/content/selectors.ts` — mapping helpers from Convex docs to mobile cards/details.
- `src/features/network/use-network-status.ts` — network and degraded-state hook.
- `src/components/content/content-card.tsx` — reusable feed row/card.
- `src/components/content/degraded-banner.tsx` — banner for offline/degraded states.
- `src/components/auth/member-gate-card.tsx` — reusable guest CTA for member-only actions.
- `src/i18n/locales/en/article.ts` / `fr/article.ts` — article strings.
- `src/i18n/locales/en/episode.ts` / `fr/episode.ts` — episode strings.
- `src/i18n/locales/en/video.ts` / `fr/video.ts` — video strings.
- `src/i18n/locales/en/network.ts` / `fr/network.ts` — degraded-state strings.
- `src/i18n/resources.ts` — namespace registration.
- `convex/schema.ts` — add publication status and richer content fields.
- `convex/content/queries.ts` — public feed and detail queries filtered by `published`.
- `convex/tenants/seed.ts` — seed one published article, episode, and video.
- `__tests__/content-selectors.test.ts` — unit tests for editorial selectors.
- `__tests__/home-feed.test.tsx` — feed rendering test.
- `__tests__/guest-profile.test.tsx` — guest-mode account screen test.
- `__tests__/network-status.test.tsx` — degraded banner logic test.

### Task 1: Turn the app shell into a public-first shell

**Files:**
- Modify: `app/index.tsx`
- Modify: `app/(app)/_layout.tsx`
- Modify: `app/(app)/profile.tsx`
- Create: `src/components/auth/member-gate-card.tsx`
- Test: `__tests__/guest-profile.test.tsx`

- [ ] **Step 1: Write the failing guest profile test**

```tsx
import { render, screen } from "@testing-library/react-native";

import ProfileScreen from "../app/(app)/profile";

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    user: null,
    email: null,
    fullName: null,
    signOut: jest.fn(),
  }),
}));

describe("guest profile", () => {
  it("shows a member CTA instead of authenticated identity fields", () => {
    render(<ProfileScreen />);

    expect(screen.getByText("Create an account")).toBeTruthy();
    expect(screen.queryByText(/Stored in Convex/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/guest-profile.test.tsx`
Expected: FAIL because the current screen assumes authenticated identity rendering.

- [ ] **Step 3: Change the entry route to stop redirecting guests to sign-in**

```tsx
import { Redirect } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useClerkAuth } from "../src/features/auth/use-clerk-auth";

export default function Index() {
  const { isLoaded } = useClerkAuth();
  const { t } = useTranslation("common");

  if (!isLoaded) {
    return (
      <View style={styles.center} accessibilityLabel={t("status.loading")}>
        <ActivityIndicator color="#B42318" />
      </View>
    );
  }

  return <Redirect href="/home" />;
}
```

- [ ] **Step 4: Remove the auth redirect from the public tab layout**

```tsx
import { Tabs } from "expo-router";

import { AppTabBar } from "../../src/components/navigation/app-tab-bar";

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="premium" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
```

- [ ] **Step 5: Add a reusable member gate card and use it in the profile screen**

```tsx
// src/components/auth/member-gate-card.tsx
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../features/theme/theme-provider";

export function MemberGateCard({
  title,
  description,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaLabel: string;
}) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.heading }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.textMuted }]}>
        {description}
      </Text>
      <Link href="/sign-in" asChild>
        <Pressable
          style={[
            styles.button,
            {
              borderRadius: theme.radii.pill,
              backgroundColor: theme.colors.accent,
            },
          ]}
        >
          <Text style={styles.buttonText}>{ctaLabel}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, padding: 20 },
  title: { fontSize: 18, fontWeight: "700" },
  description: { fontSize: 15, lineHeight: 22 },
  button: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 12 },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});
```

```tsx
// app/(app)/profile.tsx
if (!isSignedIn) {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>
          {t("profile:eyebrow")}
        </Text>
        <Text style={[styles.title, { color: theme.colors.heading }]}>
          {t("profile:guestTitle")}
        </Text>
        <MemberGateCard
          title={t("profile:guestCardTitle")}
          description={t("profile:guestCardDescription")}
          ctaLabel={t("profile:createAccount")}
        />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- --runInBand __tests__/guest-profile.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/index.tsx 'app/(app)/_layout.tsx' 'app/(app)/profile.tsx' src/components/auth/member-gate-card.tsx __tests__/guest-profile.test.tsx
git commit -m "Add guest-first app shell"
```

### Task 2: Create the first published editorial domain slice

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/content/queries.ts`
- Modify: `convex/tenants/seed.ts`
- Create: `src/features/content/types.ts`
- Create: `src/features/content/selectors.ts`
- Test: `__tests__/content-selectors.test.ts`

- [ ] **Step 1: Write the failing selector test**

```ts
import { describe, expect, it } from "@jest/globals";

import { toContentCardModel } from "../src/features/content/selectors";

describe("toContentCardModel", () => {
  it("maps published video content to a premium-aware card model", () => {
    const result = toContentCardModel({
      _id: "content_1" as never,
      kind: "video",
      status: "published",
      title: "Democratie locale",
      summary: "Long-form debate",
      category: "Debat",
      tags: ["video"],
      isPremium: true,
      publishedAt: "2026-06-03T10:00:00.000Z",
      tenantSlug: "demo-media",
      durationSeconds: 3862,
      videoSource: {
        kind: "youtube",
        youtubeVideoId: "abc123xyz00",
        youtubeUrl: "https://www.youtube.com/watch?v=abc123xyz00",
      },
    });

    expect(result.kindLabel).toBe("Video");
    expect(result.metaLabel).toContain("Premium");
    expect(result.href).toBe("/video/content_1");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/content-selectors.test.ts`
Expected: FAIL because the selector module does not exist yet.

- [ ] **Step 3: Extend the Convex schema with publication status and richer video fields**

```ts
contents: defineTable({
  tenantSlug: v.string(),
  kind: v.union(v.literal("article"), v.literal("episode"), v.literal("video")),
  status: v.union(v.literal("draft"), v.literal("published"), v.literal("archived")),
  slug: v.string(),
  title: v.string(),
  summary: v.string(),
  category: v.string(),
  tags: v.array(v.string()),
  isPremium: v.boolean(),
  heroImageUrl: v.optional(v.string()),
  publishedAt: v.optional(v.string()),
  readingTimeMinutes: v.optional(v.number()),
  articleBody: v.optional(v.string()),
  audioUrl: v.optional(v.string()),
  durationSeconds: v.optional(v.number()),
  videoSource: v.optional(
    v.union(
      v.object({
        kind: v.literal("youtube"),
        youtubeVideoId: v.string(),
        youtubeUrl: v.string(),
      }),
      v.object({
        kind: v.literal("hosted"),
        uploadKey: v.string(),
        playbackUrl: v.string(),
      }),
    ),
  ),
})
  .index("by_tenant_and_status", ["tenantSlug", "status"])
  .index("by_tenant_and_kind", ["tenantSlug", "kind"]);
```

- [ ] **Step 4: Update public content queries to return published content only**

```ts
export const listPublishedFeed = query({
  args: { tenantSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status", (q) =>
        q.eq("tenantSlug", args.tenantSlug).eq("status", "published"),
      )
      .collect();
  },
});

export const getPublishedById = query({
  args: { id: v.id("contents") },
  handler: async (ctx, args) => {
    const content = await ctx.db.get(args.id);
    if (!content || content.status !== "published") {
      return null;
    }
    return content;
  },
});
```

- [ ] **Step 5: Seed one published article, episode, and video**

```ts
const demoContents = [
  {
    tenantSlug: defaultTenant.slug,
    status: "published" as const,
    slug: "economie-du-soin",
    kind: "article" as const,
    title: "L'economie du soin",
    summary: "Une analyse sur la priorite du soin.",
    category: "Analyse",
    tags: ["analyse", "politique"],
    isPremium: false,
    publishedAt: "2026-06-03T08:00:00.000Z",
    readingTimeMinutes: 18,
    articleBody: "Pendant des decennies, l'economie a mesure ce qui se vendait...",
  },
  {
    tenantSlug: defaultTenant.slug,
    status: "published" as const,
    slug: "lea-bardin-entretien",
    kind: "episode" as const,
    title: "Avec Lea Bardin",
    summary: "Entretien long format sur le travail invisible.",
    category: "Podcast",
    tags: ["podcast"],
    isPremium: true,
    publishedAt: "2026-06-03T09:00:00.000Z",
    durationSeconds: 3240,
    audioUrl: "https://example.com/audio/lea-bardin.mp3",
  },
  {
    tenantSlug: defaultTenant.slug,
    status: "published" as const,
    slug: "democratie-locale",
    kind: "video" as const,
    title: "Democratie locale, ou en sommes-nous ?",
    summary: "Debat video long format.",
    category: "Debat",
    tags: ["video", "youtube"],
    isPremium: false,
    publishedAt: "2026-06-03T10:00:00.000Z",
    durationSeconds: 3862,
    videoSource: {
      kind: "youtube" as const,
      youtubeVideoId: "abc123xyz00",
      youtubeUrl: "https://www.youtube.com/watch?v=abc123xyz00",
    },
  },
];
```

- [ ] **Step 6: Implement shared editorial types and selectors**

```ts
// src/features/content/types.ts
export type ContentKind = "article" | "episode" | "video";
export type ContentStatus = "draft" | "published" | "archived";

export type ContentCardModel = {
  id: string;
  kind: ContentKind;
  kindLabel: string;
  title: string;
  summary: string;
  metaLabel: string;
  href: string;
  isPremium: boolean;
};
```

```ts
// src/features/content/selectors.ts
import type { ContentCardModel, ContentKind } from "./types";

const KIND_LABELS: Record<ContentKind, string> = {
  article: "Article",
  episode: "Episode",
  video: "Video",
};

export function toContentCardModel(content: {
  _id: string;
  kind: ContentKind;
  title: string;
  summary: string;
  isPremium: boolean;
  durationSeconds?: number;
  readingTimeMinutes?: number;
}) : ContentCardModel {
  const metaParts = [];
  if (content.kind === "article" && content.readingTimeMinutes) {
    metaParts.push(`${content.readingTimeMinutes} min read`);
  }
  if ((content.kind === "episode" || content.kind === "video") && content.durationSeconds) {
    metaParts.push(`${Math.round(content.durationSeconds / 60)} min`);
  }
  if (content.isPremium) {
    metaParts.push("Premium");
  }

  return {
    id: content._id,
    kind: content.kind,
    kindLabel: KIND_LABELS[content.kind],
    title: content.title,
    summary: content.summary,
    metaLabel: metaParts.join(" · "),
    href: `/${content.kind}/${content._id}`,
    isPremium: content.isPremium,
  };
}
```

- [ ] **Step 7: Run the selector test to verify it passes**

Run: `npm test -- --runInBand __tests__/content-selectors.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add convex/schema.ts convex/content/queries.ts convex/tenants/seed.ts src/features/content/types.ts src/features/content/selectors.ts __tests__/content-selectors.test.ts
git commit -m "Add published editorial content slice"
```

### Task 3: Replace the tenant validation screen with a public feed

**Files:**
- Modify: `app/(app)/home.tsx`
- Create: `src/components/content/content-card.tsx`
- Test: `__tests__/home-feed.test.tsx`

- [ ] **Step 1: Write the failing feed rendering test**

```tsx
import { render, screen } from "@testing-library/react-native";

import HomeScreen from "../app/(app)/home";

jest.mock("convex/react", () => ({
  useQuery: () => [
    {
      _id: "1",
      kind: "article",
      title: "L'economie du soin",
      summary: "Une analyse",
      isPremium: false,
      readingTimeMinutes: 18,
    },
  ],
  useMutation: () => jest.fn(),
}));

describe("home feed", () => {
  it("renders published content cards instead of the tenant seed state", () => {
    render(<HomeScreen />);

    expect(screen.getByText("L'economie du soin")).toBeTruthy();
    expect(screen.queryByText(/Seed demo tenant/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/home-feed.test.tsx`
Expected: FAIL because the current home screen still renders tenant bootstrap state.

- [ ] **Step 3: Create a reusable content card**

```tsx
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../features/theme/theme-provider";
import type { ContentCardModel } from "../../features/content/types";

export function ContentCard({ item }: { item: ContentCardModel }) {
  const { theme } = useAppTheme();

  return (
    <Link href={item.href as never} asChild>
      <Pressable
        style={[
          styles.card,
          {
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Text style={[styles.kicker, { color: theme.colors.accent }]}>
          {item.kindLabel}
          {item.isPremium ? " · Premium" : ""}
        </Text>
        <Text style={[styles.title, { color: theme.colors.heading }]}>{item.title}</Text>
        <Text style={[styles.summary, { color: theme.colors.text }]}>{item.summary}</Text>
        <Text style={[styles.meta, { color: theme.colors.textMuted }]}>{item.metaLabel}</Text>
      </Pressable>
    </Link>
  );
}
```

- [ ] **Step 4: Replace the home screen with a Convex-backed public feed**

```tsx
const contents =
  useQuery(api.content.queries.listPublishedFeed, {
    tenantSlug: defaultTenant.slug,
  }) ?? [];

const items = contents.map(toContentCardModel);

return (
  <Screen>
    <View style={styles.container}>
      <Text style={[styles.eyebrow, { color: theme.colors.accent }]}>
        {t("eyebrow")}
      </Text>
      <Text style={[styles.title, { color: theme.colors.heading }]}>
        {t("feedTitle")}
      </Text>
      <View style={styles.list}>
        {items.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </View>
    </View>
  </Screen>
);
```

- [ ] **Step 5: Run the feed test to verify it passes**

Run: `npm test -- --runInBand __tests__/home-feed.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add 'app/(app)/home.tsx' src/components/content/content-card.tsx __tests__/home-feed.test.tsx
git commit -m "Build public multi-format feed"
```

### Task 4: Add public article, episode, and video detail routes

**Files:**
- Create: `app/article/[id].tsx`
- Create: `app/episode/[id].tsx`
- Create: `app/video/[id].tsx`
- Modify: `src/i18n/resources.ts`
- Create: `src/i18n/locales/en/article.ts`
- Create: `src/i18n/locales/fr/article.ts`
- Create: `src/i18n/locales/en/episode.ts`
- Create: `src/i18n/locales/fr/episode.ts`
- Create: `src/i18n/locales/en/video.ts`
- Create: `src/i18n/locales/fr/video.ts`

- [ ] **Step 1: Add missing translation namespaces**

```ts
import articleEn from "./locales/en/article";
import episodeEn from "./locales/en/episode";
import videoEn from "./locales/en/video";
import articleFr from "./locales/fr/article";
import episodeFr from "./locales/fr/episode";
import videoFr from "./locales/fr/video";

export const resources = {
  en: {
    // ...
    article: articleEn,
    episode: episodeEn,
    video: videoEn,
  },
  fr: {
    // ...
    article: articleFr,
    episode: episodeFr,
    video: videoFr,
  },
};
```

- [ ] **Step 2: Add public detail routes that read from `getPublishedById`**

```tsx
// app/article/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { Text, View } from "react-native";
import { api } from "../../convex/_generated/api";
import { Screen } from "../../src/components/layout/screen";

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const content = useQuery(api.content.queries.getPublishedById, id ? { id: id as never } : "skip");

  if (content === undefined) return <Screen><Text>Loading...</Text></Screen>;
  if (content === null || content.kind !== "article") return <Screen><Text>Not found</Text></Screen>;

  return (
    <Screen>
      <View>
        <Text>{content.title}</Text>
        <Text>{content.articleBody}</Text>
      </View>
    </Screen>
  );
}
```

Use the same pattern for `episode` and `video`, rendering:

- `Episode`: title, summary, duration, premium lock CTA if needed
- `Video`: title, summary, provider label, YouTube CTA placeholder

- [ ] **Step 3: Run targeted smoke tests**

Run: `npm test -- --runInBand __tests__/content-selectors.test.ts __tests__/home-feed.test.tsx`
Expected: PASS and no TypeScript import break in new namespaces.

- [ ] **Step 4: Commit**

```bash
git add app/article/[id].tsx app/episode/[id].tsx app/video/[id].tsx src/i18n/resources.ts src/i18n/locales/en/article.ts src/i18n/locales/fr/article.ts src/i18n/locales/en/episode.ts src/i18n/locales/fr/episode.ts src/i18n/locales/en/video.ts src/i18n/locales/fr/video.ts
git commit -m "Add public content detail routes"
```

### Task 5: Add first-pass degraded network primitives

**Files:**
- Create: `src/features/network/use-network-status.ts`
- Create: `src/components/content/degraded-banner.tsx`
- Create: `src/i18n/locales/en/network.ts`
- Create: `src/i18n/locales/fr/network.ts`
- Modify: `src/i18n/resources.ts`
- Modify: `app/(app)/home.tsx`
- Test: `__tests__/network-status.test.tsx`

- [ ] **Step 1: Write the failing degraded-banner test**

```tsx
import { render, screen } from "@testing-library/react-native";

import { DegradedBanner } from "../src/components/content/degraded-banner";

describe("degraded banner", () => {
  it("renders an offline message when the app is offline", () => {
    render(<DegradedBanner state="offline" />);
    expect(screen.getByText("You are offline")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/network-status.test.tsx`
Expected: FAIL because the component does not exist yet.

- [ ] **Step 3: Add a simple network-state hook and banner**

```ts
// src/features/network/use-network-status.ts
export type NetworkState = "online" | "offline" | "backendDegraded" | "authDegraded";

export function useNetworkStatus(): { state: NetworkState } {
  return { state: "online" };
}
```

```tsx
// src/components/content/degraded-banner.tsx
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../features/theme/theme-provider";
import type { NetworkState } from "../../features/network/use-network-status";

export function DegradedBanner({ state }: { state: NetworkState }) {
  const { t } = useTranslation("network");
  const { theme } = useAppTheme();

  if (state === "online") return null;

  const label =
    state === "offline"
      ? t("offline")
      : state === "backendDegraded"
        ? t("backendDegraded")
        : t("authDegraded");

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: theme.colors.text }]}>{label}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Render the banner at the top of the home feed**

```tsx
const { state } = useNetworkStatus();

return (
  <Screen>
    <View style={styles.container}>
      <DegradedBanner state={state} />
      {/* feed content */}
    </View>
  </Screen>
);
```

- [ ] **Step 5: Run the degraded banner test to verify it passes**

Run: `npm test -- --runInBand __tests__/network-status.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/network/use-network-status.ts src/components/content/degraded-banner.tsx src/i18n/resources.ts src/i18n/locales/en/network.ts src/i18n/locales/fr/network.ts 'app/(app)/home.tsx' __tests__/network-status.test.tsx
git commit -m "Add degraded network read-state primitives"
```

### Task 6: Verify the full public read slice

**Files:**
- Modify: `src/i18n/locales/en/home.ts`
- Modify: `src/i18n/locales/fr/home.ts`
- Modify: `src/i18n/locales/en/profile.ts`
- Modify: `src/i18n/locales/fr/profile.ts`
- Test: `__tests__/i18n-parity.test.ts`

- [ ] **Step 1: Add missing strings for guest-first feed and profile**

```ts
export default {
  eyebrow: "MediumShip",
  feedTitle: "Latest stories",
  // ...
};
```

```ts
export default {
  guestTitle: "Your account",
  guestCardTitle: "Create an account",
  guestCardDescription: "Sign in to unlock bookmarks, premium, and offline downloads.",
  createAccount: "Create an account",
  // ...
};
```

- [ ] **Step 2: Run the i18n parity test**

Run: `npm test -- --runInBand __tests__/i18n-parity.test.ts`
Expected: PASS

- [ ] **Step 3: Run the milestone verification suite**

Run: `npm test -- --runInBand __tests__/guest-profile.test.tsx __tests__/content-selectors.test.ts __tests__/home-feed.test.tsx __tests__/network-status.test.tsx __tests__/i18n-parity.test.ts`
Expected: PASS

- [ ] **Step 4: Seed demo content locally**

Run: `npm run convex:seed`
Expected: the default tenant exists and one published article, episode, and video are inserted.

- [ ] **Step 5: Smoke the app manually**

Run: `npm run start`
Expected:
- `/home` opens without sign-in
- feed renders mixed content
- `Profile` shows a guest CTA while signed out
- article / episode / video routes open

- [ ] **Step 6: Commit**

```bash
git add src/i18n/locales/en/home.ts src/i18n/locales/fr/home.ts src/i18n/locales/en/profile.ts src/i18n/locales/fr/profile.ts
git commit -m "Finish guest-first public read model"
```

## Follow-up Plans

This plan intentionally stops before:

- `apps/cms`
- hosted-video upload and playback
- premium entitlements and gating
- offline downloads
- external status channel

Those belong in separate plans:

- `2026-06-03-cms-mono-tenant-operator-surface.md`
- `2026-06-03-premium-hosted-video-offline.md`
