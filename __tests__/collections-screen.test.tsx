import { render, screen } from "@testing-library/react-native";

import CollectionsScreen from "../app/(app)/collections";
import { changeAppLanguage, initI18n } from "../src/i18n";

const MOCK_COLLECTIONS = [
  { _id: "coll-1", slug: "le-grand-entretien", title: "Le grand entretien", summary: "La série phare.", itemCount: 14 },
  { _id: "coll-2", slug: "programme-2027", title: "Programme 2027", summary: "Prépare le cycle électoral.", itemCount: 32 },
  { _id: "coll-3", slug: "economie-autrement", title: "L'économie autrement", summary: "Déconstruit les idées reçues.", itemCount: 8 },
];

jest.mock("../src/features/collections/use-collections", () => ({
  useCollections: () => ({ collections: MOCK_COLLECTIONS, isLoading: false }),
  useCollection: () => ({ collection: undefined, isLoading: false }),
}));

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
