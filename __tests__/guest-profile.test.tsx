import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";

import ProfileScreen from "../app/(app)/profile";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: false }),
  useMutation: () => jest.fn(),
  useQuery: () => null,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    user: null,
    email: null,
    fullName: null,
    signOut: jest.fn(),
  }),
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

describe("guest profile", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("keeps profile focused on identity and account actions", () => {
    render(<ProfileScreen />);

    expect(screen.getAllByText("Create an account").length).toBeGreaterThan(0);
    expect(screen.getByText("Guest reader")).toBeTruthy();
    expect(screen.getByText("Your profile")).toBeTruthy();
    expect(screen.getByTestId("profile-settings-button")).toBeTruthy();
    expect(screen.getByTestId("profile-create-account-button")).toBeTruthy();
    expect(screen.queryByText("Saved library")).toBeNull();
    expect(screen.queryByText("Offline shelf")).toBeNull();
  });
});
