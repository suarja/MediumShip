/** Profile / list preview — overview only (single narrative block). */
export function briefingPreviewText(analysis: {
  tasteText: string;
}): string {
  return analysis.tasteText.trim();
}
