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

  it("shows a member CTA instead of authenticated identity fields", () => {
    render(<ProfileScreen />);

    expect(screen.getByText("Create an account")).toBeTruthy();
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.queryByText(/Stored in Convex/i)).toBeNull();
  });
});
