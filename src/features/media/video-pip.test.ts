import { resolvePipStopAction } from "./video-pip";

describe("resolvePipStopAction", () => {
  it("ignores our own programmatic stop (returning to the player)", () => {
    expect(resolvePipStopAction({ stopWasProgrammatic: true })).toBe("ignore");
  });

  it("returns to the player on any user-initiated stop (restore or close)", () => {
    expect(resolvePipStopAction({ stopWasProgrammatic: false })).toBe(
      "go-to-player",
    );
  });
});
