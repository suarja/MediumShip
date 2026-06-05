import { render, screen } from "@testing-library/react-native";

import ExploreScreen from "../app/(app)/explore";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("../src/components/navigation/app-tab-bar", () => ({
  useTabBarSpace: () => 96,
}));

jest.mock("../src/features/media/persistent-media-player", () => ({
  usePersistentMediaPlayerSpace: () => 0,
}));

describe("explore screen", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("renders the first discovery shell sections", () => {
    render(<ExploreScreen />);

    expect(screen.getByText("Explore")).toBeTruthy();
    expect(screen.getByText("Search analyses, podcasts, events…")).toBeTruthy();
    expect(screen.getByText("Categories")).toBeTruthy();
    expect(screen.getByText("Modules")).toBeTruthy();
    expect(screen.getByText("Collections")).toBeTruthy();
    expect(screen.getByText("Community")).toBeTruthy();
  });
});
