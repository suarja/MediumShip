import type { ContentDoc, ContentKind } from "../content/types";

export type CommunityLinkKind = "discord" | "telegram" | "whatsapp" | "newsletter";

export type CommunityLink = {
  kind: CommunityLinkKind;
  url: string;
  label?: string;
};

export const PUBLIC_CONTENT_MODULES = ["articles", "episodes", "videos"] as const;
export const OPTIONAL_PUBLIC_MODULES = ["premium"] as const;
export const ENABLED_MODULES = [
  ...PUBLIC_CONTENT_MODULES,
  ...OPTIONAL_PUBLIC_MODULES,
] as const;

export type EnabledModule = (typeof ENABLED_MODULES)[number];

export type FeedSectionConfig = {
  kind: ContentKind;
  title: string;
};

export const DEFAULT_FEED_SECTIONS: FeedSectionConfig[] = [
  { kind: "article", title: "Latest stories" },
  { kind: "episode", title: "New episodes" },
  { kind: "video", title: "Watch now" },
];

const DEFAULT_FEED_SECTION_TITLES: Record<ContentKind, string> = {
  article: "Latest stories",
  episode: "New episodes",
  video: "Watch now",
};

const CONTENT_KIND_MODULES: Record<ContentKind, EnabledModule> = {
  article: "articles",
  episode: "episodes",
  video: "videos",
};

export function isEnabledModule(value: string): value is EnabledModule {
  return (ENABLED_MODULES as readonly string[]).includes(value);
}

export function createDefaultFeedSection(kind: ContentKind): FeedSectionConfig {
  return {
    kind,
    title: DEFAULT_FEED_SECTION_TITLES[kind],
  };
}

export function normalizeEnabledModules(
  modules: readonly string[] | undefined,
): EnabledModule[] {
  if (modules === undefined) {
    return [...PUBLIC_CONTENT_MODULES, ...OPTIONAL_PUBLIC_MODULES];
  }

  const normalized = (modules ?? []).filter(isEnabledModule);

  return normalized;
}

export function normalizeFeedSections(
  sections: readonly FeedSectionConfig[] | undefined,
  enabledModules: readonly EnabledModule[],
): FeedSectionConfig[] {
  const enabledKinds = new Set(
    enabledModules
      .filter((module) => module !== "premium")
      .map((module) => moduleToContentKind(module)),
  );

  if (sections !== undefined) {
    const seenKinds = new Set<ContentKind>();

    return sections.filter((section) => {
      if (!enabledKinds.has(section.kind) || seenKinds.has(section.kind)) {
        return false;
      }

      seenKinds.add(section.kind);
      return true;
    });
  }

  return DEFAULT_FEED_SECTIONS.filter((section) => enabledKinds.has(section.kind));
}

export function moduleToContentKind(
  module: Exclude<EnabledModule, "premium">,
): ContentKind {
  return module === "articles"
    ? "article"
    : module === "episodes"
      ? "episode"
      : "video";
}

export function contentKindToModule(kind: ContentKind): EnabledModule {
  return CONTENT_KIND_MODULES[kind];
}

export function filterAndOrderFeedContent(
  contents: readonly ContentDoc[],
  enabledModules: readonly EnabledModule[],
  sections: readonly FeedSectionConfig[],
): ContentDoc[] {
  const normalizedSections = normalizeFeedSections(sections, enabledModules);
  const sectionOrder = new Map(
    normalizedSections.map((section, index) => [section.kind, index]),
  );

  return [...contents]
    .filter((content) => sectionOrder.has(content.kind))
    .filter((content) => enabledModules.includes("premium") || !content.isPremium)
    .sort((left, right) => {
      const leftOrder = sectionOrder.get(left.kind) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = sectionOrder.get(right.kind) ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      const leftPublishedAt = left.publishedAt ? Date.parse(left.publishedAt) : 0;
      const rightPublishedAt = right.publishedAt ? Date.parse(right.publishedAt) : 0;

      return rightPublishedAt - leftPublishedAt;
    });
}
