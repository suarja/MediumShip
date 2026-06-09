import { fireEvent, render, screen } from "@testing-library/react-native";

import { ContentOverflowButton } from "../src/components/content/content-overflow-button";
import { HapticsService } from "../src/features/haptics/haptics";

const mockOpenContentActions = jest.fn();

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

jest.mock("../src/features/content/content-actions-sheet-provider", () => ({
  useContentActionsSheet: () => ({
    openContentActions: mockOpenContentActions,
    closeContentActions: jest.fn(),
  }),
}));

jest.mock("../src/features/responsive/use-responsive", () => ({
  useResponsive: () => ({
    isTablet: false,
    scaleFont: 1,
    scaleSpace: 1,
    contentMaxWidth: undefined,
  }),
}));

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    theme: {
      colors: { textMuted: "#666" },
      radii: { sm: 4 },
    },
  }),
}));

describe("ContentOverflowButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fires light haptic when opening the actions sheet from a feed row", () => {
    render(
      <ContentOverflowButton
        contentId={"article-1" as never}
        accessibilityLabel="Actions for article"
      />,
    );

    fireEvent.press(screen.getByLabelText("Actions for article"));

    expect(HapticsService.light).toHaveBeenCalledTimes(1);
    expect(mockOpenContentActions).toHaveBeenCalledWith("article-1", "all");
  });
});
