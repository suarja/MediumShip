import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";

import { ContentActionsBar } from "../src/components/content/content-actions-bar";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({ isSignedIn: true }),
}));

jest.mock("../src/features/bookmarks/use-bookmarks", () => ({
  useBookmarks: () => ({
    bookmarks: [],
    isMember: false,
    isMembershipLoading: false,
    isBookmarksLoading: false,
    toggleBookmark: jest.fn(),
  }),
}));

jest.mock("../src/features/downloads/use-downloads", () => ({
  useDownloads: () => ({
    downloadedItem: null,
    isLoading: false,
    isDownloading: false,
    downloadContent: jest.fn(),
  }),
}));

jest.mock("convex/react", () => ({
  useQuery: () => [],
}));

describe("content bookmark actions", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("keeps the bookmark action available for a signed-in standard account", () => {
    render(
      <ContentActionsBar
        content={{
          _id: "article_1",
          tenantSlug: "demo-media",
          kind: "article",
          status: "published",
          title: "The care economy",
          summary: "Summary",
          category: "Analysis",
          tags: [],
          isPremium: false,
        }}
      />,
    );

    // Compact bar: Keep (free for any signed-in account) + Offline (opens the
    // paywall for non-members). The standalone "Become a member" card is gone —
    // becoming a member now flows through the offline pill / paywall sheet.
    expect(screen.getByText("Keep")).toBeTruthy();
    expect(screen.getByText("Offline")).toBeTruthy();
    expect(screen.queryByText("Become a member")).toBeNull();
  });
});
