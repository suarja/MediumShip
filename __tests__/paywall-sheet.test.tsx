import { render, screen, fireEvent } from "@testing-library/react-native";

import { PaywallSheet } from "../src/components/paywall/paywall-sheet";
import { changeAppLanguage, initI18n } from "../src/i18n";

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
    expect(screen.getAllByText(/Playback progress synced/i).length).toBeGreaterThan(0);
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
    expect(screen.queryByText(/Membership not yet active/i)).toBeNull();
  });

  it("shows pending note for signed-in non-member", () => {
    render(
      <PaywallSheet
        visible
        reason="support"
        isSignedIn
        onDismiss={dismissMock}
      />,
    );
    expect(screen.getAllByText(/Become a member/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Sign in to continue/i)).toBeNull();
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
    fireEvent.press(screen.getAllByText(/LATER/i)[0]);
    expect(dismissMock).toHaveBeenCalledTimes(1);
  });
});
