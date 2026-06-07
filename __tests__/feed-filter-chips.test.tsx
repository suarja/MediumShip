import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { FeedFilterChips } from "../src/components/content/feed-filter-chips";
import { resolveTheme } from "../src/features/theme/palette-catalog";

const mockUseAppTheme = jest.fn();

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

function flattenStyle(style: unknown) {
  return StyleSheet.flatten(style as object);
}

describe("FeedFilterChips", () => {
  const chips = [
    { key: "all" as const, label: "Tout" },
    { key: "article" as const, label: "Articles" },
  ];

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
