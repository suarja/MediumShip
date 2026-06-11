import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";

import { PaywallSheet } from "../src/components/paywall/paywall-sheet";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockPurchase = jest.fn();
const mockRestore = jest.fn();

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

const mockUseIsMember = jest.fn(() => ({ isMember: false, isLoading: false }));
jest.mock("../src/features/membership/use-is-member", () => ({
  useIsMember: () => mockUseIsMember(),
}));

const mockPackage = {
  identifier: "$rc_monthly",
  packageType: "MONTHLY",
  product: { priceString: "€2.00", identifier: "monthly" },
};

jest.mock("../src/features/billing/use-purchase-premium", () => ({
  usePurchasePremium: () => ({
    offering: { identifier: "default" },
    packages: [mockPackage],
    package: mockPackage,
    selectPackage: jest.fn(),
    isLoadingOffering: false,
    offeringError: null,
    purchase: mockPurchase,
    restore: mockRestore,
    reloadOffering: jest.fn(),
    status: "idle",
    errorMessage: null,
    resetStatus: jest.fn(),
    purchasesSupported: true,
  }),
}));

jest.mock("expo-router", () => ({
  Link: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) =>
    children,
}));

describe("PaywallSheet", () => {
  const dismissMock = jest.fn();

  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    dismissMock.mockClear();
    mockPurchase.mockClear();
    mockRestore.mockClear();
    await changeAppLanguage("en");
  });

  it("renders offline title and benefits when visible", () => {
    render(
      <PaywallSheet
        visible
        reason="offline"
        isSignedIn={false}
        onDismiss={dismissMock}
      />,
    );
    expect(screen.getAllByText(/Offline download/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Unlimited offline downloads/i).length).toBeGreaterThan(0);
    // Sync benefit replaced — "daily read" perk now shown instead
    expect(screen.getAllByText(/Your daily read/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Playback progress synced/i)).toBeNull();
  });

  it("shows sign-in CTA for guest (not signed in)", () => {
    render(
      <PaywallSheet
        visible
        reason="support"
        isSignedIn={false}
        onDismiss={dismissMock}
      />,
    );
    expect(screen.getAllByText(/Sign in to continue/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/2-week free trial/i)).toBeNull();
  });

  it("shows purchase CTA and trial note for signed-in non-member", () => {
    render(
      <PaywallSheet
        visible
        reason="support"
        isSignedIn
        onDismiss={dismissMock}
      />,
    );
    expect(screen.getAllByText(/Become a member/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Monthly/i)).toBeTruthy();
    expect(screen.getAllByText(/€2\.00/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Restore purchases/i).length).toBeGreaterThan(0);
  });

  it("calls purchase when the primary CTA is pressed", async () => {
    render(
      <PaywallSheet
        visible
        reason="support"
        isSignedIn
        onDismiss={dismissMock}
      />,
    );

    fireEvent.press(screen.getByTestId("paywall-purchase-cta"));
    await waitFor(() => expect(mockPurchase).toHaveBeenCalledTimes(1));
  });

  it("calls restore when restore CTA is pressed", async () => {
    render(
      <PaywallSheet
        visible
        reason="support"
        isSignedIn
        onDismiss={dismissMock}
      />,
    );

    fireEvent.press(screen.getByTestId("paywall-restore-cta"));
    await waitFor(() => expect(mockRestore).toHaveBeenCalledTimes(1));
  });

  it("calls onDismiss when dismiss CTA is pressed", () => {
    render(
      <PaywallSheet
        visible
        reason="lists"
        isSignedIn={false}
        onDismiss={dismissMock}
      />,
    );
    expect(screen.getByText(/CONTINUE WITHOUT LISTS/i)).toBeTruthy();
    fireEvent.press(screen.getByTestId("paywall-dismiss-cta"));
    expect(dismissMock).toHaveBeenCalledTimes(1);
  });

  it("shows content preview title when provided", () => {
    render(
      <PaywallSheet
        visible
        reason="content"
        previewTitle="The care economy."
        isSignedIn={false}
        onDismiss={dismissMock}
      />,
    );
    expect(screen.getByText(/The care economy/i)).toBeTruthy();
  });

});

// Separate describe block with isPremium: true override
describe("PaywallSheet — already-premium state", () => {
  const dismissMock = jest.fn();

  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    dismissMock.mockClear();
    await changeAppLanguage("en");
  });

  // Override the useIsMember mock for this suite only
  beforeEach(() => {
    mockUseIsMember.mockReturnValue({ isMember: true, isLoading: false });
  });

  afterEach(() => {
    mockUseIsMember.mockReturnValue({ isMember: false, isLoading: false });
  });

  it("shows already-subscribed message and Access content CTA when isPremium", () => {
    render(
      <PaywallSheet
        visible
        reason="support"
        isSignedIn
        onDismiss={dismissMock}
      />,
    );
    expect(screen.getAllByText(/already have an active Premium/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId("paywall-already-premium-cta")).toBeTruthy();
    expect(screen.queryByTestId("paywall-purchase-cta")).toBeNull();
  });

  it("calls onDismiss when already-premium CTA is pressed", () => {
    render(
      <PaywallSheet
        visible
        reason="support"
        isSignedIn
        onDismiss={dismissMock}
      />,
    );
    fireEvent.press(screen.getByTestId("paywall-already-premium-cta"));
    expect(dismissMock).toHaveBeenCalledTimes(1);
  });

  it("does not show statusMessage when isPremium (no duplicate alreadySubscribed)", () => {
    render(
      <PaywallSheet
        visible
        reason="support"
        isSignedIn
        onDismiss={dismissMock}
      />,
    );
    // "alreadySubscribed" text appears exactly once (in the already-premium block), not twice
    const instances = screen.queryAllByText(/already have an active Premium/i);
    expect(instances.length).toBe(1);
  });
});
