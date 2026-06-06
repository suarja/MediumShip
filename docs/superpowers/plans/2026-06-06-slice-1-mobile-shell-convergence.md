# Slice 1 — Mobile Shell Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge the mobile app shell from the current `Home / Premium / Profile / Settings` navigation to the target `Home / Explore / Library / Profile` shell, while keeping `Premium` and `Settings` accessible but no longer visible as root tabs.

**Architecture:** Keep the existing Expo Router structure at the repo root. This slice is intentionally narrow: it only changes the visible app shell and adds the first scaffold screens for `Explore` and `Library`. It does **not** extract personal content out of `Profile` yet, does **not** implement search logic, and does **not** implement collections/events/community data fetching.

**Tech Stack:** Expo Router, React Native, TypeScript, i18next, Jest, React Native Testing Library

---

## Read First

- `docs/plans/2026-06-05-media-prototype-planning-slides.md`
- `docs/podapp/project/mobile-mockups/components.jsx`
- `docs/podapp/project/mobile-mockups/screens2.jsx`
- `docs/podapp/project/mobile-mockups/proto-screens.jsx`
- `CLAUDE.md`

Also required for this slice:

- Use the `frontend-design` skill for the `Explore` and `Library` screen scaffolds.
- Recreate the visual intent of the mockup with the app's existing theme tokens.
- Never hardcode colors in mobile UI.

## Scope Guard

This slice includes:

- visible `4 tabs` app shell
- new `Explore` tab scaffold
- new `Library` tab scaffold
- `Premium` hidden from the tab bar
- `Settings` hidden from the tab bar but still reachable from `Profile`
- navigation labels updated for `Explore` and `Library`

This slice does **not** include:

- extracting saved/downloaded content out of `Profile`
- implementing search backend logic
- implementing collections backend or CMS logic
- implementing agenda/event backend logic
- implementing avatar edit
- deleting the existing `premium` screen

---

## File Structure

- `app/(app)/_layout.tsx` — tab registration; only `home`, `explore`, `library`, and `profile` are visible tabs; `premium` and `settings` stay hidden routes for now.
- `app/(app)/explore.tsx` — first Explore root screen scaffold matching the roadmap and mockup intent.
- `app/(app)/library.tsx` — first Library root screen scaffold with a guest-first gate and lightweight signed-in placeholder structure.
- `src/components/navigation/app-tab-bar.tsx` — custom floating tab bar, now rendering only routes whose Expo Router `href` is not `null`.
- `src/i18n/locales/en/navigation.ts` / `src/i18n/locales/fr/navigation.ts` — tab labels updated to `home / explore / library / profile`.
- `src/i18n/locales/en/explore.ts` / `src/i18n/locales/fr/explore.ts` — Explore screen copy.
- `src/i18n/locales/en/library.ts` / `src/i18n/locales/fr/library.ts` — add Library shell titles / placeholders used by the new screen.
- `src/i18n/resources.ts` — register the new `explore` namespace.
- `__tests__/app-tab-bar.test.tsx` — visible tabs only, legacy tabs hidden.
- `__tests__/explore-screen.test.tsx` — Explore shell renders expected sections.
- `__tests__/guest-library-screen.test.tsx` — guest Library gate renders sign-in CTA.

---

### Task 1: Converge the visible tab shell to four destinations

**Files:**
- Modify: `app/(app)/_layout.tsx`
- Modify: `src/components/navigation/app-tab-bar.tsx`
- Modify: `src/i18n/locales/en/navigation.ts`
- Modify: `src/i18n/locales/fr/navigation.ts`
- Test: `__tests__/app-tab-bar.test.tsx`

- [ ] **Step 1: Write the failing tab-bar visibility test**

```tsx
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";

import { AppTabBar } from "../src/components/navigation/app-tab-bar";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    theme: {
      colors: {
        border: "#DDD",
        heading: "#111",
        surface: "#FFF",
        tabBarCard: "#FFF",
        tabInactive: "#666",
      },
      radii: { lg: 18, xl: 24 },
    },
  }),
}));

describe("app tab bar", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("renders only the target four visible tabs", () => {
    render(
      <AppTabBar
        descriptors={{
          "home-key": { options: {} },
          "explore-key": { options: {} },
          "library-key": { options: {} },
          "profile-key": { options: {} },
          "premium-key": { options: { href: null } },
          "settings-key": { options: { href: null } },
        } as never}
        navigation={{
          emit: jest.fn(() => ({ defaultPrevented: false })),
          navigate: jest.fn(),
        } as never}
        state={{
          index: 0,
          key: "tab-state",
          routeNames: ["home", "explore", "library", "profile", "premium", "settings"],
          routes: [
            { key: "home-key", name: "home" },
            { key: "explore-key", name: "explore" },
            { key: "library-key", name: "library" },
            { key: "profile-key", name: "profile" },
            { key: "premium-key", name: "premium" },
            { key: "settings-key", name: "settings" },
          ],
          stale: false,
          type: "tab",
          history: [],
        } as never}
      />,
    );

    expect(screen.getByText("Home")).toBeTruthy();
    expect(screen.getByText("Explore")).toBeTruthy();
    expect(screen.getByText("Library")).toBeTruthy();
    expect(screen.getByText("Profile")).toBeTruthy();
    expect(screen.queryByText("Premium")).toBeNull();
    expect(screen.queryByText("Settings")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/app-tab-bar.test.tsx`
Expected: FAIL because the current navigation labels do not include `Explore` / `Library`, and the custom tab bar still renders every route.

- [ ] **Step 3: Update navigation labels and tab visibility**

```ts
// src/i18n/locales/en/navigation.ts
export default {
  home: "Home",
  explore: "Explore",
  library: "Library",
  profile: "Profile",
} as const;
```

```ts
// src/i18n/locales/fr/navigation.ts
export default {
  home: "Accueil",
  explore: "Explorer",
  library: "Bibliotheque",
  profile: "Profil",
} as const;
```

```tsx
// app/(app)/_layout.tsx
import { Tabs } from "expo-router";

import { AppTabBar } from "../../src/components/navigation/app-tab-bar";

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="premium" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
```

```tsx
// src/components/navigation/app-tab-bar.tsx
import type { ComponentProps } from "react";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../features/theme/theme-provider";

const TAB_META: Record<string, { icon: string; labelKey: string }> = {
  home: { icon: "◉", labelKey: "home" },
  explore: { icon: "⌕", labelKey: "explore" },
  library: { icon: "▤", labelKey: "library" },
  profile: { icon: "○", labelKey: "profile" },
};

const PILL_HEIGHT = 72;
const PILL_GAP = 12;

export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return PILL_HEIGHT + PILL_GAP + Math.max(insets.bottom, PILL_GAP);
}

type AppTabBarProps =
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]> extends (
    props: infer Props,
  ) => unknown
    ? Props
    : never;

export function AppTabBar({ state, descriptors, navigation }: AppTabBarProps) {
  const { t } = useTranslation("navigation");
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((route) => {
    const href = descriptors[route.key]?.options?.href;
    return href !== null;
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.outer,
        { paddingBottom: Math.max(insets.bottom, PILL_GAP) },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            borderRadius: theme.radii.xl,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.tabBarCard,
            shadowColor: theme.colors.heading,
          },
        ]}
      >
        {visibleRoutes.map((route) => {
          const isFocused = state.index === state.routes.findIndex((item) => item.key === route.key);
          const meta = TAB_META[route.name] ?? { icon: "•", labelKey: route.name };

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tab,
                isFocused && {
                  borderRadius: theme.radii.lg,
                  backgroundColor: theme.colors.heading,
                },
                pressed && styles.tabPressed,
              ]}
            >
              <Text
                style={[
                  styles.icon,
                  { color: isFocused ? theme.colors.surface : theme.colors.tabInactive },
                ]}
              >
                {meta.icon}
              </Text>
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? theme.colors.surface : theme.colors.tabInactive },
                ]}
              >
                {t(meta.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  inner: {
    flexDirection: "row",
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 12,
  },
  tab: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 18,
  },
  tabPressed: {
    opacity: 0.85,
  },
  icon: {
    fontSize: 14,
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --runInBand __tests__/app-tab-bar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add 'app/(app)/_layout.tsx' src/components/navigation/app-tab-bar.tsx src/i18n/locales/en/navigation.ts src/i18n/locales/fr/navigation.ts __tests__/app-tab-bar.test.tsx
git commit -m "feat: converge visible app tabs to the 4-destination shell"
```

### Task 2: Add the first Explore screen scaffold

**Files:**
- Create: `app/(app)/explore.tsx`
- Create: `src/i18n/locales/en/explore.ts`
- Create: `src/i18n/locales/fr/explore.ts`
- Modify: `src/i18n/resources.ts`
- Test: `__tests__/explore-screen.test.tsx`

- [ ] **Step 1: Write the failing Explore screen test**

```tsx
import { render, screen } from "@testing-library/react-native";

import ExploreScreen from "../app/(app)/explore";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

describe("explore screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("renders the first discovery shell sections", () => {
    render(<ExploreScreen />);

    expect(screen.getByText("Explore")).toBeTruthy();
    expect(screen.getByText("Search analyses, podcasts, events…")).toBeTruthy();
    expect(screen.getByText("Categories")).toBeTruthy();
    expect(screen.getByText("Modules")).toBeTruthy();
    expect(screen.getByText("Collections")).toBeTruthy();
    expect(screen.getByText("Community")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/explore-screen.test.tsx`
Expected: FAIL because the screen and namespace do not exist.

- [ ] **Step 3: Add the Explore namespace and screen scaffold**

```ts
// src/i18n/locales/en/explore.ts
export default {
  title: "Explore",
  searchPlaceholder: "Search analyses, podcasts, events…",
  categoriesTitle: "Categories",
  modulesTitle: "Modules",
  trendsTitle: "This week",
  categories: {
    analyses: "Analyses",
    podcasts: "Podcasts",
    videos: "Videos",
    agenda: "Agenda",
  },
  modules: {
    collections: "Collections",
    community: "Community",
  },
} as const;
```

```ts
// src/i18n/locales/fr/explore.ts
export default {
  title: "Explorer",
  searchPlaceholder: "Chercher analyses, podcasts, evenements…",
  categoriesTitle: "Categories",
  modulesTitle: "Modules",
  trendsTitle: "Cette semaine",
  categories: {
    analyses: "Analyses",
    podcasts: "Podcasts",
    videos: "Videos",
    agenda: "Agenda",
  },
  modules: {
    collections: "Collections",
    community: "Communaute",
  },
} as const;
```

```ts
// src/i18n/resources.ts
import exploreEn from "./locales/en/explore";
import exploreFr from "./locales/fr/explore";

export const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    home: homeEn,
    explore: exploreEn,
    library: libraryEn,
    navigation: navigationEn,
    profile: profileEn,
    premium: premiumEn,
    settings: settingsEn,
    article: articleEn,
    episode: episodeEn,
    video: videoEn,
    network: networkEn,
  },
  fr: {
    common: commonFr,
    auth: authFr,
    home: homeFr,
    explore: exploreFr,
    library: libraryFr,
    navigation: navigationFr,
    profile: profileFr,
    premium: premiumFr,
    settings: settingsFr,
    article: articleFr,
    episode: episodeFr,
    video: videoFr,
    network: networkFr,
  },
} as const;
```

```tsx
// app/(app)/explore.tsx
import { ScrollView, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

const CATEGORY_KEYS = ["analyses", "podcasts", "videos", "agenda"] as const;
const MODULE_KEYS = ["collections", "community"] as const;

export default function ExploreScreen() {
  const { t } = useTranslation("explore");
  const { theme } = useAppTheme();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.spacing.lg,
          paddingBottom: tabBarSpace + persistentPlayerSpace,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.heading }]}>
            {t("title")}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          style={[
            styles.searchCard,
            {
              borderRadius: theme.radii.xl,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Text style={[styles.searchLabel, { color: theme.colors.textMuted }]}>
            {t("searchPlaceholder")}
          </Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.heading }]}>
            {t("categoriesTitle")}
          </Text>
          <View style={styles.grid}>
            {CATEGORY_KEYS.map((key) => (
              <View
                key={key}
                style={[
                  styles.card,
                  {
                    borderRadius: theme.radii.xl,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <Text style={[styles.cardTitle, { color: theme.colors.heading }]}>
                  {t(`categories.${key}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.heading }]}>
            {t("modulesTitle")}
          </Text>
          <View style={styles.grid}>
            {MODULE_KEYS.map((key) => (
              <View
                key={key}
                style={[
                  styles.card,
                  {
                    borderRadius: theme.radii.xl,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <Text style={[styles.cardTitle, { color: theme.colors.heading }]}>
                  {t(`modules.${key}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 30,
    letterSpacing: -0.4,
  },
  searchCard: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  searchLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    letterSpacing: -0.2,
  },
  grid: {
    gap: 12,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  cardTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --runInBand __tests__/explore-screen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add 'app/(app)/explore.tsx' src/i18n/locales/en/explore.ts src/i18n/locales/fr/explore.ts src/i18n/resources.ts __tests__/explore-screen.test.tsx
git commit -m "feat: add first explore shell screen"
```

### Task 3: Add the guest-first Library shell

**Files:**
- Create: `app/(app)/library.tsx`
- Modify: `src/i18n/locales/en/library.ts`
- Modify: `src/i18n/locales/fr/library.ts`
- Test: `__tests__/guest-library-screen.test.tsx`

- [ ] **Step 1: Write the failing guest Library test**

```tsx
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";

import LibraryScreen from "../app/(app)/library";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
  }),
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

describe("guest library screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("shows the guest-first sign-in gate", () => {
    render(<LibraryScreen />);

    expect(screen.getByText("Library")).toBeTruthy();
    expect(screen.getByText("Your library, everywhere")).toBeTruthy();
    expect(screen.getByText("Sign in")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/guest-library-screen.test.tsx`
Expected: FAIL because the screen does not exist and the Library shell strings are missing.

- [ ] **Step 3: Add the Library shell strings and screen**

```ts
// src/i18n/locales/en/library.ts
export default {
  screen: {
    title: "Library",
    guestTitle: "Your library, everywhere",
    guestBody:
      "Sign in to save content, sync progress, and gather offline items in one place.",
    signedInTitle: "Library",
    signedInBody:
      "Saved items, resume state, offline, and personal lists move here in the next slice.",
    sections: {
      resume: "Resume",
      saved: "Saved",
      lists: "Lists",
      offline: "Offline",
    },
  },
  kinds: {
    article: "Article",
    episode: "Episode",
    video: "Video",
  },
  bookmark: {
    saveCta: "Keep",
    savedCta: "Saved",
    saveHint: "Add this format to your personal library.",
    savedHint: "Already stored in your member library.",
  },
  actions: {
    loading: "Checking your member access...",
    signInCta: "Sign in",
    signInHint:
      "Activate your profile to save content, sync progress, and download supported formats.",
    memberCta: "Become a member",
    memberHint:
      "Saved items, synced progress, and offline downloads are reserved for members.",
    memberFooter:
      "Member actions keep your library, sync, and offline copies together.",
    memberFooterWide:
      "Member actions keep your personal library, synced progress, and offline copies in one flow.",
  },
  download: {
    downloadCta: "Offline",
    downloadingCta: "Downloading",
    downloadedCta: "Downloaded",
    downloadHint: "Store this format on this device.",
    downloadedHint: "This copy is already ready offline.",
    memberHint:
      "Articles, episodes, and hosted videos can be downloaded for offline access.",
    youtubeCta: "YouTube",
    youtubeHint: "YouTube videos stay streaming-only.",
    unavailableCta: "Unavailable",
    unavailableHint: "No downloadable source is available for this content.",
  },
  saved: {
    loading: "Loading your saved library...",
    badge: "Saved",
    rowMeta: "Ready to revisit later",
    rowMetaPremium: "Premium · ready to reopen",
    guestTitle: "Keep what deserves a return visit",
    guestHint:
      "Sign in to build your personal library as you read, watch, and listen.",
    memberTitle: "Upgrade to save items",
    memberHint:
      "Member access unlocks persistent bookmarks and synced resumes across devices.",
    emptyTitle: "Your library is waiting for its first marker",
    empty:
      "Save an article, episode, or hosted video to see it here with its cover art.",
    exploreCta: "Explore the catalogue",
  },
  downloads: {
    loading: "Loading your local copies...",
    badge: "Offline",
    rowMeta: "Available without a network on this device",
    guestTitle: "Offline copies arrive with the account",
    guestHint:
      "Sign in to download supported formats and keep them even without a network.",
    memberTitle: "Offline is member-only",
    memberHint:
      "Member access unlocks downloads for articles, episodes, and hosted videos.",
    emptyTitle: "No offline shelf yet",
    empty:
      "Download a supported format to surface its cover art and local copy here.",
    exploreCta: "Find something to download",
  },
} as const;
```

```ts
// src/i18n/locales/fr/library.ts
export default {
  screen: {
    title: "Bibliotheque",
    guestTitle: "Votre bibliotheque, partout",
    guestBody:
      "Connectez-vous pour enregistrer des contenus, synchroniser la progression et reunir vos contenus hors ligne au meme endroit.",
    signedInTitle: "Bibliotheque",
    signedInBody:
      "Les enregistrements, la reprise, le hors ligne et les listes personnelles arrivent ici dans la prochaine slice.",
    sections: {
      resume: "Reprendre",
      saved: "Enregistres",
      lists: "Listes",
      offline: "Hors ligne",
    },
  },
  kinds: {
    article: "Article",
    episode: "Episode",
    video: "Video",
  },
  bookmark: {
    saveCta: "Garder",
    savedCta: "Garde",
    saveHint: "Ajoutez ce format a votre bibliotheque personnelle.",
    savedHint: "Deja range dans votre bibliotheque membre.",
  },
  actions: {
    loading: "Verification de vos droits membres...",
    signInCta: "Se connecter",
    signInHint:
      "Activez votre profil pour enregistrer des contenus, synchroniser la progression et telecharger les formats pris en charge.",
    memberCta: "Devenir membre",
    memberHint:
      "Les enregistrements, la progression synchronisee et les telechargements hors ligne sont reserves aux membres.",
    memberFooter:
      "Les actions membres gardent votre bibliotheque, votre sync et vos copies offline au meme endroit.",
    memberFooterWide:
      "Les actions membres gardent votre bibliotheque personnelle, la synchro de progression et les copies hors ligne dans un meme flux.",
  },
  download: {
    downloadCta: "Hors ligne",
    downloadingCta: "Telechargement",
    downloadedCta: "Telecharge",
    downloadHint: "Stocker ce format sur cet appareil.",
    downloadedHint: "Cette copie est deja disponible hors ligne.",
    memberHint:
      "Les articles, episodes et videos hebergees peuvent etre telecharges pour un acces hors ligne.",
    youtubeCta: "YouTube",
    youtubeHint: "Les videos YouTube restent en streaming.",
    unavailableCta: "Indisponible",
    unavailableHint: "Aucune source telechargeable n'est disponible pour ce contenu.",
  },
  saved: {
    loading: "Chargement de votre bibliotheque gardee...",
    badge: "Garde",
    rowMeta: "Pret a relire plus tard",
    rowMetaPremium: "Premium · pret a retrouver",
    guestTitle: "Gardez ce qui merite de revenir",
    guestHint: "Connectez-vous pour construire votre bibliotheque personnelle au fil de vos lectures et ecoutes.",
    memberTitle: "Passez membre pour enregistrer",
    memberHint: "L'acces membre active les bookmarks persistants et la synchronisation de vos reprises.",
    emptyTitle: "Votre bibliotheque attend son premier repere",
    empty:
      "Enregistrez un article, un episode ou une video hebergee pour les retrouver ici avec leurs couvertures.",
    exploreCta: "Explorer le catalogue",
  },
  downloads: {
    loading: "Chargement de vos copies locales...",
    badge: "Offline",
    rowMeta: "Disponible sans reseau sur cet appareil",
    guestTitle: "Les copies hors ligne arrivent avec le compte",
    guestHint: "Connectez-vous pour telecharger les formats pris en charge et les retrouver meme sans reseau.",
    memberTitle: "Le hors ligne est reserve aux membres",
    memberHint: "L'acces membre debloque les telechargements pour les articles, episodes et videos hebergees.",
    emptyTitle: "Aucune etagere offline pour l'instant",
    empty:
      "Telechargez un contenu pris en charge pour voir apparaitre ici sa couverture et sa copie locale.",
    exploreCta: "Trouver un contenu a telecharger",
  },
} as const;
```

```tsx
// app/(app)/library.tsx
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { MemberGateCard } from "../../src/components/auth/member-gate-card";
import { Screen } from "../../src/components/layout/screen";
import { useTabBarSpace } from "../../src/components/navigation/app-tab-bar";
import { useClerkAuth } from "../../src/features/auth/use-clerk-auth";
import { usePersistentMediaPlayerSpace } from "../../src/features/media/persistent-media-player";
import { fontFamilies } from "../../src/features/theme/fonts";
import { useAppTheme } from "../../src/features/theme/theme-provider";

const SECTION_KEYS = ["resume", "saved", "lists", "offline"] as const;

export default function LibraryScreen() {
  const { t } = useTranslation(["library", "common"]);
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { theme } = useAppTheme();
  const tabBarSpace = useTabBarSpace();
  const persistentPlayerSpace = usePersistentMediaPlayerSpace();

  if (!isLoaded) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={[styles.loadingLabel, { color: theme.colors.textMuted }]}>
            {t("common:status.loading")}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: theme.spacing.lg,
          paddingBottom: tabBarSpace + persistentPlayerSpace,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.heading }]}>
            {t("library:screen.title")}
          </Text>
        </View>

        {!isSignedIn ? (
          <MemberGateCard
            ctaLabel={t("library:actions.signInCta")}
            description={t("library:screen.guestBody")}
            title={t("library:screen.guestTitle")}
          />
        ) : (
          <>
            <View
              style={[
                styles.introCard,
                {
                  borderRadius: theme.radii.xl,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text style={[styles.introTitle, { color: theme.colors.heading }]}>
                {t("library:screen.signedInTitle")}
              </Text>
              <Text style={[styles.introBody, { color: theme.colors.textMuted }]}>
                {t("library:screen.signedInBody")}
              </Text>
            </View>

            <View style={styles.sectionList}>
              {SECTION_KEYS.map((key) => (
                <View
                  key={key}
                  style={[
                    styles.sectionCard,
                    {
                      borderRadius: theme.radii.xl,
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.sectionTitle, { color: theme.colors.heading }]}>
                    {t(`library:screen.sections.${key}`)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 30,
    letterSpacing: -0.4,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLabel: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
  },
  introCard: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    padding: 20,
  },
  introTitle: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 20,
  },
  introBody: {
    fontFamily: fontFamilies.body,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionList: {
    gap: 12,
  },
  sectionCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  sectionTitle: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: 15,
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --runInBand __tests__/guest-library-screen.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add 'app/(app)/library.tsx' src/i18n/locales/en/library.ts src/i18n/locales/fr/library.ts __tests__/guest-library-screen.test.tsx
git commit -m "feat: add guest-first library shell"
```

### Task 4: Verify the whole slice

**Files:**
- Test only

- [ ] **Step 1: Run the slice-focused test set**

Run: `npm test -- --runInBand __tests__/app-tab-bar.test.tsx __tests__/explore-screen.test.tsx __tests__/guest-library-screen.test.tsx __tests__/guest-profile.test.tsx`
Expected: PASS

- [ ] **Step 2: Run the broader mobile regression tests**

Run: `npm test -- --runInBand __tests__/home-feed.test.tsx __tests__/guest-profile.test.tsx __tests__/network-status.test.tsx`
Expected: PASS

- [ ] **Step 3: Run TypeScript**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Manual smoke**

Check:

- tab bar shows only `Accueil / Explorer / Bibliotheque / Profil`
- `Premium` is no longer a visible tab
- `Settings` is no longer a visible tab
- tapping the settings button from `Profile` still opens `/settings`
- `Explore` opens with the search shell and category/module blocks
- `Library` shows the guest gate while signed out

- [ ] **Step 5: Commit verification-only follow-up if needed**

```bash
git status --short
```

Expected: no unstaged changes

---

## Self-Review

- Spec coverage: this plan covers only slice 1 from the validated roadmap: app shell convergence, Explore scaffold, Library scaffold, hidden Premium/Settings tabs.
- Placeholder scan: no `TODO`, no deferred implementation hidden inside this slice.
- Type consistency: the new route names are `explore` and `library` across layout, tab bar, and navigation locales.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-06-slice-1-mobile-shell-convergence.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
