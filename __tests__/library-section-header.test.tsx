import { fireEvent, render, screen } from "@testing-library/react-native";

import { LibrarySectionHeader } from "../src/components/library/library-section-header";
import { HapticsService } from "../src/features/haptics/haptics";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockOnSeeAllPress = jest.fn();

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

describe("LibrarySectionHeader", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOnSeeAllPress.mockClear();
    await changeAppLanguage("en");
  });

  it("renders an optional See all affordance with chevron", () => {
    render(
      <LibrarySectionHeader
        title="Favorites"
        seeAllLabel="See all"
        onSeeAllPress={mockOnSeeAllPress}
      />,
    );

    fireEvent.press(screen.getByLabelText("See all"));

    expect(HapticsService.light).toHaveBeenCalledTimes(1);
    expect(mockOnSeeAllPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("›")).toBeTruthy();
  });
});
