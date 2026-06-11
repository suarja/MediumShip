import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { FeedRow } from "../src/components/content/feed-row";
import { PaywallSheet } from "../src/components/paywall/paywall-sheet";
import { HapticsService } from "../src/features/haptics/haptics";
import { changeAppLanguage, initI18n } from "../src/i18n";
import type { ContentCardModel } from "../src/features/content/types";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

jest.mock("../src/features/tenant/feature-access", () => ({
  PAYMENTS_ENABLED: true,
  PREMIUM_PAYMENT_DEFERRED: false,
  canAccessFeatureLevel: jest.requireActual("../src/features/tenant/feature-access")
    .canAccessFeatureLevel,
  isFeatureNavVisible: jest.requireActual("../src/features/tenant/feature-access")
    .isFeatureNavVisible,
}));

jest.mock("../src/features/billing/use-start-free-premium", () => ({
  useStartFreePremium: () => ({
    activate: jest.fn(),
    isPending: false,
    status: "idle",
    resetStatus: jest.fn(),
  }),
}));

jest.mock("../src/features/haptics/haptics", () => ({
  HapticsService: {
    selection: jest.fn(),
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/",
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
}));

// PaywallSheet pulls RevenueCat state via this hook (useAction); stub it so the
// sheet mounts without a ConvexProvider in this unit test.
jest.mock("../src/features/billing/use-purchase-premium", () => ({
  usePurchasePremium: () => ({
    offering: null,
    packages: [],
    package: null,
    selectPackage: jest.fn(),
    isLoadingOffering: false,
    offeringError: null,
    purchase: jest.fn(),
    restore: jest.fn(),
    reloadOffering: jest.fn(),
    status: "idle",
    errorMessage: null,
    resetStatus: jest.fn(),
    purchasesSupported: true,
  }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({ isSignedIn: true }),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    enabledModules: ["articles", "bookmarks"],
    tenantName: "Knowly",
    theme: {
      colors: {
        heading: "#111",
        text: "#222",
        textMuted: "#666",
        border: "#ddd",
        surface: "#fff",
        accent: "#c04",
        accentSoft: "#fee",
        premium: "#c9a227",
        canvas: "#faf",
      },
      spacing: { sm: 8, md: 12 },
      radii: { sm: 4, pill: 99 },
      isDark: false,
    },
  }),
}));

jest.mock("../src/features/responsive/use-responsive", () => ({
  useResponsive: () => ({
    isTablet: false,
    scaleFont: 1,
    scaleSpace: 1,
    contentMaxWidth: undefined,
  }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const SAMPLE_CARD: ContentCardModel = {
  id: "article-1",
  kind: "article",
  kindLabel: "Article",
  category: "Analysis",
  title: "Economie du soin",
  summary: "Une analyse",
  metaLabel: "18 min",
  readingTimeMinutes: 18,
  href: "/article/article-1",
  isPremium: false,
};

describe("haptics on member actions and content primitives", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await changeAppLanguage("en");
  });

  it("fires light haptic when opening a feed row", () => {
    render(
      <FeedRow item={SAMPLE_CARD} kicker="Analysis" meta="18 min" divider={false} />,
    );

    fireEvent.press(screen.getByRole("link"));

    expect(HapticsService.light).toHaveBeenCalledTimes(1);
  });

  it("fires medium haptic on the paywall primary CTA", () => {
    const dismiss = jest.fn();

    render(
      <PaywallSheet
        visible
        reason="offline"
        isSignedIn={false}
        onDismiss={dismiss}
      />,
    );

    fireEvent.press(screen.getByText("Sign in to continue"));

    expect(HapticsService.medium).toHaveBeenCalledTimes(1);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
