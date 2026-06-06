import { render, screen } from "@testing-library/react-native";

import { LibraryCollectionSection } from "../src/components/library/library-collection-section";
import { initI18n } from "../src/i18n";

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../src/features/responsive/use-responsive", () => ({
  useResponsive: () => ({
    isTablet: false,
    scaleFont: 1,
    scaleSpace: 1,
    contentMaxWidth: undefined,
  }),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    theme: {
      isDark: false,
      colors: {
        canvas: "#FAFAF8",
        surface: "#F4F1E8",
        surfaceMuted: "#E8E4DA",
        canvasAccent: "#EDE8DC",
        border: "#E0DDD5",
        heading: "#1A1A1A",
        textMuted: "#6B6460",
        accent: "#C04D2E",
        accentContrast: "#FAFAF8",
        premium: "#8B6914",
      },
      spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
      radii: { sm: 4, md: 8, lg: 12, xl: 18, pill: 999 },
    },
  }),
}));

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    LinearGradient: ({
      children,
      testID,
    }: {
      children?: React.ReactNode;
      testID?: string;
    }) => React.createElement(View, { testID }, children),
  };
});

const featuredItem = {
  id: "featured-1",
  href: "/article/featured-1",
  title: "Featured title",
  eyebrow: "Article",
  meta: "18 min read",
  imageUrl: "https://example.com/cover.jpg",
  iconName: "document-text-outline" as const,
  badgeLabel: "Saved",
};

describe("LibraryCollectionSection", () => {
  beforeAll(async () => {
    await initI18n();
  });

  it("renders featured copy in a body block below cover art, not on the overlay", () => {
    render(
      <LibraryCollectionSection
        title="Saved"
        subtitle="Subtitle copy"
        items={[featuredItem]}
        isLoading={false}
        loadingLabel="Loading"
        emptyTitle="Empty shelf"
        emptyBody="Nothing saved yet."
        emptyIconName="bookmark-outline"
      />,
    );

    expect(screen.getByText("Featured title")).toBeTruthy();
    expect(screen.getByText("18 min read")).toBeTruthy();
    expect(screen.queryByTestId("content-image-scrim")).toBeNull();
    expect(screen.queryByTestId("featuredGlow")).toBeNull();
  });

  it("does not render the internal section title when hideHeader is set", () => {
    render(
      <LibraryCollectionSection
        hideHeader
        title="Saved"
        subtitle="Subtitle copy"
        items={[]}
        isLoading={false}
        loadingLabel="Loading"
        emptyTitle="Empty shelf"
        emptyBody="Nothing saved yet."
        emptyIconName="bookmark-outline"
      />,
    );

    expect(screen.queryByText("Saved")).toBeNull();
    expect(screen.queryByText("Subtitle copy")).toBeNull();
    expect(screen.getByText("Empty shelf")).toBeTruthy();
  });
});
