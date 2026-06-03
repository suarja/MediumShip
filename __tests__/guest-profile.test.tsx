import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";

import ProfileScreen from "../app/(app)/profile";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: false }),
  useMutation: () => jest.fn(),
  useQuery: () => undefined,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
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
    expect(screen.queryByText(/Stored in Convex/i)).toBeNull();
  });
});
