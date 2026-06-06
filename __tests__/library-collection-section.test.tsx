import { render, screen } from "@testing-library/react-native";

import { LibraryCollectionSection } from "../src/components/library/library-collection-section";
import { initI18n } from "../src/i18n";

describe("LibraryCollectionSection", () => {
  beforeAll(async () => {
    await initI18n();
  });

  it("does not render the internal section title when hideHeader is set", () => {
    render(
      <LibraryCollectionSection
        hideHeader
        title="Saved"
        subtitle="Subtitle copy"
        items={[]}
        isLoading={false}
        loadingLabel="Loading"
        emptyTitle="Empty shelf"
        emptyBody="Nothing saved yet."
        emptyIconName="bookmark-outline"
      />,
    );

    expect(screen.queryByText("Saved")).toBeNull();
    expect(screen.queryByText("Subtitle copy")).toBeNull();
    expect(screen.getByText("Empty shelf")).toBeTruthy();
  });
});
