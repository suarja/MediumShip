import { useWindowDimensions } from "react-native";

/**
 * Responsive primitives for phone + iPad, adapted from the proven
 * `../editia/mobile` `useResponsiveSpacing` hook. iPad responsiveness is a
 * first-pass requirement, not later polish.
 *
 * - `isTablet`  — width >= 768pt (standard iPad threshold)
 * - `scaleSpace` — multiplier for spacing/dimensions on tablet
 * - `scaleFont`  — multiplier for type on tablet (bigger, the screen is large)
 * - `contentMaxWidth` — readable column cap on tablet, undefined on phone
 */
export function useResponsive() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return {
    isTablet,
    scaleSpace: isTablet ? 1.4 : 1,
    scaleFont: isTablet ? 1.3 : 1,
    contentMaxWidth: isTablet ? 760 : undefined,
  };
}
