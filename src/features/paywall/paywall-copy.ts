export type PaywallReason = "content" | "offline" | "lists" | "members" | "support";

export type PaywallCopyKeys = {
  eyebrow: string;
  title: string;
  description: string;
};

export function resolvePaywallCopyKeys(reason: unknown): PaywallCopyKeys {
  const knownReasons: PaywallReason[] = ["content", "offline", "lists", "members", "support"];
  const resolved: PaywallReason = knownReasons.includes(reason as PaywallReason)
    ? (reason as PaywallReason)
    : "support";

  return {
    eyebrow: `reasons.${resolved}.eyebrow`,
    title: `reasons.${resolved}.title`,
    description: `reasons.${resolved}.description`,
  };
}
