import { useWindowDimensions } from "react-native";

/**
 * Responsive primitives for phone + iPad, adapted from the proven
 * `../editia/mobile` `useResponsiveSpacing` hook. iPad responsiveness is a
 * first-pass requirement, not later polish.
 *
 * - `isTablet`  — width >= 768pt (standard iPad threshold)
 * - `scaleSpace` — multiplier for spacing/dimensions (1.5x on tablet)
 * - `scaleFont`  — gentler multiplier for type (1.2x on tablet)
 * - `contentMaxWidth` — readable column cap on tablet, undefined on phone
 */
export function useResponsive() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return {
    isTablet,
    scaleSpace: isTablet ? 1.5 : 1,
    scaleFont: isTablet ? 1.2 : 1,
    contentMaxWidth: isTablet ? 680 : undefined,
  };
}
