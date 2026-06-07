import { isCategoryIconKey } from "../src/features/categories/category-icon-catalog";
import type { EnabledModule } from "../src/features/tenant/public-config";
import { ENABLED_MODULES, isEnabledModule } from "../src/features/tenant/public-config";

export type AccessLevel = "free" | "member" | "premium";

export type FeatureKey = EnabledModule;

export type FeatureDefinition = {
  key: FeatureKey;
  label: string;
  desc: string;
  group: string;
  core?: boolean;
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
    key: "articles",
    label: "Articles",
    desc: "Lecture longue, analyses et actualités.",
    group: "Contenu",
    core: true,
    defaultAccess: "free",
    defaultIconKey: "analyses",
  },
  {
    key: "episodes",
    label: "Podcasts",
    desc: "Épisodes audio et flux podcast.",
    group: "Contenu",
    defaultAccess: "free",
    defaultIconKey: "podcasts",
  },
  {
    key: "videos",
    label: "Vidéos",
    desc: "Formats vidéo hébergés ou YouTube.",
    group: "Contenu",
    defaultAccess: "free",
    defaultIconKey: "videos",
  },
  {
    key: "premium",
    label: "Premium",
    desc: "Contenus et surfaces réservés aux abonnés.",
    group: "Contenu",
    lockAccess: true,
    defaultAccess: "premium",
    defaultIconKey: "debate",
  },
  {
    key: "discover",
    label: "Découverte",
    desc: "Fil personnalisé et recommandations.",
    group: "Navigation",
    defaultAccess: "free",
    defaultIconKey: "news",
  },
  {
    key: "collections",
    label: "Collections",
    desc: "Séries éditoriales et parcours thématiques.",
    group: "Navigation",
    defaultAccess: "free",
    defaultIconKey: "collections",
  },
  {
    key: "agenda",
    label: "Agenda",
    desc: "Événements live, replays et inscriptions.",
    group: "Navigation",
    defaultAccess: "free",
    defaultIconKey: "agenda",
  },
  {
    key: "community",
    label: "Communauté",
    desc: "Liens communautaires et salon membres.",
    group: "Navigation",
    defaultAccess: "member",
    defaultIconKey: "community",
  },
  {
    key: "bookmarks",
    label: "Favoris",
    desc: "Sauvegarde de contenus pour les membres.",
    group: "Capacités membres",
    defaultAccess: "member",
    defaultIconKey: "library",
  },
  {
    key: "progressSync",
    label: "Progression",
    desc: "Reprise de lecture et synchronisation.",
    group: "Capacités membres",
    defaultAccess: "member",
    defaultIconKey: "default",
  },
  {
    key: "offline",
    label: "Mode hors-ligne",
    desc: "Téléchargements pour consultation offline.",
    group: "Capacités membres",
    defaultAccess: "premium",
    defaultIconKey: "library",
  },
  {
    key: "personalLists",
    label: "Listes",
    desc: "Listes personnelles de contenus.",
    group: "Capacités membres",
    defaultAccess: "member",
    defaultIconKey: "library",
  },
  {
    key: "membersRoom",
    label: "Salon membres",
    desc: "Espace réservé aux membres connectés.",
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

export function assertFeatureIconKey(iconKey: string) {
  if (!isCategoryIconKey(iconKey)) {
    throw new Error(`Unknown feature icon key: ${iconKey}`);
  }
}

function defaultConfigForFeature(feature: FeatureDefinition): TenantFeatureConfig {
  return {
    enabled: feature.core ?? true,
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
