import { isCategoryIconKey } from "../src/features/categories/category-icon-catalog";
import type { EnabledModule } from "../src/features/tenant/public-config";
import { ENABLED_MODULES, isEnabledModule } from "../src/features/tenant/public-config";

export type AccessLevel = "free" | "member" | "premium";

export type FeatureNature = "navTab" | "content" | "capability";

export type FeatureKey = EnabledModule;

export const NAV_TAB_CAP = 5;

export const CORE_NAV_TAB_KEYS = ["home", "profile"] as const;

/** L'univers des tables de navigation ; le tenant en active au plus NAV_TAB_CAP. */
export const NAV_TAB_KEYS = [
  "home",
  "discover",
  "explore",
  "agenda",
  "community",
  "collections",
  "library",
  "profile",
] as const;

export type NavTabKey = (typeof NAV_TAB_KEYS)[number];

export const DEFAULT_NAV_ORDER = [...NAV_TAB_KEYS] as const;

export type FeatureDefinition = {
  key: FeatureKey;
  label: string;
  desc: string;
  nature: FeatureNature;
  group: string;
  core?: boolean;
  defaultEnabled?: boolean;
  /** navTab only: in the bottom bar by default (core nav tabs are always in). */
  defaultInBar?: boolean;
  lockAccess?: boolean;
  defaultAccess: AccessLevel;
  defaultIconKey: string;
};

export type TenantFeatureConfig = {
  /** Surface available/reachable at all (route + Explore card). */
  enabled: boolean;
  /** navTab only: promoted to the bottom tab bar (subject to NAV_TAB_CAP). */
  inBar: boolean;
  access: AccessLevel;
  iconKey: string;
};

export type TenantFeatureConfigInput = {
  enabled?: boolean;
  inBar?: boolean;
  access?: AccessLevel;
  iconKey?: string;
};

const FEATURE_DEFINITIONS: FeatureDefinition[] = [
  {
    key: "home",
    label: "Accueil",
    desc: "Table d'accueil et fil principal.",
    nature: "navTab",
    group: "Tables",
    core: true,
    defaultAccess: "free",
    defaultIconKey: "news",
  },
  {
    key: "profile",
    label: "Profil",
    desc: "Compte, paramètres et préférences.",
    nature: "navTab",
    group: "Tables",
    core: true,
    defaultAccess: "free",
    defaultIconKey: "default",
  },
  {
    key: "discover",
    label: "Découverte",
    desc: "Fil personnalisé et recommandations.",
    nature: "navTab",
    group: "Tables",
    defaultInBar: true,
    defaultAccess: "free",
    defaultIconKey: "news",
  },
  {
    key: "explore",
    label: "Explorer",
    desc: "Recherche et exploration de contenus.",
    nature: "navTab",
    group: "Tables",
    defaultInBar: true,
    defaultAccess: "free",
    defaultIconKey: "default",
  },
  {
    key: "library",
    label: "Bibliothèque",
    desc: "Contenus sauvegardés et listes personnelles.",
    nature: "navTab",
    group: "Tables",
    defaultInBar: true,
    defaultAccess: "free",
    defaultIconKey: "library",
  },
  {
    key: "collections",
    label: "Collections",
    desc: "Séries éditoriales et parcours thématiques.",
    nature: "navTab",
    group: "Tables",
    defaultAccess: "free",
    defaultIconKey: "collections",
  },
  {
    key: "agenda",
    label: "Agenda",
    desc: "Événements live, replays et inscriptions.",
    nature: "navTab",
    group: "Tables",
    defaultAccess: "free",
    defaultIconKey: "agenda",
  },
  {
    key: "community",
    label: "Communauté",
    desc: "Liens communautaires et salon membres.",
    nature: "navTab",
    group: "Tables",
    defaultAccess: "member",
    defaultIconKey: "community",
  },
  {
    key: "articles",
    label: "Articles",
    desc: "Lecture longue, analyses et actualités.",
    nature: "content",
    group: "Contenu",
    core: true,
    defaultAccess: "free",
    defaultIconKey: "analyses",
  },
  {
    key: "episodes",
    label: "Podcasts",
    desc: "Épisodes audio et flux podcast.",
    nature: "content",
    group: "Contenu",
    defaultAccess: "free",
    defaultIconKey: "podcasts",
  },
  {
    key: "videos",
    label: "Vidéos",
    desc: "Formats vidéo hébergés ou YouTube.",
    nature: "content",
    group: "Contenu",
    defaultAccess: "free",
    defaultIconKey: "videos",
  },
  {
    key: "premium",
    label: "Premium",
    desc: "Contenus et surfaces réservés aux abonnés.",
    nature: "content",
    group: "Contenu",
    lockAccess: true,
    defaultAccess: "premium",
    defaultIconKey: "debate",
  },
  {
    key: "bookmarks",
    label: "Favoris",
    desc: "Sauvegarde de contenus pour les membres.",
    nature: "capability",
    group: "Capacités membres",
    defaultAccess: "member",
    defaultIconKey: "library",
  },
  {
    key: "progressSync",
    label: "Progression",
    desc: "Reprise de lecture et synchronisation.",
    nature: "capability",
    group: "Capacités membres",
    defaultAccess: "member",
    defaultIconKey: "default",
  },
  {
    key: "offline",
    label: "Mode hors-ligne",
    desc: "Téléchargements pour consultation offline.",
    nature: "capability",
    group: "Capacités membres",
    defaultAccess: "premium",
    defaultIconKey: "library",
  },
  {
    key: "personalLists",
    label: "Listes",
    desc: "Listes personnelles de contenus.",
    nature: "capability",
    group: "Capacités membres",
    defaultAccess: "member",
    defaultIconKey: "library",
  },
  {
    key: "membersRoom",
    label: "Salon membres",
    desc: "Espace réservé aux membres connectés.",
    nature: "capability",
    group: "Capacités membres",
    defaultAccess: "member",
    defaultIconKey: "community",
  },
  {
    key: "premiumInsights",
    label: "Ta lecture du jour",
    desc: "Analyse de goûts premium quotidienne + sélection connexe.",
    nature: "capability",
    group: "Capacités membres",
    lockAccess: true,
    defaultAccess: "premium",
    defaultIconKey: "analyses",
  },
];

const FEATURE_BY_KEY = Object.fromEntries(
  FEATURE_DEFINITIONS.map((feature) => [feature.key, feature]),
) as Record<FeatureKey, FeatureDefinition>;

export const FEATURE_CATALOG = FEATURE_DEFINITIONS;

export const FEATURE_CATALOG_GROUPS = FEATURE_DEFINITIONS.reduce<
  Array<{ group: string; features: FeatureDefinition[] }>
>((groups, feature) => {
  const existing = groups.find((entry) => entry.group === feature.group);
  if (existing) {
    existing.features.push(feature);
    return groups;
  }

  groups.push({ group: feature.group, features: [feature] });
  return groups;
}, []);

export function getFeatureDefinition(key: string): FeatureDefinition | undefined {
  return isEnabledModule(key) ? FEATURE_BY_KEY[key] : undefined;
}

export function isNavTabKey(key: string): boolean {
  return getFeatureDefinition(key)?.nature === "navTab";
}

export function getNavTabKeys(): NavTabKey[] {
  return [...NAV_TAB_KEYS];
}

export function assertFeatureIconKey(iconKey: string) {
  if (!isCategoryIconKey(iconKey)) {
    throw new Error(`Unknown feature icon key: ${iconKey}`);
  }
}

function defaultEnabledForFeature(feature: FeatureDefinition): boolean {
  if (feature.core) {
    return true;
  }

  // Two-level model: a feature is available (reachable + Explore) by default.
  return feature.defaultEnabled ?? true;
}

function defaultInBarForFeature(feature: FeatureDefinition): boolean {
  if (feature.nature !== "navTab") {
    return false;
  }
  if (feature.core) {
    return true;
  }
  return feature.defaultInBar ?? false;
}

function defaultConfigForFeature(feature: FeatureDefinition): TenantFeatureConfig {
  return {
    enabled: defaultEnabledForFeature(feature),
    inBar: defaultInBarForFeature(feature),
    access: feature.defaultAccess,
    iconKey: feature.defaultIconKey,
  };
}

export function buildDefaultFeatureConfigs(): Record<FeatureKey, TenantFeatureConfig> {
  return Object.fromEntries(
    FEATURE_DEFINITIONS.map((feature) => [
      feature.key,
      defaultConfigForFeature(feature),
    ]),
  ) as Record<FeatureKey, TenantFeatureConfig>;
}

export function buildDefaultNavOrder(): string[] {
  return [...DEFAULT_NAV_ORDER];
}

export function normalizeNavOrder(navOrder: readonly string[] | undefined): string[] {
  const validKeys = new Set<string>(NAV_TAB_KEYS);
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const key of navOrder ?? DEFAULT_NAV_ORDER) {
    if (validKeys.has(key) && !seen.has(key)) {
      normalized.push(key);
      seen.add(key);
    }
  }

  for (const key of DEFAULT_NAV_ORDER) {
    if (!seen.has(key)) {
      normalized.push(key);
      seen.add(key);
    }
  }

  return normalized;
}

/** Nav tabs promoted to the bottom bar (enabled AND inBar). The cap applies here. */
export function countNavTabsInBar(
  featureConfigs: Record<FeatureKey, TenantFeatureConfig>,
): number {
  return FEATURE_DEFINITIONS.filter(
    (feature) =>
      feature.nature === "navTab" &&
      featureConfigs[feature.key]?.enabled &&
      featureConfigs[feature.key]?.inBar,
  ).length;
}

export function clampNavTabsInConfigs(
  featureConfigs: Record<FeatureKey, TenantFeatureConfig>,
  navOrder?: readonly string[],
): Record<FeatureKey, TenantFeatureConfig> {
  const order = normalizeNavOrder(navOrder);
  const keep = new Set<FeatureKey>([...CORE_NAV_TAB_KEYS]);

  for (const key of order) {
    if (keep.size >= NAV_TAB_CAP) {
      break;
    }
    const featureKey = key as FeatureKey;
    if (featureConfigs[featureKey]?.enabled && featureConfigs[featureKey]?.inBar) {
      keep.add(featureKey);
    }
  }

  for (const key of NAV_TAB_KEYS) {
    if (keep.size >= NAV_TAB_CAP) {
      break;
    }
    if (featureConfigs[key]?.enabled && featureConfigs[key]?.inBar) {
      keep.add(key);
    }
  }

  // The cap applies to bar membership (inBar), never to availability (enabled).
  const next = { ...featureConfigs };
  for (const key of NAV_TAB_KEYS) {
    next[key] = { ...next[key], inBar: keep.has(key) };
  }

  return next;
}

export function assertNavTabCap(featureConfigs: Record<FeatureKey, TenantFeatureConfig>) {
  const count = countNavTabsInBar(featureConfigs);
  if (count > NAV_TAB_CAP) {
    throw new Error(
      `Too many navigation tabs in the bar (${count}). Maximum is ${NAV_TAB_CAP}.`,
    );
  }
}

export function resolveEffectiveNavigation(
  featureConfigs: Record<FeatureKey, TenantFeatureConfig>,
  navOrder?: readonly string[],
): NavTabKey[] {
  const order = normalizeNavOrder(navOrder);

  const barNavTabs = new Set<NavTabKey>(
    FEATURE_DEFINITIONS.filter(
      (feature) =>
        feature.nature === "navTab" &&
        featureConfigs[feature.key]?.enabled &&
        featureConfigs[feature.key]?.inBar,
    ).map((feature) => feature.key as NavTabKey),
  );

  for (const coreKey of CORE_NAV_TAB_KEYS) {
    barNavTabs.add(coreKey);
  }

  const result: NavTabKey[] = [];
  for (const key of order) {
    const featureKey = key as NavTabKey;
    if (barNavTabs.has(featureKey) && !result.includes(featureKey)) {
      result.push(featureKey);
    }
  }

  for (const key of barNavTabs) {
    if (!result.includes(key)) {
      result.push(key);
    }
  }

  return result.slice(0, NAV_TAB_CAP);
}

function migrateLegacyEnabledModules(
  enabledModules: readonly string[] | undefined,
): Record<string, TenantFeatureConfigInput> {
  const enabledSet = new Set(enabledModules ?? []);

  return Object.fromEntries(
    FEATURE_DEFINITIONS.map((feature) => [
      feature.key,
      {
        enabled: feature.core ? true : enabledSet.has(feature.key),
        inBar: defaultInBarForFeature(feature),
        access: feature.defaultAccess,
        iconKey: feature.defaultIconKey,
      },
    ]),
  );
}

export function normalizeFeatureConfigs(
  input: Record<string, TenantFeatureConfigInput> | undefined,
  legacyEnabledModules?: readonly string[],
  navOrder?: readonly string[],
): Record<FeatureKey, TenantFeatureConfig> {
  const source = input ?? migrateLegacyEnabledModules(legacyEnabledModules);
  const normalized = buildDefaultFeatureConfigs();

  for (const feature of FEATURE_DEFINITIONS) {
    const patch = source[feature.key];
    const base = defaultConfigForFeature(feature);

    const enabled = feature.core ? true : (patch?.enabled ?? base.enabled);
    const access = feature.lockAccess
      ? feature.defaultAccess
      : (patch?.access ?? base.access);
    const iconKey = patch?.iconKey ?? base.iconKey;
    const inBar =
      feature.nature !== "navTab"
        ? false
        : feature.core
          ? true
          : enabled && (patch?.inBar ?? base.inBar);

    assertFeatureIconKey(iconKey);

    normalized[feature.key] = {
      enabled,
      inBar,
      access,
      iconKey,
    };
  }

  return clampNavTabsInConfigs(normalized, navOrder);
}

export function resolveEffectiveFeatureConfigs(args: {
  featureConfigs?: Record<string, TenantFeatureConfigInput>;
  enabledModules?: readonly string[];
  navOrder?: readonly string[];
}): Record<FeatureKey, TenantFeatureConfig> {
  return normalizeFeatureConfigs(args.featureConfigs, args.enabledModules, args.navOrder);
}

export function deriveEnabledModules(
  featureConfigs: Record<FeatureKey, TenantFeatureConfig>,
): EnabledModule[] {
  return ENABLED_MODULES.filter((key) => featureConfigs[key]?.enabled === true);
}

export function getFeatureIconGlyph(
  featureConfigs: Record<FeatureKey, TenantFeatureConfig>,
  key: FeatureKey,
): string {
  const iconKey = featureConfigs[key]?.iconKey;
  if (iconKey && isCategoryIconKey(iconKey)) {
    return iconKey;
  }

  return FEATURE_BY_KEY[key]?.defaultIconKey ?? "default";
}
