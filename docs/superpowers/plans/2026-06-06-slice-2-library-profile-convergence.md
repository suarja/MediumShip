# Slice 2 — Library And Profile Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `Library` into the real signed-in personal surface, make `bookmark` available to any signed-in account, and slim `Profile` down to identity / status / settings instead of content shelves.

**Architecture:** Reuse the existing guest-first shell from slice 1. Move the reusable “saved / offline shelf” presentation out of the `profile` namespace into a small `library` component set, then wire `Library` to real member data. Keep `Profile` on top of the existing `ProfileHero` and `ProfileStatCards`, but remove content shelves from that route.

**Tech Stack:** Expo Router, React Native, TypeScript, Convex React, Clerk Expo, i18next, Jest, React Native Testing Library

---

## Read First

- `docs/plans/2026-06-05-media-prototype-planning-slides.md`
- `docs/superpowers/plans/2026-06-06-slice-1-mobile-shell-convergence.md`
- `docs/podapp/project/mobile-mockups/components.jsx`
- `docs/podapp/project/mobile-mockups/screens2.jsx`
- `docs/podapp/project/mobile-mockups/proto-screens.jsx`
- `CLAUDE.md`

Also required for this slice:

- Use the `frontend-design` skill for the signed-in `Library` layout and the slimmed `Profile`.
- Never hardcode colors in mobile UI.
- Preserve the guest-first architecture: public reading remains open, member data is conditional.

## Scope Guard

This slice includes:

- signed-in `Library` built on real saved / offline data
- `bookmark = free for signed-in accounts`
- `Profile` reduced to identity / status / settings / light summary
- existing settings access preserved from `Profile`
- tests covering signed-in `Library` and slimmed `Profile`

This slice does **not** include:

- avatar upload/edit
- personal lists CRUD
- bottom-sheet paywall
- `Explore` search backend
- `Agenda`, `Collections`, or `Community` implementation

---

## File Structure

- `app/(app)/library.tsx` — keep the guest gate from slice 1, replace the signed-in placeholder body with real sections and premium-locked placeholders.
- `app/(app)/profile.tsx` — keep auth hydration and hero/stat logic, remove saved/offline shelves from the route.
- `src/components/library/library-collection-section.tsx` — reusable featured shelf UI for saved and offline content.
- `src/components/library/saved-library-section.tsx` — saved-content shelf, now owned by `Library`.
- `src/components/library/downloaded-library-section.tsx` — offline shelf, now owned by `Library`.
- `src/features/bookmarks/use-bookmarks.ts` — change access rule from `member only` to `signed-in account`.
- `src/i18n/locales/en/library.ts` / `src/i18n/locales/fr/library.ts` — real signed-in `Library` copy and locked-state copy.
- `src/i18n/locales/en/profile.ts` / `src/i18n/locales/fr/profile.ts` — profile copy after content shelves move out.
- `__tests__/signed-in-library-screen.test.tsx` — signed-in account sees real personal sections in `Library`.
- `__tests__/guest-profile.test.tsx` — update expectations so guest `Profile` is identity/status oriented, not shelf oriented.

---

### Task 1: Move the collection shelf UI under `library`

**Files:**
- Create: `src/components/library/library-collection-section.tsx`
- Create: `src/components/library/saved-library-section.tsx`
- Create: `src/components/library/downloaded-library-section.tsx`
- Modify: `app/(app)/library.tsx`
- Test: `__tests__/signed-in-library-screen.test.tsx`

- [ ] **Step 1: Write the failing signed-in `Library` screen test**

```tsx
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";

import LibraryScreen from "../app/(app)/library";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "user_123",
  }),
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

jest.mock("../src/components/library/saved-library-section", () => ({
  SavedLibrarySection: () => "Saved library section",
}));

jest.mock("../src/components/library/downloaded-library-section", () => ({
  DownloadedLibrarySection: () => "Offline shelf section",
}));

describe("signed-in library screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("renders the signed-in personal sections instead of the guest gate", () => {
    render(<LibraryScreen />);

    expect(screen.getByText("Library")).toBeTruthy();
    expect(screen.getByText("Saved library section")).toBeTruthy();
    expect(screen.getByText("Offline shelf section")).toBeTruthy();
    expect(screen.getByText("Lists")).toBeTruthy();
    expect(screen.queryByText("Your library, everywhere")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/signed-in-library-screen.test.tsx`
Expected: FAIL because `LibraryScreen` still renders its in-file placeholder sections and does not import the new `library` components.

- [ ] **Step 3: Create the shared shelf component under `library`**

```tsx
// src/components/library/library-collection-section.tsx
export type LibraryCollectionItem = {
  id: string;
  href: string;
  title: string;
  eyebrow: string;
  meta: string;
  imageUrl?: string;
  iconName: IconName;
  badgeLabel: string;
  tone?: "accent" | "premium";
};

type LibraryCollectionSectionProps = {
  title: string;
  subtitle: string;
  items: LibraryCollectionItem[];
  isLoading: boolean;
  loadingLabel: string;
  emptyTitle: string;
  emptyBody: string;
  emptyIconName: IconName;
  emptyCtaLabel?: string;
  emptyCtaHref?: string;
};

export function LibraryCollectionSection(props: LibraryCollectionSectionProps) {
  // Start from the current `ProfileCollectionSection` implementation and
  // rename the exported type/component to `LibraryCollectionItem` and
  // `LibraryCollectionSection`. Do not change rendering behavior in this task.
}
```

- [ ] **Step 4: Create the saved/offline sections in `src/components/library`**

```tsx
// src/components/library/saved-library-section.tsx
import { useTranslation } from "react-i18next";

import { useBookmarks } from "../../features/bookmarks/use-bookmarks";
import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { getContentCoverImageUrl } from "../../features/content/selectors";
import {
  LibraryCollectionSection,
  type LibraryCollectionItem,
} from "./library-collection-section";

export function SavedLibrarySection() {
  const { t } = useTranslation(["library"]);
  const { isSignedIn } = useClerkAuth();
  const { bookmarks, isMembershipLoading, isBookmarksLoading } = useBookmarks();

  const items: LibraryCollectionItem[] = bookmarks.map((bookmark) => ({
    id: bookmark.content._id,
    href: `/${bookmark.content.kind}/${bookmark.content._id}`,
    title: bookmark.content.title,
    eyebrow: `${t(`library:kinds.${bookmark.content.kind}`)} · ${bookmark.content.category}`,
    meta: bookmark.content.isPremium
      ? t("library:saved.rowMetaPremium")
      : t("library:saved.rowMeta"),
    imageUrl: getContentCoverImageUrl(bookmark.content),
    iconName: "bookmark",
    badgeLabel: t("library:saved.badge"),
    tone: bookmark.content.isPremium ? "premium" : "accent",
  }));

  return (
    <LibraryCollectionSection
      emptyBody={isSignedIn ? t("library:saved.empty") : t("library:saved.guestHint")}
      emptyCtaHref={isSignedIn ? "/home" : "/sign-in"}
      emptyCtaLabel={isSignedIn ? t("library:saved.exploreCta") : t("library:actions.signInCta")}
      emptyIconName="bookmark-outline"
      emptyTitle={isSignedIn ? t("library:saved.emptyTitle") : t("library:saved.guestTitle")}
      isLoading={isMembershipLoading || isBookmarksLoading}
      items={items}
      loadingLabel={t("library:saved.loading")}
      subtitle={t("library:screen.savedSubtitle")}
      title={t("library:screen.sections.saved")}
    />
  );
}
```

```tsx
// src/components/library/downloaded-library-section.tsx
import { useTranslation } from "react-i18next";

import { useClerkAuth } from "../../features/auth/use-clerk-auth";
import { useDownloads } from "../../features/downloads/use-downloads";
import { useIsMember } from "../../features/membership/use-is-member";
import { getContentCoverImageUrl } from "../../features/content/selectors";
import {
  LibraryCollectionSection,
  type LibraryCollectionItem,
} from "./library-collection-section";

export function DownloadedLibrarySection() {
  const { t } = useTranslation(["library"]);
  const { isSignedIn } = useClerkAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const { downloads, isLoading } = useDownloads({ enabled: isSignedIn && isMember });

  const items: LibraryCollectionItem[] = downloads.map((download) => ({
    id: download.content._id,
    href: `/${download.content.kind}/${download.content._id}`,
    title: download.content.title,
    eyebrow: `${t(`library:kinds.${download.content.kind}`)} · ${download.content.category}`,
    meta: t("library:downloads.rowMeta"),
    imageUrl: download.localCoverImagePath ?? getContentCoverImageUrl(download.content),
    iconName: "download",
    badgeLabel: t("library:downloads.badge"),
    tone: download.content.isPremium ? "premium" : "accent",
  }));

  return (
    <LibraryCollectionSection
      emptyBody={
        !isSignedIn
          ? t("library:downloads.guestHint")
          : isMember
            ? t("library:downloads.empty")
            : t("library:downloads.memberHint")
      }
      emptyCtaHref={!isSignedIn ? "/sign-in" : isMember ? "/home" : "/premium"}
      emptyCtaLabel={
        !isSignedIn
          ? t("library:actions.signInCta")
          : isMember
            ? t("library:downloads.exploreCta")
            : t("library:actions.memberCta")
      }
      emptyIconName="download-outline"
      emptyTitle={
        !isSignedIn
          ? t("library:downloads.guestTitle")
          : isMember
            ? t("library:downloads.emptyTitle")
            : t("library:downloads.memberTitle")
      }
      isLoading={isMembershipLoading || isLoading}
      items={items}
      loadingLabel={t("library:downloads.loading")}
      subtitle={t("library:screen.offlineSubtitle")}
      title={t("library:screen.sections.offline")}
    />
  );
}
```

- [ ] **Step 5: Replace the signed-in placeholder body in `Library`**

```tsx
// app/(app)/library.tsx
import { DownloadedLibrarySection } from "../../src/components/library/downloaded-library-section";
import { SavedLibrarySection } from "../../src/components/library/saved-library-section";

// keep the guest gate exactly as slice 1 left it

// inside the signed-in branch:
<View style={styles.sectionBlockFirst}>
  <SectionHeader label={t("library:screen.sections.resume")} />
  <View>{/* Reuse the current in-file `resumeCard` block unchanged in this slice. */}</View>
</View>

<View style={styles.sectionBlock}>
  <SavedLibrarySection />
</View>

<View style={styles.sectionBlock}>
  <SectionHeader
    label={t("library:screen.sections.lists")}
    meta={t("library:screen.listsMeta")}
  />
  <PlaceholderCard
    body={t("library:screen.listsBody")}
    title={t("library:screen.listsTitle")}
  />
</View>

<View style={styles.sectionBlock}>
  <DownloadedLibrarySection />
</View>
```

- [ ] **Step 6: Run the screen test to verify it passes**

Run: `npm test -- --runInBand __tests__/signed-in-library-screen.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add __tests__/signed-in-library-screen.test.tsx app/(app)/library.tsx src/components/library/library-collection-section.tsx src/components/library/saved-library-section.tsx src/components/library/downloaded-library-section.tsx
git commit -m "feat: wire signed-in library shelves"
```

---

### Task 2: Make bookmarks free for signed-in accounts

**Files:**
- Modify: `src/features/bookmarks/use-bookmarks.ts`
- Modify: `src/i18n/locales/en/library.ts`
- Modify: `src/i18n/locales/fr/library.ts`
- Test: `__tests__/signed-in-library-screen.test.tsx`

- [ ] **Step 1: Extend the signed-in `Library` test to assert the saved section copy is not premium-gated**

```tsx
expect(screen.getByText("Saved library section")).toBeTruthy();
expect(screen.queryByText("Upgrade to save items")).toBeNull();
```

- [ ] **Step 2: Run the test to verify it fails or remains incomplete**

Run: `npm test -- --runInBand __tests__/signed-in-library-screen.test.tsx`
Expected: if the implementation still depends on member-only bookmarks, the signed-in standard-account state is not represented correctly.

- [ ] **Step 3: Change the bookmark access rule**

```ts
// src/features/bookmarks/use-bookmarks.ts
export function useBookmarks() {
  const { isAuthenticated } = useConvexAuth();
  const { isMember, isLoading: isMembershipLoading } = useIsMember();
  const toggleBookmark = useMutation(api.bookmarks.mutations.toggleBookmark);
  const canAccessBookmarks = isAuthenticated;
  const rawBookmarks = useQuery(
    api.bookmarks.queries.listBookmarks,
    canAccessBookmarks ? {} : "skip",
  ) as BookmarkListItem[] | undefined;
  const bookmarks = canAccessBookmarks && Array.isArray(rawBookmarks) ? rawBookmarks : [];

  return {
    bookmarks,
    isMember,
    isMembershipLoading,
    canAccessBookmarks,
    isBookmarksLoading: canAccessBookmarks && rawBookmarks === undefined,
    toggleBookmark,
  };
}
```

- [ ] **Step 4: Update `library` copy so saved items are clearly free while offline and lists stay premium**

```ts
// src/i18n/locales/en/library.ts
screen: {
  savedMeta: "Free",
  listsMeta: "Premium",
  savedSubtitle: "Everything you chose to keep, across articles, episodes, and videos.",
  offlineSubtitle: "Downloads remain reserved for premium-capable formats and member access.",
  listsTitle: "Lists",
  listsBody: "Personal lists arrive in a later slice. Keep the slot visible but premium-locked for now.",
}
```

```ts
// src/i18n/locales/fr/library.ts
screen: {
  savedMeta: "Gratuit",
  listsMeta: "Premium",
  savedSubtitle: "Tous les contenus que vous avez choisi de garder, quel que soit le format.",
  offlineSubtitle: "Les téléchargements restent réservés aux formats compatibles et aux membres premium.",
  listsTitle: "Listes",
  listsBody: "Les listes personnelles arrivent dans une prochaine slice. Gardez la place visible mais verrouillée pour l'instant.",
}
```

- [ ] **Step 5: Run the screen test again**

Run: `npm test -- --runInBand __tests__/signed-in-library-screen.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/bookmarks/use-bookmarks.ts src/i18n/locales/en/library.ts src/i18n/locales/fr/library.ts __tests__/signed-in-library-screen.test.tsx
git commit -m "feat: make signed-in bookmarks free"
```

---

### Task 3: Slim `Profile` down to identity, status, and settings

**Files:**
- Modify: `app/(app)/profile.tsx`
- Modify: `src/i18n/locales/en/profile.ts`
- Modify: `src/i18n/locales/fr/profile.ts`
- Modify: `__tests__/guest-profile.test.tsx`

- [ ] **Step 1: Rewrite the guest profile test around the new responsibility**

```tsx
it("keeps profile focused on identity and account actions", () => {
  render(<ProfileScreen />);

  expect(screen.getAllByText("Create an account").length).toBeGreaterThan(0);
  expect(screen.getByText("Guest reader")).toBeTruthy();
  expect(screen.getByText("Your profile")).toBeTruthy();
  expect(screen.queryByText("Saved library")).toBeNull();
  expect(screen.queryByText("Offline shelf")).toBeNull();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/guest-profile.test.tsx`
Expected: FAIL because `ProfileScreen` still renders `SavedContentSection` and `DownloadedContentSection`.

- [ ] **Step 3: Remove content shelves from `ProfileScreen`**

```tsx
// app/(app)/profile.tsx
import { ProfileHero } from "../../src/components/profile/profile-hero";
import { ProfileStatCards } from "../../src/components/profile/profile-stat-cards";

// remove:
// import { SavedContentSection } from "../../src/components/profile/saved-content-section";
// import { DownloadedContentSection } from "../../src/components/profile/downloaded-content-section";

// keep:
// - auth hydration gate
// - ensureCurrentUser side effect
// - hero
// - stat cards
// - guest note

// remove from JSX:
// <SavedContentSection />
// <DownloadedContentSection />
```

- [ ] **Step 4: Refresh the profile copy so it speaks about account state rather than shelves**

```ts
// src/i18n/locales/en/profile.ts
guestNote:
  "Your profile now focuses on identity, account state, and settings. Saved items and offline copies live in Library.",
stats: {
  savedHint: "See Library",
  downloadedHint: "See Library",
}
```

```ts
// src/i18n/locales/fr/profile.ts
guestNote:
  "Votre profil se concentre maintenant sur l'identité, le statut du compte et les réglages. Les contenus enregistrés et hors ligne vivent dans Bibliothèque.",
stats: {
  savedHint: "Voir Bibliothèque",
  downloadedHint: "Voir Bibliothèque",
}
```

- [ ] **Step 5: Run the profile test**

Run: `npm test -- --runInBand __tests__/guest-profile.test.tsx`
Expected: PASS

- [ ] **Step 6: Run the combined slice verification**

Run: `npm test -- --runInBand __tests__/guest-library-screen.test.tsx __tests__/signed-in-library-screen.test.tsx __tests__/guest-profile.test.tsx __tests__/app-tab-bar.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/(app)/profile.tsx src/i18n/locales/en/profile.ts src/i18n/locales/fr/profile.ts __tests__/guest-profile.test.tsx
git commit -m "feat: slim profile to identity and settings"
```

---

## Self-Review

- Spec coverage: this plan covers the next product move after shell convergence: real signed-in `Library`, free bookmarks for signed-in accounts, and `Profile` cleanup.
- Placeholder scan: no `TODO`, `TBD`, or “implement later” instructions are left inside the execution steps.
- Type consistency: `LibraryCollectionSection`, `SavedLibrarySection`, and `DownloadedLibrarySection` use the same `LibraryCollectionItem` contract throughout the plan.

## Manual Verification

After the automated tests pass, verify manually in Expo:

- guest `Library` still shows the sign-in gate
- signed-in non-member `Library` shows saved content but keeps offline and lists locked
- signed-in member `Library` shows offline shelf content when local downloads exist
- `Profile` still reaches `/settings` from the hero button

## Next Slice After This One

Once this slice is merged, the next plan should target `Explore` depth:

- public search query
- agenda list + event detail
- richer community surface
