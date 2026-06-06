import { render, screen, fireEvent } from "@testing-library/react-native";

import AgendaScreen from "../app/(app)/agenda";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: object }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
  };
});

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

describe("agenda screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  it("renders fixture events", () => {
    render(<AgendaScreen />);

    expect(screen.getAllByText(/Paris|Lyon|visio/i).length).toBeGreaterThan(0);
  });

  it("shows filter chips", () => {
    render(<AgendaScreen />);

    expect(screen.getByText("À venir")).toBeTruthy();
    expect(screen.getByText("En ligne")).toBeTruthy();
    expect(screen.getByText("Local")).toBeTruthy();
  });

  it("filters by online mode", () => {
    render(<AgendaScreen />);

    fireEvent.press(screen.getByText("En ligne"));
    expect(screen.getAllByText(/EN LIGNE/i).length).toBeGreaterThan(0);
  });
});
