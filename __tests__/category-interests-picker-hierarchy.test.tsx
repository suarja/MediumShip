import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import type { Id } from "../convex/_generated/dataModel";
import { CategoryInterestsPicker } from "../src/components/settings/category-interests-picker";
import { initI18n } from "../src/i18n";

const literatureId = "literature" as Id<"categories">;
const romanId = "roman" as Id<"categories">;
const sportId = "sport" as Id<"categories">;
const footballId = "football" as Id<"categories">;
const beachId = "beach" as Id<"categories">;

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

function StatefulPicker({
  initialKeys,
  treeNodes,
  options,
}: {
  initialKeys: string[];
  treeNodes: Parameters<typeof CategoryInterestsPicker>[0]["treeNodes"];
  options: Parameters<typeof CategoryInterestsPicker>[0]["options"];
}) {
  const [selectedKeys, setSelectedKeys] = useState(() => new Set(initialKeys));

  return (
    <CategoryInterestsPicker
      applyCategoryInterests={async (keys) => {
        setSelectedKeys(new Set(keys));
      }}
      options={options}
      selectedKeys={selectedKeys}
      treeNodes={treeNodes}
    />
  );
}

describe("CategoryInterestsPicker hierarchy", () => {
  beforeAll(async () => {
    await initI18n();
  });

  it("shows children on load when the parent is already picked", () => {
    render(
      <StatefulPicker
        initialKeys={["litterature"]}
        options={[
          { label: "Littérature", icon: "※", iconKey: "culture" },
          { label: "Roman", icon: "※", iconKey: "culture" },
        ]}
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

    expect(screen.getByText("Roman")).toBeTruthy();
    expect(screen.getByTestId("interest-litterature-on")).toBeTruthy();
  });

  it("reveals and selects a parent on first tap", async () => {
    const applyCategoryInterests = jest.fn().mockResolvedValue(undefined);

    render(
      <CategoryInterestsPicker
        applyCategoryInterests={applyCategoryInterests}
        options={[{ label: "Sport", icon: "※", iconKey: "culture" }]}
        selectedKeys={new Set()}
        treeNodes={[
          { _id: sportId, label: "Sport", iconKey: "culture", depth: 1 },
          {
            _id: footballId,
            label: "Football",
            iconKey: "culture",
            parentId: sportId,
            depth: 2,
          },
        ]}
      />,
    );

    fireEvent.press(screen.getByText("Sport"));

    await waitFor(() => {
      expect(screen.getByText("Football")).toBeTruthy();
      expect(screen.getByTestId("interest-sport-on")).toBeTruthy();
    });
    expect(applyCategoryInterests).toHaveBeenCalledWith(new Set(["sport"]));
  });

  it("deselects a picked parent on second tap while keeping children visible", async () => {
    render(
      <StatefulPicker
        initialKeys={["sport"]}
        options={[
          { label: "Sport", icon: "※", iconKey: "culture" },
          { label: "Football", icon: "※", iconKey: "culture" },
        ]}
        treeNodes={[
          { _id: sportId, label: "Sport", iconKey: "culture", depth: 1 },
          {
            _id: footballId,
            label: "Football",
            iconKey: "culture",
            parentId: sportId,
            depth: 2,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("interest-sport-on")).toBeTruthy();

    fireEvent.press(screen.getByText("Sport"));

    await waitFor(() => {
      expect(screen.getByTestId("interest-sport-off")).toBeTruthy();
    });
    expect(screen.getByText("Football")).toBeTruthy();
  });

  it("keeps revealed children when another parent is opened", async () => {
    render(
      <StatefulPicker
        initialKeys={[]}
        options={[
          { label: "Littérature", icon: "※", iconKey: "culture" },
          { label: "Sport", icon: "※", iconKey: "culture" },
        ]}
        treeNodes={[
          { _id: literatureId, label: "Littérature", iconKey: "culture", depth: 1 },
          { _id: romanId, label: "Roman", iconKey: "culture", parentId: literatureId, depth: 2 },
          { _id: sportId, label: "Sport", iconKey: "culture", depth: 1 },
          {
            _id: footballId,
            label: "Football",
            iconKey: "culture",
            parentId: sportId,
            depth: 2,
          },
          {
            _id: beachId,
            label: "Beach soccer",
            iconKey: "culture",
            parentId: sportId,
            depth: 2,
          },
        ]}
      />,
    );

    fireEvent.press(screen.getByText("Sport"));
    await waitFor(() => {
      expect(screen.getByText("Football")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Littérature"));
    await waitFor(() => {
      expect(screen.getByText("Roman")).toBeTruthy();
    });
    expect(screen.getByText("Football")).toBeTruthy();
  });

  it("toggles a leaf category on tap", async () => {
    render(
      <StatefulPicker
        initialKeys={["litterature"]}
        options={[{ label: "Roman", icon: "※", iconKey: "culture" }]}
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

    fireEvent.press(screen.getByText("Roman"));

    await waitFor(() => {
      expect(screen.getByTestId("interest-roman-on")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Roman"));

    await waitFor(() => {
      expect(screen.getByTestId("interest-roman-off")).toBeTruthy();
    });
  });
});
