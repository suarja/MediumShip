import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import {
  NetworkStatusDebugProvider,
  useNetworkStatus,
} from "../src/features/network/use-network-status";
import { NetworkStateDebugItem } from "../src/components/settings/network-state-debug-item";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("@react-native-community/netinfo", () => ({
  useNetInfo: () => ({
    isConnected: true,
    isInternetReachable: true,
  }),
}));

function Probe() {
  const { state } = useNetworkStatus();
  return <Text>{state}</Text>;
}

describe("network state debug item", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("overrides the network state in memory", async () => {
    render(
      <NetworkStatusDebugProvider>
        <NetworkStateDebugItem />
        <Probe />
      </NetworkStatusDebugProvider>,
    );

    expect(screen.getByText("online")).toBeTruthy();

    fireEvent.press(screen.getByText("Auto"));
    fireEvent.press(screen.getByText("Offline"));

    await waitFor(() => {
      expect(screen.getByText("offline")).toBeTruthy();
    });
  });
});
