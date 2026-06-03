import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "../app/(app)/home";

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

jest.mock("convex/react", () => ({
  useQuery: () => [
    {
      _id: "1",
      kind: "article",
      status: "published",
      title: "L'economie du soin",
      summary: "Une analyse",
      category: "Analyse",
      tags: ["analyse"],
      tenantSlug: "demo-media",
      isPremium: false,
      readingTimeMinutes: 18,
    },
  ],
  useMutation: () => jest.fn(),
}));

describe("home feed", () => {
  it("renders published content cards instead of the tenant seed state", () => {
    render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <HomeScreen />
      </SafeAreaProvider>,
    );

    expect(screen.getByText("L'economie du soin")).toBeTruthy();
    expect(screen.queryByText(/Seed demo tenant/i)).toBeNull();
  });
});
