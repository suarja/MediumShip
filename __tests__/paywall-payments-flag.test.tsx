import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { PaywallSheet } from "../src/components/paywall/paywall-sheet";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockPurchase = jest.fn();
const mockActivateFreePremium = jest.fn();

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
        accentSoft: "#FAE8E3",
        premium: "#8B6914",
        premiumSoft: "#FDF3D9",
      },
      spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
      radii: { sm: 4, md: 8, lg: 12, xl: 18, pill: 999 },
    },
  }),
}));

jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => ({ isMember: false, isLoading: false }),
}));

jest.mock("../src/features/billing/use-purchase-premium", () => ({
  usePurchasePremium: () => ({
    offering: { identifier: "default" },
    packages: [],
    package: null,
    selectPackage: jest.fn(),
    isLoadingOffering: false,
    offeringError: null,
    purchase: mockPurchase,
    restore: jest.fn(),
    reloadOffering: jest.fn(),
    status: "idle",
    errorMessage: null,
    resetStatus: jest.fn(),
    purchasesSupported: true,
  }),
}));

jest.mock("../src/features/billing/use-start-free-premium", () => ({
  useStartFreePremium: () => ({
    activate: mockActivateFreePremium,
    isPending: false,
    status: "idle",
    resetStatus: jest.fn(),
  }),
}));

jest.mock("../src/features/tenant/feature-access", () => ({
  PAYMENTS_ENABLED: false,
  PREMIUM_PAYMENT_DEFERRED: false,
  canAccessFeatureLevel: jest.fn(),
  isFeatureNavVisible: jest.fn(),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe("PaywallSheet PAYMENTS_ENABLED flag", () => {
  const dismissMock = jest.fn();

  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    dismissMock.mockClear();
    mockPurchase.mockClear();
    mockActivateFreePremium.mockClear();
    await changeAppLanguage("en");
  });

  it("shows free premium CTA without prices when payments are disabled", () => {
    render(
      <PaywallSheet visible reason="support" isSignedIn onDismiss={dismissMock} />,
    );

    expect(screen.getByTestId("paywall-free-premium-cta")).toBeTruthy();
    expect(screen.getAllByText(/Try Premium for free/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/No commitment/i)).toBeTruthy();
    expect(screen.queryByTestId("paywall-purchase-cta")).toBeNull();
    expect(screen.queryByTestId("paywall-restore-cta")).toBeNull();
    expect(screen.queryByText(/€/)).toBeNull();
  });

  it("calls free premium activation when the CTA is pressed", async () => {
    render(
      <PaywallSheet visible reason="support" isSignedIn onDismiss={dismissMock} />,
    );

    fireEvent.press(screen.getByTestId("paywall-free-premium-cta"));
    await waitFor(() => expect(mockActivateFreePremium).toHaveBeenCalledTimes(1));
    expect(mockPurchase).not.toHaveBeenCalled();
  });
});
