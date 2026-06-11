import { render, screen } from "@testing-library/react-native";

import { PaywallSheet } from "../src/components/paywall/paywall-sheet";
import { initI18n } from "../src/i18n";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
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
    tenantName: "Mediumship",
    theme: {
      isDark: false,
      colors: {
        canvas: "#FAFAF8",
        surface: "#F4F1E8",
        border: "#E0DDD5",
        heading: "#1A1A1A",
        text: "#2C2C2C",
        textMuted: "#6B6460",
        accent: "#C04D2E",
        accentContrast: "#FAFAF8",
        premium: "#8B6914",
      },
      spacing: { xs: 4, sm: 8, md: 12, lg: 16 },
      radii: { sm: 4, md: 8, lg: 12, pill: 999, xl: 18 },
    },
  }),
}));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => ({ isMember: false, isLoading: false }),
}));

const mockUsePurchasePremium = jest.fn();

jest.mock("../src/features/billing/use-purchase-premium", () => ({
  usePurchasePremium: () => mockUsePurchasePremium(),
}));

const mockPackage = {
  identifier: "$rc_monthly",
  packageType: "MONTHLY",
  product: { priceString: "€2.00", identifier: "monthly" },
};

const basePurchaseState = {
  offering: null,
  packages: [mockPackage],
  package: mockPackage,
  selectPackage: jest.fn(),
  isLoadingOffering: false,
  offeringError: null,
  purchase: jest.fn(),
  restore: jest.fn(),
  reloadOffering: jest.fn(),
  resetStatus: jest.fn(),
  purchasesSupported: true,
  status: "idle" as const,
  errorMessage: null,
};

describe("PaywallSheet purchase states", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    mockUsePurchasePremium.mockReturnValue(basePurchaseState);
  });

  it("shows cancelled message", () => {
    mockUsePurchasePremium.mockReturnValue({
      ...basePurchaseState,
      status: "cancelled",
    });

    render(
      <PaywallSheet visible reason="support" isSignedIn onDismiss={jest.fn()} />,
    );

    expect(screen.getAllByText(/Purchase cancelled/i).length).toBeGreaterThan(0);
  });

  it("shows error message", () => {
    mockUsePurchasePremium.mockReturnValue({
      ...basePurchaseState,
      status: "error",
      errorMessage: "Network error",
    });

    render(
      <PaywallSheet visible reason="support" isSignedIn onDismiss={jest.fn()} />,
    );

    expect(screen.getAllByText(/Network error/i).length).toBeGreaterThan(0);
  });

  it("shows already subscribed from purchase status", () => {
    mockUsePurchasePremium.mockReturnValue({
      ...basePurchaseState,
      status: "already",
    });

    render(
      <PaywallSheet visible reason="support" isSignedIn onDismiss={jest.fn()} />,
    );

    expect(screen.getAllByText(/already have an active Premium/i).length).toBeGreaterThan(0);
  });
});
