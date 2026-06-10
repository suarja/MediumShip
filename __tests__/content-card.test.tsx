import { render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";

import { ContentCard } from "../src/components/content/content-card";
import { changeAppLanguage, initI18n } from "../src/i18n";
import type { ContentCardModel } from "../src/features/content/types";

const mockUseAppTheme = jest.fn();

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  usePathname: () => "/",
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
}));

const SAMPLE_ITEM: ContentCardModel = {
  id: "article-1",
  kind: "article",
  kindLabel: "Article",
  category: "Analyse",
  title: "Economie du soin",
  summary: "Une analyse approfondie",
  metaLabel: "18 min",
  readingTimeMinutes: 18,
  href: "/article/article-1",
  isPremium: false,
  coverImageUrl: "https://example.com/cover.jpg",
};

function makeTheme() {
  return {
    enabledModules: ["articles", "bookmarks"],
    theme: {
      colors: {
        heading: "#14110E",
        text: "#14110E",
        textMuted: "#6B6560",
        border: "#E8E4DC",
        surface: "#F4F1E8",
        accent: "#C45A2A",
        accentContrast: "#FFF8F0",
        accentSoft: "#F5E6DC",
        premium: "#C9A227",
        canvas: "#FAF7F0",
        canvasAccent: "#E8E4DC",
      },
      spacing: { lg: 16, md: 12, sm: 8, xs: 4, xl: 24 },
      radii: { pill: 99, md: 8, sm: 4, lg: 12, xl: 16 },
      isDark: false,
    },
  };
}

describe("ContentCard", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    mockUseAppTheme.mockReturnValue(makeTheme());
    await changeAppLanguage("fr");
  });

  it('variant="compact" renders the editorial feed row layout', () => {
    render(
      <ContentCard
        variant="compact"
        item={SAMPLE_ITEM}
        kicker="Analyse"
        meta="18 min"
      />,
    );

    expect(screen.getByTestId("content-card-compact")).toBeTruthy();
    expect(screen.getByText("Economie du soin")).toBeTruthy();
    expect(screen.getByText("18 min")).toBeTruthy();
    expect(screen.queryByTestId("content-card-feature")).toBeNull();
  });

  it('variant="feature" renders a compact row with up to four summary lines', () => {
    render(
      <ContentCard
        variant="feature"
        item={SAMPLE_ITEM}
        kicker="Analyse"
        meta="18 min"
        actions={<View testID="stub-actions" />}
      />,
    );

    expect(screen.getByTestId("content-card-feature")).toBeTruthy();
    expect(screen.getByText("Economie du soin")).toBeTruthy();
    expect(screen.getByText("Une analyse approfondie")).toBeTruthy();
    expect(screen.getByText("Une analyse approfondie").props.numberOfLines).toBe(4);
    expect(screen.getByTestId("content-card-title-category")).toHaveTextContent("Analyse");
    expect(screen.getByTestId("content-card-actions")).toBeTruthy();
    expect(screen.queryByTestId("content-card-compact")).toBeNull();
  });

  it("renders an explicit premium label on premium items", () => {
    render(
      <ContentCard
        variant="feature"
        item={{ ...SAMPLE_ITEM, isPremium: true }}
        kicker="Analyse"
        meta="18 min"
      />,
    );

    expect(screen.getByTestId("content-card-premium-badge")).toHaveTextContent(
      /★\s*Premium/i,
    );
  });

  it("renders action slots only when provided", () => {
    const { rerender } = render(
      <ContentCard
        variant="feature"
        item={SAMPLE_ITEM}
        kicker="Analyse"
        meta="18 min"
      />,
    );

    expect(screen.queryByTestId("content-card-actions")).toBeNull();

    rerender(
      <ContentCard
        variant="feature"
        item={SAMPLE_ITEM}
        kicker="Analyse"
        meta="18 min"
        actions={
          <View testID="custom-actions">
            <Text>Like</Text>
          </View>
        }
      />,
    );

    expect(screen.getByTestId("content-card-actions")).toBeTruthy();
    expect(screen.getByText("Like")).toBeTruthy();
  });
});
