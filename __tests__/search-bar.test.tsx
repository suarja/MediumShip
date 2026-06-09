import { fireEvent, render, screen } from "@testing-library/react-native";

import { SearchBar } from "../src/components/search/search-bar";
import { HapticsService } from "../src/features/haptics/haptics";

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
      colors: {
        border: "#DDD",
        surface: "#FFF",
        accent: "#C45A2A",
        text: "#111",
        textMuted: "#666",
      },
      radii: { pill: 99 },
    },
  }),
}));

describe("SearchBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fires light haptic when the read-only entry button is pressed", () => {
    const onPress = jest.fn();

    render(
      <SearchBar placeholder="Search" onPress={onPress} testID="home-search" />,
    );

    fireEvent.press(screen.getByTestId("home-search"));

    expect(HapticsService.light).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("fires light haptic when search is submitted", () => {
    const onSubmitEditing = jest.fn();

    render(
      <SearchBar
        placeholder="Search"
        value="care"
        onChangeText={jest.fn()}
        onSubmitEditing={onSubmitEditing}
        testID="explore-search"
      />,
    );

    fireEvent(screen.getByTestId("explore-search"), "submitEditing");

    expect(HapticsService.light).toHaveBeenCalledTimes(1);
    expect(onSubmitEditing).toHaveBeenCalledTimes(1);
  });
});
