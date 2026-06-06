import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";

import ArticleDetailScreen from "../app/article/[id]";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("convex/react", () => ({
  useQuery: () => undefined,
  useConvexAuth: () => ({ isAuthenticated: false }),
  useMutation: () => jest.fn(),
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: ReactNode }) => children,
  useLocalSearchParams: () => ({ id: "article_1" }),
  useSegments: () => ["(app)"],
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("../src/features/network/use-network-status", () => ({
  useNetworkStatus: () => ({ state: "offline" }),
}));

describe("article detail offline", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("shows an offline fallback instead of an infinite loading state", () => {
    render(<ArticleDetailScreen />);

    expect(screen.getByText("Article unavailable offline")).toBeTruthy();
    expect(
      screen.getByText(
        "Reconnect to load this article for the first time, or open a downloaded copy.",
      ),
    ).toBeTruthy();
  });
});
