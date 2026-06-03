import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { ContentDetailShell } from "../src/components/content/content-detail-shell";
import { changeAppLanguage, initI18n } from "../src/i18n";

jest.mock("expo-router", () => ({
  Link: ({
    asChild,
    children,
  }: {
    asChild?: boolean;
    children: ReactElement<{ style?: unknown }>;
  }) => {
    if (asChild && Array.isArray(children.props.style)) {
      throw new Error(
        "[expo-router]: You are passing an array of styles to a child of <Slot>.",
      );
    }

    return children;
  },
}));

describe("ContentDetailShell", () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(async () => {
    await changeAppLanguage("en");
  });

  it("does not pass an array style to the direct Link child", () => {
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
