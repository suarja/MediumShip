import { render, screen } from "@testing-library/react-native";

import { LibraryPersonalListRow } from "../src/components/library/library-personal-list-row";
import { changeAppLanguage, initI18n } from "../src/i18n";

describe("LibraryPersonalListRow", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("renders a single cover tile without decorative placeholder layers", () => {
    render(
      <LibraryPersonalListRow
        title="Road trip"
        meta="1 item · private"
        itemCount={1}
        previewCoverUrls={["https://example.com/cover.jpg"]}
        onPress={jest.fn()}
      />,
    );

    expect(screen.getByText("Road trip")).toBeTruthy();
    expect(screen.getByLabelText("Road trip")).toBeTruthy();
  });
});
