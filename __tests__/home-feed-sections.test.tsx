import { render, screen } from "@testing-library/react-native";

import HomeFeedScreen from "../app/(app)/home";
import { resolveEffectiveFeatureConfigs } from "../convex/featureCatalog";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockUseAppTheme = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

jest.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

jest.mock("../src/features/network/use-network-status", () => ({
  useNetworkStatus: () => ({ state: "online" }),
}));

jest.mock("../src/components/navigation/brand-header", () => ({
  BrandHeader: () => null,
}));

jest.mock("../src/components/content/status-banner-stack", () => ({
  StatusBannerStack: () => null,
}));

beforeAll(async () => {
  await initI18n();
});

const SAMPLE_CONTENT = [
  {
    _id: "a1",
    tenantSlug: "demo-media",
    kind: "article",
    status: "published",
    slug: "story",
    title: "Story one",
    summary: "Summary",
    category: "News",
    tags: [],
    isPremium: false,
    publishedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    _id: "v1",
    tenantSlug: "demo-media",
    kind: "video",
    status: "published",
    slug: "clip",
    title: "Clip one",
    summary: "Summary",
    category: "Video",
    tags: [],
    isPremium: false,
    publishedAt: "2026-06-02T08:00:00.000Z",
  },
] as const;

function makeTheme(feedSections: Array<{ kind: "article" | "video"; title: string; visible?: boolean }>) {
  const featureConfigs = resolveEffectiveFeatureConfigs({
    enabledModules: ["articles", "videos"],
  });

  return {
    tenantSlug: "demo-media",
    enabledModules: ["articles", "videos"],
    featureConfigs,
    feedSections,
    theme: {
      colors: {
        heading: "#111",
        text: "#111",
        textMuted: "#666",
        border: "#ddd",
        surface: "#fff",
        accent: "#00f",
        accentContrast: "#fff",
        canvas: "#fff",
      },
      spacing: { lg: 16, md: 12, sm: 8, xs: 4, xl: 24 },
      radii: { pill: 99, md: 8, sm: 4, lg: 12, xl: 16 },
      isDark: false,
    },
  };
}

describe("home feed sections", () => {
  beforeEach(async () => {
    mockUseQuery.mockReturnValue(SAMPLE_CONTENT);
    await changeAppLanguage("fr");
  });

  it("renders localized default section titles and skips hidden sections", () => {
    mockUseAppTheme.mockReturnValue(
      makeTheme([
        { kind: "video", title: "Watch now", visible: true },
        { kind: "article", title: "Latest analyses", visible: false },
      ]),
    );

    render(<HomeFeedScreen />);

    expect(screen.getAllByText("Vidéos").length).toBeGreaterThan(0);
    expect(screen.queryByText("Watch now")).toBeNull();
    expect(screen.queryByText("Latest analyses")).toBeNull();
    expect(screen.getByText("Clip one")).toBeTruthy();
    expect(screen.queryByText("Story one")).toBeNull();
  });

  it("keeps custom CMS section titles untouched", () => {
    mockUseAppTheme.mockReturnValue(
      makeTheme([{ kind: "video", title: "Sélection vidéo", visible: true }]),
    );

    render(<HomeFeedScreen />);

    expect(screen.getAllByText("Sélection vidéo").length).toBeGreaterThan(0);
  });

  it("adds breathing room between the hero card and the stacked rows", () => {
    mockUseQuery.mockReturnValue([
      ...SAMPLE_CONTENT,
      {
        ...SAMPLE_CONTENT[0],
        _id: "a2",
        title: "Story two",
        publishedAt: "2026-05-31T08:00:00.000Z",
      },
    ]);
    mockUseAppTheme.mockReturnValue(
      makeTheme([{ kind: "article", title: "Latest stories", visible: true }]),
    );

    render(<HomeFeedScreen />);

    const rows = screen.getAllByTestId("feed-section-rows");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].props.style).toEqual(
      expect.objectContaining({ marginTop: 12 }),
    );
  });
});
