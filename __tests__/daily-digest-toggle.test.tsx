import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DailyDigestToggle } from "../src/components/settings/daily-digest-toggle";
import { changeAppLanguage, initI18n } from "../src/i18n";

const mockSetEnabled = jest.fn();
const mockRequestPermissionExplicit = jest.fn();
const mockOpenSettings = jest.fn();
const mockScheduleDailyDigest = jest.fn();
const mockUsePermissionStatus = jest.fn(() => ({
  status: "undetermined" as "granted" | "denied" | "undetermined" | "loading",
}));

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const mockDigestSettings = {
  enabled: false,
  hour: 9,
  isLoading: false,
};

jest.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: false, isLoading: false }),
  useMutation: () => jest.fn().mockResolvedValue(undefined),
  useQuery: () => ({
    name: "Demo Media",
    themeConfig: { paletteName: "brick" },
  }),
}));

jest.mock("../src/features/notifications/use-digest-reminder-settings", () => ({
  useDigestReminderSettings: () => ({
    ...mockDigestSettings,
    setEnabled: mockSetEnabled,
    setHour: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock("../src/features/notifications/permission", () => ({
  usePermissionStatus: () => mockUsePermissionStatus(),
  useRequestPermission: () => ({
    requestPermissionExplicit: mockRequestPermissionExplicit,
    openSettings: mockOpenSettings,
  }),
}));

jest.mock("../src/features/notifications/schedule-daily-digest", () => ({
  scheduleDailyDigest: (...args: unknown[]) => mockScheduleDailyDigest(...args),
  cancelDailyDigestReminders: jest.fn(),
}));

function renderToggle() {
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <DailyDigestToggle />
    </SafeAreaProvider>,
  );
}

describe("DailyDigestToggle", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
    mockDigestSettings.enabled = false;
    mockDigestSettings.hour = 9;
    mockDigestSettings.isLoading = false;
    jest.clearAllMocks();
    mockSetEnabled.mockResolvedValue(undefined);
    mockScheduleDailyDigest.mockResolvedValue(undefined);
    mockRequestPermissionExplicit.mockResolvedValue("granted");
    mockUsePermissionStatus.mockReturnValue({ status: "undetermined" });
  });

  it("requests permission and schedules when turned on", async () => {
    renderToggle();

    fireEvent(screen.getByRole("switch"), "valueChange", true);

    await waitFor(() => {
      expect(mockRequestPermissionExplicit).toHaveBeenCalledWith({ showRationale: true });
      expect(mockSetEnabled).toHaveBeenCalledWith(true);
      expect(mockScheduleDailyDigest).toHaveBeenCalledWith({
        hour: 9,
        locale: "en",
        tenantName: "Demo Media",
      });
    });
  });

  it("cancels reminders when turned off", async () => {
    mockDigestSettings.enabled = true;
    mockDigestSettings.hour = 9;
    mockDigestSettings.isLoading = false;

    renderToggle();

    fireEvent(screen.getByRole("switch"), "valueChange", false);

    await waitFor(() => {
      expect(mockSetEnabled).toHaveBeenCalledWith(false);
    });
  });

  it("shows a denied-state helper instead of enabling the switch", () => {
    mockUsePermissionStatus.mockReturnValue({ status: "denied" });

    renderToggle();

    expect(
      screen.getByText("Notifications are blocked. Open system settings to enable them."),
    ).toBeTruthy();
    expect(screen.getByText("Open settings")).toBeTruthy();
    expect(screen.getByRole("switch").props.disabled).toBe(true);

    fireEvent.press(screen.getByText("Open settings"));
    expect(mockOpenSettings).toHaveBeenCalled();
  });

  it("does not enable reminders when permission stays undetermined", async () => {
    mockRequestPermissionExplicit.mockResolvedValue("undetermined");

    renderToggle();

    fireEvent(screen.getByRole("switch"), "valueChange", true);

    await waitFor(() => {
      expect(mockRequestPermissionExplicit).toHaveBeenCalled();
    });

    expect(mockSetEnabled).not.toHaveBeenCalled();
    expect(mockScheduleDailyDigest).not.toHaveBeenCalled();
  });
});
