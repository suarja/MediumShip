import { fireEvent, render, screen } from "@testing-library/react-native";

import { BriefingInviteModal } from "../src/components/insights/briefing-invite-modal";
import { initI18n } from "../src/i18n";

const mockOnOpen = jest.fn();
const mockOnDismiss = jest.fn();

const mockUseAppTheme = jest.fn();

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => mockUseAppTheme(),
}));

function makeTheme() {
  return {
    theme: {
      colors: {
        heading: "#14110E",
        text: "#14110E",
        textMuted: "#6B6560",
        border: "#E8E4DC",
        surface: "#F4F1E8",
        surfaceMuted: "#EDE9E2",
        accent: "#C45A2A",
        canvas: "#FAF7F0",
        overlay: "rgba(43, 33, 29, 0.26)",
      },
      spacing: { lg: 16, md: 12, sm: 8, xs: 4, xl: 24 },
      radii: { pill: 99, md: 8, lg: 12, xl: 16 },
    },
  };
}

describe("BriefingInviteModal", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    mockOnOpen.mockReset();
    mockOnDismiss.mockReset();
    mockUseAppTheme.mockReturnValue(makeTheme());
  });

  it("opens briefing on primary action", () => {
    render(
      <BriefingInviteModal
        visible
        previewText="Tu lis beaucoup de politique."
        onOpen={mockOnOpen}
        onDismiss={mockOnDismiss}
      />,
    );

    fireEvent.press(screen.getByTestId("briefing-invite-open"));
    expect(mockOnOpen).toHaveBeenCalled();
  });
});
