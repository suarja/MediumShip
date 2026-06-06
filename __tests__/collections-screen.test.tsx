import { render, screen } from "@testing-library/react-native";

import CollectionsScreen from "../app/(app)/collections";
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

describe("collections index screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("renders at least one fixture collection", () => {
    render(<CollectionsScreen />);

    expect(screen.getAllByText(/grand entretien|Programme 2027|autrement/i).length).toBeGreaterThan(0);
  });

  it("shows item counts for rendered collections", () => {
    render(<CollectionsScreen />);

    expect(screen.getAllByText(/CONTENUS/i).length).toBeGreaterThan(0);
  });
});
