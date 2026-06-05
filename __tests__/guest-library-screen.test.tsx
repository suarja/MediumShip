import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";

import LibraryScreen from "../app/(app)/library";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}));

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({
    isLoaded: true,
    isSignedIn: false,
  }),
}));

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

describe("guest library screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("shows the guest-first sign-in gate", () => {
    render(<LibraryScreen />);

    expect(screen.getByText("Library")).toBeTruthy();
    expect(screen.getByText("Your library, everywhere")).toBeTruthy();
    expect(screen.getByText("Sign in")).toBeTruthy();
  });
});
