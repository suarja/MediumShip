import type { ReactElement, ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import EpisodeDetailScreen from "../app/episode/[id]";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockUseQuery = jest.fn();
const mockPush = jest.fn();

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: false }),
  useMutation: () => jest.fn(),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
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
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../src/features/network/use-network-status", () => ({
  useNetworkStatus: () => ({ state: "offline" }),
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

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayer: () => ({
    activeSession: null,
    activeTrack: null,
    currentTimeSeconds: 0,
    durationSeconds: 0,
    hasFinished: false,
    isBuffering: false,
    isPlaying: false,
    playbackError: null,
    seekBy: jest.fn(),
    togglePlayback: jest.fn(),
  }),
  usePersistentMediaPlayerSpace: () => 0,
}));

describe("episode detail", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockPush.mockClear();
    mockUseQuery.mockReturnValue({
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
    });
  });

  it("renders the premium episode CTA without crashing and shows the degraded banner", () => {
    render(<EpisodeDetailScreen />);

    expect(screen.getByText("You are offline — downloaded items still work")).toBeTruthy();
    expect(screen.getByText(/Members-only episode/)).toBeTruthy();
    // The member-access card carries the become-a-member CTA (opens the paywall
    // sheet for a signed-in non-member; routes a guest to sign-in).
    expect(screen.getByText(/Become a member/)).toBeTruthy();
  });

  it("renders a simple playback CTA for free episodes with an audio url", () => {
    mockUseQuery.mockReturnValue({
      _id: "episode_1",
      tenantSlug: "demo-media",
      kind: "episode",
      status: "published",
      title: "Avec Lea Bardin",
      summary: "Entretien long format sur le travail invisible.",
      category: "Podcast",
      tags: ["podcast"],
      isPremium: false,
      publishedAt: "2026-06-03T09:00:00.000Z",
      durationSeconds: 3240,
      audioUrl: "https://cdn.example.com/episode.mp3",
    });

    render(<EpisodeDetailScreen />);

    expect(screen.getAllByText("Listen now")).toHaveLength(1);
    expect(screen.queryByText("Play")).toBeNull();
    expect(screen.queryByText(/Members-only episode/)).toBeNull();
  });

  it("opens the dedicated player route from episode detail playback CTA", async () => {
    mockUseQuery.mockReturnValue({
      _id: "episode_1",
      tenantSlug: "demo-media",
      kind: "episode",
      status: "published",
      title: "Avec Lea Bardin",
      summary: "Entretien long format sur le travail invisible.",
      category: "Podcast",
      tags: ["podcast"],
      isPremium: false,
      publishedAt: "2026-06-03T09:00:00.000Z",
      durationSeconds: 3240,
      audioUrl: "https://cdn.example.com/episode.mp3",
    });

    render(<EpisodeDetailScreen />);

    fireEvent.press(screen.getByText("Listen now"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/player/episode_1");
    });
  });
});
