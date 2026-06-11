export type PaywallReason = "content" | "offline" | "lists" | "members" | "support";

export type PaywallOpenOptions = {
  /** Faded context line above the sheet (mockup `sheet-bg`). */
  previewTitle?: string;
  previewEyebrow?: string;
};

export type PaywallCopyKeys = {
  eyebrow: string;
  title: string;
  titleItalic: string;
  description: string;
  dismissCta: string;
};

export function resolvePaywallReason(reason: unknown): PaywallReason {
  const knownReasons: PaywallReason[] = ["content", "offline", "lists", "members", "support"];
  return knownReasons.includes(reason as PaywallReason) ? (reason as PaywallReason) : "support";
}

export function resolvePaywallCopyKeys(reason: unknown): PaywallCopyKeys {
  const resolved = resolvePaywallReason(reason);

  return {
    eyebrow: `reasons.${resolved}.eyebrow`,
    title: `reasons.${resolved}.title`,
    titleItalic: `reasons.${resolved}.titleItalic`,
    description: `reasons.${resolved}.description`,
    dismissCta: `reasons.${resolved}.dismissCta`,
  };
}
