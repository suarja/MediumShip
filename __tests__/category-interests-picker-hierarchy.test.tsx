import { fireEvent, render, screen } from "@testing-library/react-native";

import type { Id } from "../convex/_generated/dataModel";
import { CategoryInterestsPicker } from "../src/components/settings/category-interests-picker";
import { initI18n } from "../src/i18n";

const literatureId = "literature" as Id<"categories">;
const romanId = "roman" as Id<"categories">;

const mockToggleCategory = jest.fn().mockResolvedValue(undefined);

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    tenantSlug: "demo-media",
    theme: {
      colors: {
        accent: "#b45309",
        heading: "#1c1917",
        textMuted: "#78716c",
        border: "#e7e5e4",
        surfaceMuted: "#f5f5f4",
      },
      radii: { pill: 999, lg: 16 },
      isDark: false,
    },
  }),
}));

jest.mock("../src/features/responsive/use-responsive", () => ({
  useResponsive: () => ({ scaleSpace: 1 }),
}));

jest.mock("../src/features/categories/use-category-interests", () => ({
  useCategoryInterestSearch: () => [],
}));

describe("CategoryInterestsPicker hierarchy", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    mockToggleCategory.mockClear();
  });

  it("expands children without toggling off an already-picked parent", () => {
    render(
      <CategoryInterestsPicker
        options={[
          { label: "Littérature", icon: "※", iconKey: "culture" },
          { label: "Roman", icon: "※", iconKey: "culture" },
        ]}
        selectedKeys={new Set(["litterature"])}
        toggleCategory={mockToggleCategory}
        treeNodes={[
          {
            _id: literatureId,
            label: "Littérature",
            iconKey: "culture",
            depth: 1,
          },
          {
            _id: romanId,
            label: "Roman",
            iconKey: "culture",
            parentId: literatureId,
            depth: 2,
          },
        ]}
      />,
    );

    expect(screen.queryByText("Roman")).toBeNull();

    fireEvent.press(screen.getByText("Littérature"));

    expect(screen.getByText("Roman")).toBeTruthy();
    expect(mockToggleCategory).not.toHaveBeenCalled();
  });

  it("toggles a leaf category on tap", () => {
    render(
      <CategoryInterestsPicker
        options={[{ label: "Roman", icon: "※", iconKey: "culture" }]}
        selectedKeys={new Set(["litterature"])}
        toggleCategory={mockToggleCategory}
        treeNodes={[
          {
            _id: literatureId,
            label: "Littérature",
            iconKey: "culture",
            depth: 1,
          },
          {
            _id: romanId,
            label: "Roman",
            iconKey: "culture",
            parentId: literatureId,
            depth: 2,
          },
        ]}
      />,
    );

    fireEvent.press(screen.getByText("Littérature"));
    fireEvent.press(screen.getByText("Roman"));

    expect(mockToggleCategory).toHaveBeenCalledWith("Roman");
  });
});
