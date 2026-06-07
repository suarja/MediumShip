import { fireEvent, render, screen } from "@testing-library/react-native";

import { LibrarySectionHeader } from "../src/components/library/library-section-header";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockOnSeeAllPress = jest.fn();

describe("LibrarySectionHeader", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
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

    expect(mockOnSeeAllPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("›")).toBeTruthy();
  });
});
