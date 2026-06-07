import { isCategoryIconKey } from "../src/features/categories/category-icon-catalog";
import type { EnabledModule } from "../src/features/tenant/public-config";
import { ENABLED_MODULES, isEnabledModule } from "../src/features/tenant/public-config";

export type AccessLevel = "free" | "member" | "premium";

export type FeatureNature = "navTab" | "content" | "capability";

export type FeatureKey = EnabledModule;

export const NAV_TAB_CAP = 5;

export const CORE_NAV_TAB_KEYS = ["home", "profile"] as const;

export const DEFAULT_NAV_ORDER = [
  "home",
  "discover",
  "explore",
  "library",
  "profile",
] as const;

export type FeatureDefinition = {
  key: FeatureKey;
  label: string;
  desc: string;
  nature: FeatureNature;
  group: string;
  core?: boolean;
  defaultEnabled?: boolean;
  lockAccess?: boolean;
  defaultAccess: AccessLevel;
  defaultIconKey: string;
};

export type TenantFeatureConfig = {
  enabled: boolean;
  access: AccessLevel;
  iconKey: string;
};

export type TenantFeatureConfigInput = {
  enabled?: boolean;
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
    defaultEnabled: true,
    defaultAccess: "free",
    defaultIconKey: "news",
  },
  {
    key: "explore",
    label: "Explorer",
    desc: "Recherche et exploration de contenus.",
    nature: "navTab",
    group: "Tables",
    defaultEnabled: true,
    defaultAccess: "free",
    defaultIconKey: "default",
  },
  {
    key: "library",
    label: "Bibliothèque",
    desc: "Contenus sauvegardés et listes personnelles.",
    nature: "navTab",
    group: "Tables",
    defaultEnabled: true,
    defaultAccess: "free",
    defaultIconKey: "library",
  },
  {
    key: "collections",
    label: "Collections",
    desc: "Séries éditoriales et parcours thématiques.",
    nature: "navTab",
    group: "Tables",
    defaultEnabled: false,
    defaultAccess: "free",
    defaultIconKey: "collections",
  },
  {
    key: "agenda",
    label: "Agenda",
    desc: "Événements live, replays et inscriptions.",
    nature: "navTab",
    group: "Tables",
    defaultEnabled: false,
    defaultAccess: "free",
    defaultIconKey: "agenda",
  },
  {
    key: "community",
    label: "Communauté",
    desc: "Liens communautaires et salon membres.",
    nature: "navTab",
    group: "Tables",
    defaultEnabled: false,
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

export function getNavTabKeys(): FeatureKey[] {
  return FEATURE_DEFINITIONS.filter((feature) => feature.nature === "navTab").map(
    (feature) => feature.key,
  );
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

  if (feature.defaultEnabled !== undefined) {
    return feature.defaultEnabled;
  }

  return feature.nature !== "navTab";
}

function defaultConfigForFeature(feature: FeatureDefinition): TenantFeatureConfig {
  return {
    enabled: defaultEnabledForFeature(feature),
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
  const validKeys = new Set(getNavTabKeys());
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const key of navOrder ?? DEFAULT_NAV_ORDER) {
    if (validKeys.has(key as FeatureKey) && !seen.has(key)) {
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

  const homeIndex = normalized.indexOf("home");
  if (homeIndex > 0) {
    normalized.splice(homeIndex, 1);
    normalized.unshift("home");
  }

  return normalized;
}

export function countEnabledNavTabs(
  featureConfigs: Record<FeatureKey, TenantFeatureConfig>,
): number {
  return FEATURE_DEFINITIONS.filter(
    (feature) => feature.nature === "navTab" && featureConfigs[feature.key]?.enabled,
  ).length;
}

export function assertNavTabCap(featureConfigs: Record<FeatureKey, TenantFeatureConfig>) {
  const count = countEnabledNavTabs(featureConfigs);
  if (count > NAV_TAB_CAP) {
    throw new Error(
      `Too many navigation tabs enabled (${count}). Maximum is ${NAV_TAB_CAP}.`,
    );
  }
}

export function resolveEffectiveNavigation(
  featureConfigs: Record<FeatureKey, TenantFeatureConfig>,
  navOrder?: readonly string[],
): FeatureKey[] {
  const order = normalizeNavOrder(navOrder);

  const enabledNavTabs = new Set<FeatureKey>(
    FEATURE_DEFINITIONS.filter(
      (feature) => feature.nature === "navTab" && featureConfigs[feature.key]?.enabled,
    ).map((feature) => feature.key),
  );

  for (const coreKey of CORE_NAV_TAB_KEYS) {
    enabledNavTabs.add(coreKey);
  }

  const result: FeatureKey[] = [];
  for (const key of order) {
    const featureKey = key as FeatureKey;
    if (enabledNavTabs.has(featureKey) && !result.includes(featureKey)) {
      result.push(featureKey);
    }
  }

  for (const key of enabledNavTabs) {
    if (!result.includes(key)) {
      result.push(key);
    }
  }

  const homeIndex = result.indexOf("home");
  if (homeIndex > 0) {
    result.splice(homeIndex, 1);
    result.unshift("home");
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
        access: feature.defaultAccess,
        iconKey: feature.defaultIconKey,
      },
    ]),
  );
}

export function normalizeFeatureConfigs(
  input: Record<string, TenantFeatureConfigInput> | undefined,
  legacyEnabledModules?: readonly string[],
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

    assertFeatureIconKey(iconKey);

    normalized[feature.key] = {
      enabled,
      access,
      iconKey,
    };
  }

  return normalized;
}

export function resolveEffectiveFeatureConfigs(args: {
  featureConfigs?: Record<string, TenantFeatureConfigInput>;
  enabledModules?: readonly string[];
}): Record<FeatureKey, TenantFeatureConfig> {
  return normalizeFeatureConfigs(args.featureConfigs, args.enabledModules);
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
