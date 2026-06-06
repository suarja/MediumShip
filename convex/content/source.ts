export type ContentSource = "cms" | "wikipedia";

export function resolveContentSource(content: {
  source?: ContentSource;
}): ContentSource {
  return content.source ?? "cms";
}

export function isEditorialContent(content: { source?: ContentSource }): boolean {
  return resolveContentSource(content) !== "wikipedia";
}
