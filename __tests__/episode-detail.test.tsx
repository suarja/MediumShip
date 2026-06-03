import type { ReactElement, ReactNode } from "react";
import { render, screen } from "@testing-library/react-native";

import EpisodeDetailScreen from "../app/episode/[id]";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("convex/react", () => ({
  useQuery: () => ({
    _id: "episode_1",
    tenantSlug: "demo-media",
    kind: "episode",
    status: "published",
    title: "Avec Lea Bardin",
    summary: "Entretien long format sur le travail invisible.",
    category: "Podcast",
    tags: ["podcast"],
    isPremium: true,
    publishedAt: "2026-06-03T09:00:00.000Z",
    durationSeconds: 3240,
  }),
}));

jest.mock("expo-router", () => ({
  Link: ({
    asChild,
    children,
  }: {
    asChild?: boolean;
    children: ReactElement<{ style?: unknown }>;
  }) => {
    if (asChild && Array.isArray(children.props.style)) {
      throw new Error(
        "[expo-router]: You are passing an array of styles to a child of <Slot>.",
      );
    }

    return children as ReactNode;
  },
  useLocalSearchParams: () => ({ id: "episode_1" }),
}));

jest.mock("../src/features/network/use-network-status", () => ({
  useNetworkStatus: () => ({ state: "offline" }),
}));

describe("episode detail", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("renders the premium episode CTA without crashing and shows the degraded banner", () => {
    render(<EpisodeDetailScreen />);

    expect(screen.getByText("You are offline")).toBeTruthy();
    expect(screen.getByText(/Members-only episode/)).toBeTruthy();
    expect(screen.getByText(/Become a member/)).toBeTruthy();
  });
});
