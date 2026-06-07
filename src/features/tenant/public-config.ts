import { isContentVisible } from "../../../convex/discovery/visibility";
import type { ContentDoc, ContentKind } from "../content/types";

export type CommunityLinkKind = "discord" | "telegram" | "whatsapp" | "newsletter";

export type CommunityLink = {
  kind: CommunityLinkKind;
  url: string;
  label?: string;
};

// ─── Content modules ─────────────────────────────────────────────────────────

export const PUBLIC_CONTENT_MODULES = ["articles", "episodes", "videos"] as const;
export const OPTIONAL_PUBLIC_MODULES = ["premium"] as const;

export type ContentModule = (typeof PUBLIC_CONTENT_MODULES)[number];

// ─── Navigation modules ───────────────────────────────────────────────────────

export const NAVIGATION_MODULES = [
  "discover",
  "collections",
  "agenda",
  "community",
] as const;
export type NavigationModule = (typeof NAVIGATION_MODULES)[number];

/**
 * Strict allowlist: a navigation module is enabled iff it is present in the
 * tenant's `enabledModules`. Out-of-the-box defaults come from
 * `defaultTenant.enabledModules`, NOT from a "default-on when unconfigured"
 * heuristic — that heuristic resurrected every module when the last one was
 * unchecked, and left never-activated modules visible.
 */
export function isModuleEnabled(
  modules: readonly string[],
  name: NavigationModule,
): boolean {
  return modules.includes(name);
}

// ─── Capabilities ─────────────────────────────────────────────────────────────

export const CAPABILITIES = [
  "bookmarks",
  "progressSync",
  "offline",
  "personalLists",
  "membersRoom",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

/** Strict allowlist, like {@link isModuleEnabled}: a capability is on iff listed. */
export function hasCapability(modules: readonly string[], cap: Capability): boolean {
  return modules.includes(cap);
}

// ─── Full module vocabulary ───────────────────────────────────────────────────

export const ENABLED_MODULES = [
  ...PUBLIC_CONTENT_MODULES,
  ...OPTIONAL_PUBLIC_MODULES,
  ...NAVIGATION_MODULES,
  ...CAPABILITIES,
] as const;

export type EnabledModule = (typeof ENABLED_MODULES)[number];

export type FeedSectionConfig = {
  kind: ContentKind;
  title: string;
  visible?: boolean;
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

const CONTENT_KIND_MODULES: Record<ContentKind, ContentModule> = {
  article: "articles",
  episode: "episodes",
  video: "videos",
};

const CONTENT_MODULE_SET = new Set<string>(PUBLIC_CONTENT_MODULES);

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

  return (modules ?? []).filter(isEnabledModule);
}

export function isFeedSectionVisible(section: FeedSectionConfig): boolean {
  return section.visible !== false;
}

export function normalizeFeedSections(
  sections: readonly FeedSectionConfig[] | undefined,
  enabledModules: readonly EnabledModule[],
): FeedSectionConfig[] {
  const enabledKinds = new Set(
    enabledModules
      .filter((module): module is ContentModule => CONTENT_MODULE_SET.has(module))
      .map(moduleToContentKind),
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

export function getVisibleFeedSections(
  sections: readonly FeedSectionConfig[] | undefined,
  enabledModules: readonly EnabledModule[],
): FeedSectionConfig[] {
  const enabledKinds = new Set(
    enabledModules
      .filter((module): module is ContentModule => CONTENT_MODULE_SET.has(module))
      .map(moduleToContentKind),
  );

  const source = sections ?? DEFAULT_FEED_SECTIONS;
  const seenKinds = new Set<ContentKind>();

  return source.filter((section) => {
    if (
      !enabledKinds.has(section.kind) ||
      seenKinds.has(section.kind) ||
      !isFeedSectionVisible(section)
    ) {
      return false;
    }

    seenKinds.add(section.kind);
    return true;
  });
}

export function moduleToContentKind(module: ContentModule): ContentKind {
  return module === "articles" ? "article" : module === "episodes" ? "episode" : "video";
}

export function contentKindToModule(kind: ContentKind): ContentModule {
  return CONTENT_KIND_MODULES[kind];
}

export function groupFeedContentBySection(
  contents: readonly ContentDoc[],
  enabledModules: readonly EnabledModule[],
  sections: readonly FeedSectionConfig[],
): Array<{ section: FeedSectionConfig; items: ContentDoc[] }> {
  const visibleSections = getVisibleFeedSections(sections, enabledModules);

  return visibleSections.map((section) => ({
    section,
    items: [...contents]
      .filter((content) => content.kind === section.kind)
      .filter((content) => isContentVisible(content, enabledModules))
      .sort((left, right) => {
        const leftPublishedAt = left.publishedAt ? Date.parse(left.publishedAt) : 0;
        const rightPublishedAt = right.publishedAt ? Date.parse(right.publishedAt) : 0;
        return rightPublishedAt - leftPublishedAt;
      }),
  }));
}

export function filterAndOrderFeedContent(
  contents: readonly ContentDoc[],
  enabledModules: readonly EnabledModule[],
  sections: readonly FeedSectionConfig[],
): ContentDoc[] {
  const normalizedSections = getVisibleFeedSections(sections, enabledModules);
  const sectionOrder = new Map(
    normalizedSections.map((section, index) => [section.kind, index]),
  );

  return [...contents]
    .filter((content) => sectionOrder.has(content.kind))
    .filter((content) => isContentVisible(content, enabledModules))
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
