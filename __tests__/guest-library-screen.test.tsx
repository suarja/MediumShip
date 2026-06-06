import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import LibraryScreen from "../app/(app)/library";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
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
    mockReplace.mockClear();
    mockPush.mockClear();
    await changeAppLanguage("en");
  });

  it("shows the guest-first sign-in gate", () => {
    render(<LibraryScreen />);

    expect(screen.getByText("Library")).toBeTruthy();
    expect(screen.getByText("Your library, everywhere")).toBeTruthy();
    expect(screen.getByText("Sign in")).toBeTruthy();
  });

  it("returns to the home tab without stacking the guest gate", () => {
    render(<LibraryScreen />);

    fireEvent.press(screen.getByText("Continue as guest"));

    expect(mockReplace).toHaveBeenCalledWith("/home");
    expect(mockPush).not.toHaveBeenCalledWith("/home");
  });
});
