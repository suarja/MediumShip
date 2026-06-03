import { render, screen } from "@testing-library/react-native";

import HomeScreen from "../app/(app)/home";

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
    render(<HomeScreen />);

    expect(screen.getByText("L'economie du soin")).toBeTruthy();
    expect(screen.queryByText(/Seed demo tenant/i)).toBeNull();
  });
});
