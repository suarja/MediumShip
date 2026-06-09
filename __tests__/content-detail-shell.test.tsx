import type { ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ContentDetailShell } from "../src/components/content/content-detail-shell";
import { HapticsService } from "../src/features/haptics/haptics";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockBack = jest.fn();
const mockReplace = jest.fn();

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

jest.mock("expo-router", () => ({
  useRouter: () => ({
    canGoBack: () => true,
    back: mockBack,
    replace: mockReplace,
  }),
  useSegments: () => ["(app)"],
}));

describe("ContentDetailShell", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await changeAppLanguage("en");
    mockBack.mockClear();
    mockReplace.mockClear();
  });

  it("navigates back to the previous screen instead of forcing home", () => {
    render(
      <ContentDetailShell
        state="loading"
        networkState="online"
        backLabel="Back"
        loadingLabel="Loading"
        offlineTitle="Offline"
        offlineBody="Reconnect"
        notFoundTitle="Not found"
        notFoundBody="Missing"
      >
        <Text>Body</Text>
      </ContentDetailShell>,
    );

    fireEvent.press(screen.getByRole("button", { name: "Back" }));

    expect(HapticsService.selection).toHaveBeenCalledTimes(1);
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("renders the ready-state shell without router link style pitfalls", () => {
    render(
      <ContentDetailShell
        state="ready"
        networkState="online"
        backLabel="Back"
        loadingLabel="Loading"
        offlineTitle="Offline"
        offlineBody="Reconnect"
        notFoundTitle="Not found"
        notFoundBody="Missing"
      >
        <Text>Body</Text>
      </ContentDetailShell>,
    );

    expect(screen.getByText("Back")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
  });
});
