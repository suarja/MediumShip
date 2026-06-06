import { render, screen } from "@testing-library/react-native";

import { DetailHero } from "../src/components/content/detail-hero";

jest.mock("../src/features/theme/theme-provider", () => ({
  useAppTheme: () => ({
    theme: {
      isDark: false,
      colors: {
        canvas: "#F4F1E8",
        canvasAccent: "#E8E4DA",
        heading: "#1A1A1A",
        accent: "#C97349",
        premium: "#C8964A",
      },
    },
  }),
}));

jest.mock("../src/features/responsive/use-responsive", () => ({
  useResponsive: () => ({
    scaleFont: (value: number) => value,
    scaleSpace: (value: number) => value,
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

describe("DetailHero", () => {
  it("adds a subtle top scrim when a premium badge sits on a cover image", () => {
    render(
      <DetailHero
        coverImageUrl="https://example.com/cover.jpg"
        watermarkGlyph="✎"
        height={200}
        premiumLabel="Premium"
      />,
    );

    expect(screen.getByLabelText("cover")).toBeTruthy();
    expect(screen.getByText("★ Premium")).toBeTruthy();
    expect(screen.getByTestId("content-image-scrim")).toHaveProp("data-edge", "top");
    expect(screen.getByTestId("content-image-scrim")).toHaveProp("data-strength", "subtle");
  });

  it("skips overlay scrims when the hero falls back to the watermark treatment", () => {
    render(
      <DetailHero
        watermarkGlyph="✎"
        height={200}
        premiumLabel="Premium"
      />,
    );

    expect(screen.queryByTestId("content-image-scrim")).toBeNull();
  });
});
