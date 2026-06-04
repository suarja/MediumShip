// Pure premium-gate decision — no React, no Convex — so the unlock rule is
// unit-testable and identical across every detail screen (article, episode,
// video, player). Mobile stays guest-first: a guest is simply a non-member,
// which resolves to the paywall for premium content.

export type PremiumGateState =
  // Content is freely readable: either it is not premium, or the viewer is a
  // member.
  | "open"
  // Premium content, viewer is not a member → show the themed paywall.
  | "locked";

export function resolvePremiumGate(args: {
  isPremium: boolean;
  isMember: boolean;
}): PremiumGateState {
  if (!args.isPremium) {
    return "open";
  }

  return args.isMember ? "open" : "locked";
}
