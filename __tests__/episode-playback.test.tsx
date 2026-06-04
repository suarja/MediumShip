import { Pressable, Text, View } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import {
  PersistentMediaPlayerProvider,
  usePersistentMediaPlayer,
} from "../src/features/media/persistent-media-player";

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSegments: () => ["(app)"],
}));

type CreatedPlayer = {
  source: unknown;
  play: jest.Mock;
  pause: jest.Mock;
  remove: jest.Mock;
  seekTo: jest.Mock;
};

const createdPlayers: CreatedPlayer[] = [];

jest.mock("expo-audio", () => ({
  __esModule: true,
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  createAudioPlayer: (source: unknown) => {
    const player: CreatedPlayer = {
      source,
      play: jest.fn(),
      pause: jest.fn(),
      remove: jest.fn(),
      seekTo: jest.fn().mockResolvedValue(undefined),
    };
    createdPlayers.push(player);
    return player;
  },
  useAudioPlayerStatus: () => ({
    currentTime: 0,
    duration: 0,
    isBuffering: false,
    isLoaded: false,
    playing: false,
    didJustFinish: false,
    error: null,
  }),
}));

function Harness() {
  const { playEpisode } = usePersistentMediaPlayer();
  return (
    <View>
      <Pressable
        onPress={() =>
          void playEpisode({
            contentId: "episode_1",
            title: "Episode one",
            audioUrl: "https://cdn.example.com/episode.mp3",
            durationSeconds: 1800,
          })
        }
      >
        <Text>play episode</Text>
      </Pressable>
    </View>
  );
}

describe("episode playback", () => {
  beforeEach(() => {
    createdPlayers.length = 0;
  });

  it("builds a source-bearing player and plays it immediately", async () => {
    render(
      <PersistentMediaPlayerProvider>
        <Harness />
      </PersistentMediaPlayerProvider>,
    );

    // one player is created up front with a null source
    expect(createdPlayers).toHaveLength(1);
    expect(createdPlayers[0].source).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByText("play episode"));
    });

    // pressing play creates a new player WITH the audio source attached...
    const trackPlayer = createdPlayers.find(
      (player) =>
        typeof player.source === "object" &&
        player.source !== null &&
        (player.source as { uri?: string }).uri ===
          "https://cdn.example.com/episode.mp3",
    );
    expect(trackPlayer).toBeDefined();
    // ...and plays it right away, without waiting on an isLoaded signal.
    expect(trackPlayer?.play).toHaveBeenCalled();
  });
});
