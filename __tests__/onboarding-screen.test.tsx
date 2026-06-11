import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";

import OnboardingScreen from "../app/onboarding";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    effectiveNavigation: ["home"],
    theme: {
      colors: {
        canvas: "#ffffff",
        heading: "#111111",
        text: "#111111",
        textMuted: "#666666",
        border: "#dddddd",
        surface: "#ffffff",
        accent: "#0000ff",
        premium: "#c8964a",
        canvasAccent: "#f2f2f2",
      },
      spacing: { lg: 16, md: 12, sm: 8, xs: 4 },
      radii: { pill: 99, md: 8 },
      isDark: false,
    },
  }),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

const mockSetOnboardingSeen = jest.fn().mockResolvedValue(undefined);
jest.mock("../src/features/onboarding/onboarding-storage", () => ({
  setOnboardingSeen: () => mockSetOnboardingSeen(),
}));

jest.mock("../src/features/haptics/haptics", () => ({
  HapticsService: {
    light: jest.fn(),
    medium: jest.fn(),
    selection: jest.fn(),
  },
}));

describe("onboarding screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await changeAppLanguage("fr");
  });

  it("walks through the three steps", () => {
    render(<OnboardingScreen />);

    // Step 1 — manifesto (the accent half renders as its own Text node)
    expect(screen.getByText("Celui-ci te fait réfléchir.")).toBeTruthy();

    fireEvent.press(screen.getByText("Commencer"));

    // Step 2 — selection (themes + reads)
    expect(screen.getByText("Choisis ce qui t'interpelle.")).toBeTruthy();
    expect(screen.getByText("Société")).toBeTruthy();
    expect(screen.getByText("L'économie de l'attention")).toBeTruthy();

    fireEvent.press(screen.getByText("Continuer"));

    // Step 3 — premium
    expect(screen.getByText("sans payer.")).toBeTruthy();
    expect(screen.getByText("Essayer Premium")).toBeTruthy();
  });

  it("completes to sign-in via the premium CTA", async () => {
    render(<OnboardingScreen />);
    fireEvent.press(screen.getByText("Commencer"));
    fireEvent.press(screen.getByText("Continuer"));
    fireEvent.press(screen.getByText("Essayer Premium"));

    await waitFor(() => expect(mockSetOnboardingSeen).toHaveBeenCalledTimes(1));
    expect(mockReplace).toHaveBeenCalledWith("/sign-in");
  });

  it("skips straight to the feed", async () => {
    render(<OnboardingScreen />);

    fireEvent.press(screen.getByText("Passer"));

    await waitFor(() => expect(mockSetOnboardingSeen).toHaveBeenCalledTimes(1));
    expect(mockReplace).toHaveBeenCalledWith("/home");
  });
});
