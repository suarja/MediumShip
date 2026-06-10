import { fireEvent, render, screen } from "@testing-library/react-native";

import { AnalysisView } from "../src/components/insights/analysis-view";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockOpenPaywall = jest.fn();
const mockPush = jest.fn();

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall }),
}));

jest.mock("../src/features/navigation/app-navigation", () => ({
  usePushWithReturn: () => mockPush,
}));

jest.mock("../src/features/tenant/use-feature-access", () => ({
  useFeatureAccess: () => ({
    requiresPremium: false,
    canAccess: true,
    enabled: true,
    isLoading: false,
  }),
}));

const mockUseAppTheme = jest.fn();

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

function makeTheme(isDark = false) {
  return {
    theme: {
      colors: {
        heading: isDark ? "#F4F1E8" : "#14110E",
        text: isDark ? "#E8E4DC" : "#14110E",
        textMuted: isDark ? "#9A948C" : "#6B6560",
        border: isDark ? "#2A2622" : "#E8E4DC",
        surface: isDark ? "#1A1714" : "#F4F1E8",
        accent: "#C45A2A",
        accentContrast: "#FFF8F0",
        accentSoft: "#F5E6DC",
        premium: "#C9A227",
        premiumSoft: "#F5EDD4",
        videoAccent: "#4A7C59",
        videoAccentSoft: "#E2F0E6",
        canvas: isDark ? "#0F0D0B" : "#FAF7F0",
      },
      spacing: { lg: 16, md: 12, sm: 8, xs: 4, xl: 24 },
      radii: { pill: 99, md: 8, sm: 4, lg: 12, xl: 16 },
      isDark,
    },
  };
}

const SAMPLE = {
  tasteText: "Vous suivez la politique avec attention.",
  related: [
    {
      _id: "content_1" as never,
      kind: "article" as const,
      title: "Story A",
      summary: "Summary",
      category: "Politique",
    },
  ],
};

describe("AnalysisView", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    mockOpenPaywall.mockReset();
    mockPush.mockReset();
    mockUseAppTheme.mockReturnValue(makeTheme());
  });

  it("renders loading state", () => {
    render(<AnalysisView state="loading" />);
    expect(screen.getByTestId("analysis-view-loading")).toBeTruthy();
  });

  it("renders ready state with related tap", async () => {
    await changeAppLanguage("fr");
    render(<AnalysisView state="ready" analysis={SAMPLE} />);
    expect(screen.getByTestId("analysis-view-ready")).toBeTruthy();
    fireEvent.press(screen.getByTestId("analysis-related-content_1"));
    expect(mockPush).toHaveBeenCalledWith("/article/content_1");
  });

  it("opens paywall when locked", () => {
    jest
      .spyOn(
        require("../src/features/tenant/use-feature-access"),
        "useFeatureAccess",
      )
      .mockReturnValue({
        requiresPremium: true,
        canAccess: false,
        enabled: true,
        isLoading: false,
      });

    render(<AnalysisView state="locked" />);
    fireEvent.press(screen.getByTestId("analysis-view-paywall"));
    expect(mockOpenPaywall).toHaveBeenCalledWith("content");
  });
});
