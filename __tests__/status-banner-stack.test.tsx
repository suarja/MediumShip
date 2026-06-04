import { render, screen } from "@testing-library/react-native";

import { StatusBannerStack } from "../src/components/content/status-banner-stack";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockDismiss = jest.fn();

jest.mock("../src/features/incident/use-incident-status", () => ({
  useIncidentStatus: () => ({
    incident: {
      id: "incident-1",
      message: "Playback sync is delayed while maintenance is in progress.",
    },
    dismiss: mockDismiss,
  }),
}));

describe("StatusBannerStack", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockDismiss.mockClear();
  });

  it("renders the incident banner above the degraded network banner", () => {
    render(<StatusBannerStack networkState="offline" />);

    expect(screen.getByText("Service incident")).toBeTruthy();
    expect(
      screen.getByText(
        "Playback sync is delayed while maintenance is in progress.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("You are offline — downloaded items still work")).toBeTruthy();
  });
});
