import { render, screen } from "@testing-library/react-native";

import { ContentImageScrim } from "../src/components/content/content-image-scrim";

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    theme: {
      isDark: false,
      colors: {
        heading: "#1A1A1A",
      },
    },
  }),
}));

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    LinearGradient: ({
      children,
      testID,
    }: {
      children?: React.ReactNode;
      testID?: string;
    }) => React.createElement(View, { testID }, children),
  };
});

describe("ContentImageScrim", () => {
  it("renders the shared scrim overlay", () => {
    render(<ContentImageScrim />);

    expect(screen.getByTestId("content-image-scrim")).toBeTruthy();
  });

  it("renders with strong strength variant", () => {
    render(<ContentImageScrim strength="strong" />);

    expect(screen.getByTestId("content-image-scrim")).toBeTruthy();
    expect(screen.getByTestId("content-image-scrim")).toHaveProp("data-strength", "strong");
  });
});
