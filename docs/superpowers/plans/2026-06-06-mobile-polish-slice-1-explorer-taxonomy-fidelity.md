# Slice 1 — Explorer Taxonomy + Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `Explorer` into the first polished surface of the new mobile UI supervision cycle: stable category iconography, better category-detail navigation, functional trend chips, and mockup-aligned sizing/copy on the discovery shell.

**Architecture:** This is the **first executable slice** after the supervision design. The supervision "cadre" and "verification" slices stay as control constraints, not implementation targets. Keep taxonomy lightweight: categories remain **derived** from `contents.category`; do **not** introduce a `categories` table or CMS authoring yet. Instead, centralize category presentation in a pure helper, add a dedicated indexed query for category detail, and realign the existing `Explorer`/category routes to the `podapp` mockup.

**Tech Stack:** Expo Router, React Native, TypeScript, Convex, i18next, Jest, Vitest + convex-test

---

## Read First

- `docs/superpowers/specs/2026-06-06-mobile-ui-supervision-slices-design.md` — use the **Slice 2 — Explorer + taxonomie** and **Slice 6 — Verification** sections as the product contract for this work.
- `docs/agents/mockup-to-code-map.md` — the mockup-to-token translation rules, responsive rules, top-bar pattern, and testing gotchas already discovered in the earlier shell/profile work.
- `docs/agents/ui-visual-testing.md` — required Expo web + headless Chrome pixel protocol after tests/typecheck pass.
- `docs/plans/2026-06-05-media-prototype-planning-slides.md` — Slide 6 (`Explorer`), Slide 14 (`Search, catégories, taxonomie`), Slide 17 (`Slices d'implémentation recommandées`).
- `docs/superpowers/plans/2026-06-06-slice-3-explorer-v1-and-paywall.md` — read this to avoid re-solving already-shipped Explore behavior; this slice is a **realignment/polish** slice on top of that work.
- Mockup files:
  - `docs/podapp/project/mobile-mockups/proto-screens.jsx` — `ExploreRoot` (~101-139) and `CategoryView` (~440-468).
  - `docs/podapp/project/mobile-mockups/styles.css` — `.search` (~322-330), `.sh__t` (~183-184), `.chip` (~188-200), `.search__cat` / `.search__trending` (~676-690).
- Current implementation:
  - `app/(app)/explore.tsx`
  - `app/category/[name].tsx`
  - `src/features/categories/use-categories.ts`
  - `src/features/search/use-search.ts`
  - `src/i18n/locales/en/explore.ts`
  - `src/i18n/locales/fr/explore.ts`
  - `convex/content/queries.ts`
  - `__tests__/explore-screen.test.tsx`
  - `__tests__/explore-modules.test.tsx`
- `convex/_generated/ai/guidelines.md`
- `CLAUDE.md`

Standing rules for every task below:

- **Never hardcode colors.** Use `theme.colors.*` and `withAlpha(...)` only; verify against `midnight`.
- **Responsive everywhere.** Every touched screen/component must use `useResponsive()` values, not raw px.
- **Derived categories stay derived in this slice.** No `categories` table, no CMS icon picker, no taxonomy migration.
- **FR explore strings stay in the existing ASCII convention** used by `src/i18n/locales/fr/explore.ts`.

## Scope Guard

This slice includes:

- centralizing category icon/presentation rules so `Explorer` and category detail stop relying on an inline heuristic map
- wiring trend chips so they are real interactions, not dead decorative tags
- realigning the Explore shell to the mockup for icon sizing, section-title sizing, category/module card typography, and trend-chip affordances
- polishing the category detail route (`app/category/[name].tsx`) so the top bar/back affordance matches the rest of the app shell and uses a dedicated category query instead of client-side filtering from the whole feed
- adding focused tests for category presentation, Explore behavior, and category detail

This slice does **not** include:

- a `categories` table or CMS authoring for category icons/order/descriptions
- collections/agenda/community redesigns beyond keeping their cards visible in Explore
- the paywall, premium gating changes, Library/Profile/UI cards, or image-overlay work
- a new search provider or ranking system
- changes to bookmark/offline/list capability logic

---

## File Structure

- `src/features/categories/category-presentation.ts` — new pure taxonomy presentation helper (normalized key + stable icon).
- `__tests__/category-presentation.test.ts` — Jest coverage for the helper.
- `convex/schema.ts` — add the category index used by the new dedicated category query.
- `convex/content/queries.ts` — add `listPublishedByCategory`.
- `convex/content/queries.test.ts` — Vitest coverage for the new query.
- `app/category/[name].tsx` — switch to the dedicated query, adopt the centered top-bar/back-button pattern, and use `explore` i18n copy for loading/empty/back label.
- `__tests__/category-screen.test.tsx` — new category route test.
- `app/(app)/explore.tsx` — import the category-presentation helper, make trends tappable, use derived count copy, and realign the shell/card sizing to the mockup.
- `src/i18n/locales/en/explore.ts` / `src/i18n/locales/fr/explore.ts` — add category-detail and category-count strings needed by the new UI.
- `__tests__/explore-screen.test.tsx` — expand to cover derived categories and trend-chip behavior.

---

### Task 1: Centralize category presentation rules

**Files:**
- Create: `src/features/categories/category-presentation.ts`
- Test: `__tests__/category-presentation.test.ts`
- Modify: `app/(app)/explore.tsx`

- [ ] **Step 1: Write the failing pure test for category presentation**

Create `__tests__/category-presentation.test.ts` with:

```ts
import { getCategoryPresentation, normalizeCategoryKey } from "../src/features/categories/category-presentation";

describe("category presentation", () => {
  it("normalizes labels into stable lowercase keys", () => {
    expect(normalizeCategoryKey("Analyses")).toBe("analyses");
    expect(normalizeCategoryKey("Debat video")).toBe("debat-video");
    expect(normalizeCategoryKey("The Youth Response")).toBe("the-youth-response");
  });

  it("returns stable icons for known editorial families", () => {
    expect(getCategoryPresentation("Analyses")).toEqual(
      expect.objectContaining({ normalizedKey: "analyses", icon: "✎" }),
    );
    expect(getCategoryPresentation("Podcast")).toEqual(
      expect.objectContaining({ normalizedKey: "podcasts", icon: "▷" }),
    );
    expect(getCategoryPresentation("Videos")).toEqual(
      expect.objectContaining({ normalizedKey: "videos", icon: "▶" }),
    );
  });

  it("falls back to the default glyph for unknown categories", () => {
    expect(getCategoryPresentation("The Youth Response")).toEqual(
      expect.objectContaining({ normalizedKey: "the-youth-response", icon: "◉" }),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/category-presentation.test.ts`

Expected: FAIL with `Cannot find module '../src/features/categories/category-presentation'`.

- [ ] **Step 3: Implement the helper and swap `Explorer` to use it**

Create `src/features/categories/category-presentation.ts` with a pure normalized-key helper and a stable icon registry:

```ts
const PRESENTATION_RULES = [
  { normalizedKey: "analyses", matches: ["analyse", "analysis"], icon: "✎" },
  { normalizedKey: "podcasts", matches: ["podcast", "episode", "audio"], icon: "▷" },
  { normalizedKey: "videos", matches: ["video", "debat", "debate"], icon: "▶" },
  { normalizedKey: "agenda", matches: ["agenda", "event"], icon: "☷" },
  { normalizedKey: "collections", matches: ["collection", "serie", "series"], icon: "◆" },
  { normalizedKey: "community", matches: ["community", "communaute", "discord"], icon: "✦" },
];

export function normalizeCategoryKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryPresentation(label: string): {
  normalizedKey: string;
  icon: string;
} {
  const normalized = normalizeCategoryKey(label);
  const rule = PRESENTATION_RULES.find((entry) =>
    entry.matches.some((match) => normalized.includes(match)),
  );

  return {
    normalizedKey: rule?.normalizedKey ?? normalized,
    icon: rule?.icon ?? "◉",
  };
}
```

Then update `app/(app)/explore.tsx`:

- delete the local `CATEGORY_ICON_MAP` + `getCategoryIcon`
- import `getCategoryPresentation`
- for category cards use `getCategoryPresentation(cat.category).icon`

Do **not** change card layout yet; keep this task limited to centralizing the taxonomy-presenter seam.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --runInBand __tests__/category-presentation.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "src/features/categories/category-presentation.ts" "__tests__/category-presentation.test.ts" "app/(app)/explore.tsx"
git commit -m "refactor(explore): centralize category presentation rules"
```

---

### Task 2: Add an indexed category-detail query and realign the category route

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/content/queries.ts`
- Create: `convex/content/queries.test.ts`
- Modify: `app/category/[name].tsx`
- Create: `__tests__/category-screen.test.tsx`
- Modify: `src/i18n/locales/en/explore.ts`
- Modify: `src/i18n/locales/fr/explore.ts`

- [ ] **Step 1: Write the failing Convex test for `listPublishedByCategory`**

Create `convex/content/queries.test.ts` with:

```ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../../convexTestModules";

describe("listPublishedByCategory", () => {
  it("returns only published docs for the requested tenant and exact category", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "article",
        status: "published",
        slug: "care-economy",
        title: "Care economy",
        summary: "Published analyses row",
        category: "Analyses",
        tags: ["care"],
        isPremium: false,
      });
      await ctx.db.insert("contents", {
        tenantSlug: "demo-media",
        kind: "episode",
        status: "draft",
        slug: "draft-analysis",
        title: "Draft analysis",
        summary: "Should stay hidden",
        category: "Analyses",
        tags: [],
        isPremium: false,
      });
      await ctx.db.insert("contents", {
        tenantSlug: "other-tenant",
        kind: "article",
        status: "published",
        slug: "other-tenant-analysis",
        title: "Other tenant",
        summary: "Wrong tenant",
        category: "Analyses",
        tags: [],
        isPremium: false,
      });
    });

    const result = await t.query(api.content.queries.listPublishedByCategory, {
      tenantSlug: "demo-media",
      category: "Analyses",
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Care economy");
  });
});
```

- [ ] **Step 2: Run the Convex test to verify it fails**

Run: `npm run test:convex -- convex/content/queries.test.ts`

Expected: FAIL because `listPublishedByCategory` and/or the category index do not exist yet.

- [ ] **Step 3: Add the category index and query**

In `convex/schema.ts`, add the missing index on `contents`:

```ts
.index("by_tenant_and_status_and_category", ["tenantSlug", "status", "category"])
```

Keep the existing indexes and search index exactly as they are.

In `convex/content/queries.ts`, add:

```ts
export const listPublishedByCategory = query({
  args: { tenantSlug: v.string(), category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contents")
      .withIndex("by_tenant_and_status_and_category", (q) =>
        q
          .eq("tenantSlug", args.tenantSlug)
          .eq("status", "published")
          .eq("category", args.category),
      )
      .take(50);
  },
});
```

Then regenerate Convex codegen/types:

Run: `npx convex dev --once`

Expected: `Convex functions ready` (or the local equivalent success output) with regenerated `_generated` files.

- [ ] **Step 4: Write the failing screen test for the category route**

Create `__tests__/category-screen.test.tsx` with:

```tsx
import { fireEvent, render, screen } from "@testing-library/react-native";

import CategoryScreen from "../app/category/[name]";

const mockBack = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ name: "Analyses" }),
  useRouter: () => ({ back: mockBack }),
}));

describe("category screen", () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockUseQuery.mockReset();
  });

  it("renders the category title and returned content rows", () => {
    mockUseQuery.mockReturnValue([
      {
        _id: "content1",
        kind: "article",
        title: "Care economy",
        summary: "Summary",
        category: "Analyses",
        status: "published",
        slug: "care-economy",
        tags: [],
        isPremium: false,
      },
    ]);

    render(<CategoryScreen />);

    expect(screen.getByText("Analyses")).toBeTruthy();
    expect(screen.getByText("Care economy")).toBeTruthy();
  });

  it("goes back to Explore when the back button is pressed", () => {
    mockUseQuery.mockReturnValue([]);
    render(<CategoryScreen />);

    fireEvent.press(screen.getByLabelText("Back to Explore"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 5: Run the screen test to verify it fails**

Run: `npm test -- --runInBand __tests__/category-screen.test.tsx`

Expected: FAIL because the route still uses the old query path and has no accessible back label / new empty-loading copy.

- [ ] **Step 6: Recompose `app/category/[name].tsx` around the dedicated query**

Update the route as follows:

- add `useTranslation("explore")`
- replace `listPublishedFeed` + client-side filtering with `api.content.queries.listPublishedByCategory`
- reuse the centered top-bar pattern already present elsewhere in the app:

```tsx
<Pressable
  onPress={() => router.back()}
  style={styles.topBarAction}
  accessibilityRole="button"
  accessibilityLabel={t("category.backToExplore")}
>
  <Text
    style={[
      styles.topBarActionGlyph,
      { color: theme.colors.heading, fontSize: 24 * scaleFont },
    ]}
  >
    ‹
  </Text>
</Pressable>
```

- keep the centered title in the middle 34pt side-box layout
- swap the hardcoded French loading/empty strings for `t("category.loading")` and `t("category.empty")`
- keep colors tokenized and the tablet content cap intact

Also update the route styles to match the shared top-bar vocabulary:

```ts
topBarAction: {
  width: 34,
  height: 34,
  alignItems: "center",
  justifyContent: "center",
},
topBarActionGlyph: {
  fontFamily: fontFamilies.body,
  lineHeight: 28,
},
```

- [ ] **Step 7: Add the new explore i18n keys**

In `src/i18n/locales/en/explore.ts`, add:

```ts
category: {
  backToExplore: "Back to Explore",
  loading: "Loading category…",
  empty: "No published content in this category.",
},
categoryCount_one: "{{count}} content",
categoryCount_other: "{{count}} contents",
trendA11y: "Search for {{label}}",
```

In `src/i18n/locales/fr/explore.ts`, add the ASCII equivalents:

```ts
category: {
  backToExplore: "Retour vers Explorer",
  loading: "Chargement de la categorie…",
  empty: "Aucun contenu publie dans cette categorie.",
},
categoryCount_one: "{{count}} contenu",
categoryCount_other: "{{count}} contenus",
trendA11y: "Chercher {{label}}",
```

- [ ] **Step 8: Run the targeted tests and confirm they pass**

Run:

```bash
npm run test:convex -- convex/content/queries.test.ts
npm test -- --runInBand __tests__/category-screen.test.tsx
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add convex/schema.ts convex/content/queries.ts convex/content/queries.test.ts "app/category/[name].tsx" "__tests__/category-screen.test.tsx" src/i18n/locales/en/explore.ts src/i18n/locales/fr/explore.ts convex/_generated
git commit -m "feat(explore): add indexed category detail query and route polish"
```

---

### Task 3: Realign the Explore shell to the mockup and make trend chips functional

**Files:**
- Modify: `app/(app)/explore.tsx`
- Modify: `__tests__/explore-screen.test.tsx`
- Modify: `src/i18n/locales/en/explore.ts`
- Modify: `src/i18n/locales/fr/explore.ts`

- [ ] **Step 1: Expand the Explore screen test before changing the UI**

Replace the `useSearch` mock with a callable spy and add derived-category data:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

const mockUseSearch = jest.fn((query: string) => ({ results: [], isSearching: false }));
const mockUseCategories = jest.fn(() => ({
  categories: [
    { category: "Analyses", count: 12 },
    { category: "Podcasts", count: 7 },
    { category: "The Youth Response", count: 3 },
  ],
  isLoading: false,
}));

jest.mock("../src/features/search/use-search", () => ({
  useSearch: (query: string) => mockUseSearch(query),
}));

jest.mock("../src/features/categories/use-categories", () => ({
  useCategories: () => mockUseCategories(),
}));

it("renders derived category cards with stable counts", () => {
  render(<ExploreScreen />);

  expect(screen.getByText("Analyses")).toBeTruthy();
  expect(screen.getByText("12 CONTENTS")).toBeTruthy();
  expect(screen.getByText("The Youth Response")).toBeTruthy();
});

it("prefills search when a trend chip is pressed", async () => {
  render(<ExploreScreen />);

  fireEvent.press(screen.getByText("Care economy"));

  await waitFor(() =>
    expect(mockUseSearch).toHaveBeenLastCalledWith("Care economy"),
  );
});
```

Keep the existing shell assertions (`Explore`, placeholder, `Modules`, etc.) in the same file.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/explore-screen.test.tsx`

Expected: FAIL because the screen still renders passive trend chips and does not yet emit the new count copy.

- [ ] **Step 3: Realign `app/(app)/explore.tsx`**

Make the following concrete changes:

1. Use the helper from Task 1 for every derived category card:

```tsx
const presentation = getCategoryPresentation(cat.category);

<FeatureCard
  icon={presentation.icon}
  meta={t("categoryCount_other", { count: cat.count }).toUpperCase()}
  title={cat.category}
/>
```

2. Make trends real `Pressable`s that prefill the search:

```tsx
<Pressable
  key={key}
  onPress={() => {
    setSearchFilter("all");
    setSearchQuery(t(`trends.${key}`));
  }}
  accessibilityRole="button"
  accessibilityLabel={t("trendA11y", { label: t(`trends.${key}`) })}
  style={[
    styles.trendChip,
    {
      borderRadius: theme.radii.pill,
      borderColor: withAlpha(theme.colors.heading, theme.isDark ? 0.24 : 0.12),
      backgroundColor: "transparent",
    },
  ]}
>
  <Text
    style={[
      styles.trendLabel,
      { color: theme.colors.heading, fontSize: 12 * scaleFont },
    ]}
  >
    {t(`trends.${key}`)}
  </Text>
</Pressable>
```

3. Pull the visible sizing closer to the mockup CSS:

- section title: `17 * scaleFont` instead of `19`
- category/module card title: `13 * scaleFont`
- card meta: `9 * scaleFont`, mono uppercase, `lineHeight: 12 * scaleFont`
- icon badge glyph: `16 * scaleFont`
- search icon keeps the larger RN-friendly glyph size (`19 * scaleFont`) but widen its box to `22 * scaleSpace` and center it so it no longer looks cramped

Concretely, update these style/value points in `explore.tsx`:

```ts
searchIcon: {
  width: 22,
  textAlign: "center",
  lineHeight: 22,
},
sectionTitle: {
  fontFamily: fontFamilies.display,
  letterSpacing: -0.25,
},
cardTitle: {
  fontFamily: fontFamilies.display,
  letterSpacing: -0.15,
},
cardMeta: {
  fontFamily: fontFamilies.mono,
  letterSpacing: 0.8,
  textTransform: "uppercase",
},
iconBadgeLabel: {
  fontFamily: fontFamilies.mono,
  textAlign: "center",
},
```

Then apply the new numeric sizes at render time:

```tsx
fontSize: 17 * scaleFont        // section title
fontSize: 13 * scaleFont        // card title
fontSize: 9 * scaleFont         // card meta
fontSize: 16 * scaleFont        // icon glyph
```

4. Add `numberOfLines={1}` to `FeatureCard` titles so long labels do not wrap awkwardly.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --runInBand __tests__/explore-screen.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/explore.tsx" "__tests__/explore-screen.test.tsx" src/i18n/locales/en/explore.ts src/i18n/locales/fr/explore.ts
git commit -m "feat(explore): realign explorer cards and trends to the mockup"
```

---

### Task 4: Verify the whole slice

**Files:**
- Test only

- [ ] **Step 1: Run the slice-focused automated checks**

Run:

```bash
npm run test:convex -- convex/content/queries.test.ts
npm test -- --runInBand __tests__/category-presentation.test.ts __tests__/category-screen.test.tsx __tests__/explore-screen.test.tsx __tests__/explore-modules.test.tsx
npx tsc --noEmit
```

Expected: PASS on all three commands.

- [ ] **Step 2: Hardcoded-color scan**

Run:

```bash
rg -n "#|rgba\\(" app/(app)/explore.tsx app/category/[name].tsx src/features/categories/category-presentation.ts
```

Expected: no theme-color literals added by this slice. If the search returns only pre-existing harmless literals outside the touched blocks, stop and inspect before continuing.

- [ ] **Step 3: Visual smoke on phone + iPad**

Follow `docs/agents/ui-visual-testing.md` and verify:

- `/explore`: search bar loupe reads clearly; section titles match the mockup scale more closely; category/module card copy does not feel undersized; trend chips are visibly tappable
- `/category/<name>`: back button feels the same size family as the rest of the app shell; title stays centered; empty/loading states use the right copy
- iPad width: content caps and stays centered; cards do not stretch awkwardly
- `midnight`: no contrast regressions on search/card/trend surfaces

- [ ] **Step 4: Final worktree check**

Run: `git status --short`

Expected: clean except for unrelated pre-existing files already in the worktree before this slice.

---

## Self-Review

- Spec coverage: this implements the first **product** slice of the supervision bundle — `Explorer + taxonomie` — while still obeying the control slices (`Cadre`, `Verification`).
- Scope discipline: no category CMS, no module-system redesign, no Library/Profile/offline work, no image-overlay/card work.
- Architecture honesty: categories stay derived; the new helper is a seam for future icon configurability without pretending the CMS is done.
- Performance/Convex discipline: category detail stops loading the full feed route-wide and instead uses an indexed tenant+status+category query.
- UX outcome: the dead trend chips become real affordances, and the Explore shell moves closer to the mockup without a large redesign.

## Next Slice After This One

Recommended next plan in this supervision cycle: **Slice 2 — Bibliotheque + capacites**, because it clusters the remaining `saved / offline / personal lists / member CTA` semantics that should be reviewed together before touching `Profil`.
