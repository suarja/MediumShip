export type VisibleContent = {
  isPremium: boolean;
};

/** Shared premium gate for editorial and discovery feeds. */
export function isContentVisible(
  content: VisibleContent,
  enabledModules: readonly string[],
): boolean {
  if (!content.isPremium) {
    return true;
  }

  return enabledModules.includes("premium");
}
