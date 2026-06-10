import { fireEvent, render, screen } from "@testing-library/react-native";

import { ProfileAnalysisCard } from "../src/components/insights/profile-analysis-card";
import { initI18n } from "../src/i18n";

const mockOpenPaywall = jest.fn();
const mockOnOpen = jest.fn();
const mockOnHistory = jest.fn();

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall }),
}));

jest.mock("../src/features/tenant/use-feature-access", () => ({
  useFeatureAccess: () => ({
    requiresPremium: false,
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
        canvas: isDark ? "#0F0D0B" : "#FAF7F0",
      },
      spacing: { lg: 16, md: 12, sm: 8, xs: 4, xl: 24 },
      radii: { pill: 99, md: 8, sm: 4, lg: 12, xl: 16 },
      isDark,
    },
  };
}

describe("ProfileAnalysisCard", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    mockOpenPaywall.mockReset();
    mockOnOpen.mockReset();
    mockOnHistory.mockReset();
    mockUseAppTheme.mockReturnValue(makeTheme());
  });

  it("renders ready state with CTA", () => {
    render(
      <ProfileAnalysisCard
        state="ready"
        previewText="Votre profil aime la politique."
        onOpen={mockOnOpen}
        onOpenHistory={mockOnHistory}
      />,
    );

    fireEvent.press(screen.getByTestId("profile-analysis-open"));
    expect(mockOnOpen).toHaveBeenCalled();
  });

  it("opens paywall when locked", () => {
    render(<ProfileAnalysisCard state="locked" />);
    fireEvent.press(screen.getByTestId("profile-analysis-paywall"));
    expect(mockOpenPaywall).toHaveBeenCalledWith("content");
  });

  it("renders midnight palette without crash", () => {
    mockUseAppTheme.mockReturnValue(makeTheme(true));
    render(<ProfileAnalysisCard state="empty" />);
    expect(screen.getByTestId("profile-analysis-card")).toBeTruthy();
  });
});
