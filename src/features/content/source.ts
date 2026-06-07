export type ContentSource = "cms" | "wikipedia" | "rss";

export function resolveContentSource(content: {
  source?: ContentSource;
}): ContentSource {
  return content.source ?? "cms";
}

export function isExternalDiscoverySource(content: {
  source?: ContentSource;
}): boolean {
  return resolveContentSource(content) !== "cms";
}
