import { render, screen } from "@testing-library/react-native";

import { DegradedBanner } from "../src/components/content/degraded-banner";
import { changeAppLanguage, initI18n } from "../src/i18n";

describe("degraded banner", () => {
  beforeAll(async () => {
    await initI18n();
    await changeAppLanguage("en");
  });

  it("renders an offline message when the app is offline", () => {
    render(<DegradedBanner state="offline" />);
    expect(screen.getByText("You are offline — downloaded items still work")).toBeTruthy();
  });

  it("renders nothing when the app is online", () => {
    const { toJSON } = render(<DegradedBanner state="online" />);
    expect(toJSON()).toBeNull();
  });
});
