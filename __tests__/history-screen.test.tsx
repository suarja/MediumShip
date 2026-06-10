import { Alert } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import HistoryScreen from "../app/(app)/history";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockClearReadingHistory = jest.fn();
const mockUseProgressSyncEnabled = jest.fn();
const mockUseReadingHistory = jest.fn();
const mockUseResume = jest.fn();

jest.mock("../src/features/auth/use-clerk-auth", () => ({
  useClerkAuth: () => ({ isSignedIn: true }),
}));

jest.mock("../src/features/history/use-progress-sync-enabled", () => ({
  useProgressSyncEnabled: () => mockUseProgressSyncEnabled(),
}));

jest.mock("../src/features/history/use-reading-history", () => ({
  useReadingHistory: () => mockUseReadingHistory(),
}));

jest.mock("../src/features/history/use-resume", () => ({
  useResume: (...args: unknown[]) => mockUseResume(...args),
}));

jest.mock("../src/features/navigation/app-navigation", () => ({
  useGoBack: () => jest.fn(),
  usePushWithReturn: () => jest.fn(),
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

jest.mock("../src/components/library/resume-card", () => {
  const { Text } = require("react-native");
  return {
    ResumeCard: () => <Text>Resume card</Text>,
  };
});

describe("HistoryScreen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockClearReadingHistory.mockReset();
    mockUseProgressSyncEnabled.mockReturnValue({ enabled: true, isLoading: false });
    mockUseReadingHistory.mockReturnValue({
      data: [],
      isLoading: false,
      clearReadingHistory: mockClearReadingHistory,
    });
    mockUseResume.mockReturnValue({ data: null, isLoading: false });
    await changeAppLanguage("en");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the guest gate when progress sync is unavailable", async () => {
    mockUseProgressSyncEnabled.mockReturnValue({ enabled: false, isLoading: false });

    render(<HistoryScreen />);

    expect(screen.getByText("History is for members")).toBeTruthy();
    expect(screen.queryByText("No viewed content yet. Open an article, episode, or video to find it here.")).toBeNull();
  });

  it("renders the empty state for a member without history", () => {
    render(<HistoryScreen />);

    expect(
      screen.getByText(
        "No viewed content yet. Open an article, episode, or video to find it here.",
      ),
    ).toBeTruthy();
  });

  it("renders history rows when data is present", () => {
    mockUseReadingHistory.mockReturnValue({
      data: [
        {
          contentId: "content_1",
          kind: "article",
          title: "Field notes",
          openedAt: Date.parse("2026-06-01T10:00:00.000Z"),
        },
      ],
      isLoading: false,
      clearReadingHistory: mockClearReadingHistory,
    });

    render(<HistoryScreen />);

    expect(screen.getByText("Field notes")).toBeTruthy();
    expect(screen.getByTestId("history-row-content_1")).toBeTruthy();
  });

  it("calls clearReadingHistory after confirm", () => {
    mockUseReadingHistory.mockReturnValue({
      data: [
        {
          contentId: "content_1",
          kind: "episode",
          title: "Episode one",
          openedAt: Date.now(),
        },
      ],
      isLoading: false,
      clearReadingHistory: mockClearReadingHistory,
    });

    render(<HistoryScreen />);
    fireEvent.press(screen.getByText("Clear"));

    expect(Alert.alert).toHaveBeenCalled();
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0] as [
      string,
      string,
      Array<{ text: string; onPress?: () => void }>,
    ];
    const confirm = buttons.find((button) => button.text === "Clear history");
    confirm?.onPress?.();

    expect(mockClearReadingHistory).toHaveBeenCalledWith({});
  });
});
