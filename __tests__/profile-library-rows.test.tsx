import { fireEvent, render, screen } from "@testing-library/react-native";

import { ProfileLibraryRows } from "../src/components/profile/profile-library-rows";
import { HapticsService } from "../src/features/haptics/haptics";
import { defaultTenant } from "../src/features/tenant/default-tenant";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockOpenPaywall = jest.fn();
const mockPush = jest.fn();

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
  usePathname: () => "/profile",
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({}),
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));

jest.mock("../src/features/paywall/paywall-sheet-provider", () => ({
  usePaywallSheet: () => ({ openPaywall: mockOpenPaywall, closePaywall: jest.fn() }),
}));

const mockUseAppTheme = jest.fn(() => ({
  theme: {
    colors: {
      heading: "#111",
      textMuted: "#666",
      border: "#ddd",
      surface: "#fff",
      accent: "#20457A",
      accentSoft: "#e8eef5",
      premium: "#c9a227",
      canvas: "#fafafa",
    },
    spacing: { xs: 4, sm: 8, lg: 16 },
    radii: { sm: 8 },
    isDark: false,
  },
  enabledModules: defaultTenant.enabledModules,
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

function renderRows(isMember = false) {
  return render(
    <ProfileLibraryRows
      isMember={isMember}
      savedCount={2}
      downloadCount={1}
      listsCount={0}
      onSignOut={jest.fn()}
    />,
  );
}

describe("ProfileLibraryRows capability gating", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOpenPaywall.mockClear();
    mockPush.mockClear();
    mockUseAppTheme.mockReturnValue({
      theme: {
        colors: {
          heading: "#111",
          textMuted: "#666",
          border: "#ddd",
          surface: "#fff",
          accent: "#20457A",
          accentSoft: "#e8eef5",
          premium: "#c9a227",
          canvas: "#fafafa",
        },
        spacing: { xs: 4, sm: 8, lg: 16 },
        radii: { sm: 8 },
        isDark: false,
      },
      enabledModules: defaultTenant.enabledModules,
    });
    await changeAppLanguage("en");
  });

  it("hides offline and lists rows when capabilities are disabled", () => {
    mockUseAppTheme.mockReturnValue({
      theme: mockUseAppTheme().theme,
      enabledModules: ["bookmarks", "progressSync"],
    });

    renderRows();

    expect(screen.getByText("Favorites")).toBeTruthy();
    expect(screen.getByText("History & progress")).toBeTruthy();
    expect(screen.queryByText("Downloads")).toBeNull();
    expect(screen.queryByText("My lists")).toBeNull();
  });

  it("opens the offline paywall when offline is enabled but the user is not premium", () => {
    renderRows(false);

    fireEvent.press(screen.getByText("Downloads"));

    expect(HapticsService.medium).toHaveBeenCalledTimes(1);
    expect(mockOpenPaywall).toHaveBeenCalledWith("offline");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to downloads when offline is enabled and the user is premium", () => {
    renderRows(true);

    fireEvent.press(screen.getByText("Downloads"));

    expect(HapticsService.light).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/downloads" }),
    );
    expect(mockOpenPaywall).not.toHaveBeenCalled();
  });

  it("hides premium badges when the user already has access", () => {
    renderRows(true);

    expect(screen.queryByText("Premium")).toBeNull();
  });

  it("shows a premium badge only for gated rows when the user is not premium", () => {
    renderRows(false);

    expect(screen.getAllByText("Premium").length).toBe(2);
    expect(screen.queryByText("Free")).toBeNull();
    expect(screen.queryByText("Member")).toBeNull();
  });
});
