import { fireEvent, render, screen } from "@testing-library/react-native";

import { ResumeCard } from "../src/components/library/resume-card";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockPushWithReturn = jest.fn();

jest.mock("../src/features/navigation/app-navigation", () => ({
  usePushWithReturn: () => mockPushWithReturn,
}));

const mockUseResume = jest.fn();

jest.mock("../src/features/history/use-resume", () => ({
  useResume: (...args: unknown[]) => mockUseResume(...args),
}));

describe("ResumeCard", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    mockPushWithReturn.mockClear();
    mockUseResume.mockReset();
    await changeAppLanguage("en");
  });

  it("renders null when there is no resume data", () => {
    mockUseResume.mockReturnValue({ data: null, isLoading: false });
    render(<ResumeCard enabled />);
    expect(screen.queryByTestId("resume-card")).toBeNull();
  });

  it("renders title and progress bar from live data", () => {
    mockUseResume.mockReturnValue({
      data: {
        contentId: "content_1",
        kind: "episode",
        title: "The care economy",
        seconds: 672,
        durationSeconds: 1800,
        progressRatio: 0.37,
      },
      isLoading: false,
    });

    render(<ResumeCard enabled />);

    expect(screen.getByText("The care economy")).toBeTruthy();
    expect(screen.getByText("Episode · 18:48 left · 37%")).toBeTruthy();
  });

  it("opens the dedicated player route on press", () => {
    mockUseResume.mockReturnValue({
      data: {
        contentId: "content_2",
        kind: "video",
        title: "Field notes",
        seconds: 120,
        durationSeconds: 600,
        progressRatio: 0.2,
      },
      isLoading: false,
    });

    render(<ResumeCard enabled />);
    fireEvent.press(screen.getByTestId("resume-card"));

    expect(mockPushWithReturn).toHaveBeenCalledWith("/player/content_2");
  });

  it("calls a custom onPress when provided", () => {
    const onPress = jest.fn();
    mockUseResume.mockReturnValue({
      data: {
        contentId: "content_3",
        kind: "episode",
        title: "Custom press",
        seconds: 60,
        progressRatio: 0.1,
      },
      isLoading: false,
    });

    render(<ResumeCard enabled onPress={onPress} />);
    fireEvent.press(screen.getByTestId("resume-card"));

    expect(onPress).toHaveBeenCalled();
    expect(mockPushWithReturn).not.toHaveBeenCalled();
  });
});
