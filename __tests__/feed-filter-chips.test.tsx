import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { FeedFilterChips } from "../src/components/content/feed-filter-chips";
import { HapticsService } from "../src/features/haptics/haptics";
import { resolveTheme } from "../src/features/theme/palette-catalog";

const mockUseAppTheme = jest.fn();

jest.mock("../src/features/haptics/haptics", () => ({
  HapticsService: {
    selection: jest.fn(),
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

function flattenStyle(style: unknown) {
  return StyleSheet.flatten(style as object);
}

describe("FeedFilterChips", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const chips = [
    { key: "all" as const, label: "Tout" },
    { key: "article" as const, label: "Articles" },
  ];

  it("fires selection haptic when a chip is selected", () => {
    const theme = resolveTheme({ paletteName: "brick" });
    mockUseAppTheme.mockReturnValue({ theme });
    const onSelect = jest.fn();

    render(<FeedFilterChips chips={chips} active="all" onSelect={onSelect} />);

    fireEvent.press(screen.getByTestId("feed-filter-chip-article"));

    expect(HapticsService.selection).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("article");
  });

  it("gives inactive chips a surface fill and stronger ink border", () => {
    const theme = resolveTheme({ paletteName: "brick" });
    mockUseAppTheme.mockReturnValue({ theme });

    render(<FeedFilterChips chips={chips} active="all" onSelect={jest.fn()} />);

    const chip = flattenStyle(screen.getByTestId("feed-filter-chip-article").props.style);
    const label = flattenStyle(screen.getByText("Articles").props.style);

    expect(chip).toEqual(
      expect.objectContaining({
        backgroundColor: theme.colors.surface,
        borderColor: "rgba(43, 33, 29, 0.2)",
      }),
    );
    expect((label as { color: string }).color).toBe(theme.colors.text);
  });

  it("keeps the active chip on the inverted ink fill", () => {
    const theme = resolveTheme({ paletteName: "midnight" });
    mockUseAppTheme.mockReturnValue({ theme });

    render(<FeedFilterChips chips={chips} active="all" onSelect={jest.fn()} />);

    const chip = flattenStyle(screen.getByTestId("feed-filter-chip-all").props.style);
    const label = flattenStyle(screen.getByText("Tout").props.style);

    expect(chip).toEqual(
      expect.objectContaining({
        backgroundColor: theme.colors.heading,
        borderColor: theme.colors.heading,
      }),
    );
    expect((label as { color: string }).color).toBe(theme.colors.canvas);
  });
});
