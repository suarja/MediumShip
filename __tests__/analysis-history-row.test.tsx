import { fireEvent, render, screen } from "@testing-library/react-native";

import { AnalysisHistoryRow } from "../src/components/insights/analysis-history-row";
import { initI18n } from "../src/i18n";

const mockOnPress = jest.fn();

const mockUseAppTheme = jest.fn();

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

function makeTheme() {
  return {
    theme: {
      colors: {
        heading: "#14110E",
        textMuted: "#6B6560",
        border: "#E8E4DC",
        accent: "#C45A2A",
        accentSoft: "#F5E6DC",
      },
      spacing: { md: 12, xs: 4 },
      radii: { pill: 99 },
      isDark: false,
    },
  };
}

describe("AnalysisHistoryRow", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    mockOnPress.mockReset();
    mockUseAppTheme.mockReturnValue(makeTheme());
  });

  it("calls onPress with analysis id", () => {
    render(
      <AnalysisHistoryRow
        item={{
          _id: "analysis_1" as never,
          dayKey: "2026-06-10",
          tasteText: "Politique et société",
          createdAt: Date.parse("2026-06-10T08:00:00.000Z"),
        }}
        onPress={mockOnPress}
      />,
    );

    fireEvent.press(screen.getByTestId("analysis-history-row-analysis_1"));
    expect(mockOnPress).toHaveBeenCalledWith("analysis_1");
  });
});
