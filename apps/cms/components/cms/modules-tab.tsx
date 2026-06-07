"use client";

import { useMutation } from "convex/react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import {
  CORE_NAV_TAB_KEYS,
  FEATURE_CATALOG_GROUPS,
  NAV_TAB_CAP,
  NAV_TAB_KEYS,
  countNavTabsInBar,
  normalizeNavOrder,
  resolveEffectiveFeatureConfigs,
  type AccessLevel,
  type FeatureDefinition,
  type FeatureKey,
  type NavTabKey,
  type TenantFeatureConfig,
} from "../../../../convex/featureCatalog";
import {
  CATEGORY_ICON_CATALOG,
  getCategoryIconGlyph,
  type CategoryIconKey,
} from "../../../../src/features/categories/category-icon-catalog";
import {
  createDefaultFeedSection,
  moduleToContentKind,
  PUBLIC_CONTENT_MODULES,
  type ContentModule,
  type FeedSectionConfig,
} from "../../../../src/features/tenant/public-config";

type ModulesTabProps = {
  tenant: {
    enabledModules: string[];
    featureConfigs?: Record<string, TenantFeatureConfig>;
    feedSections?: FeedSectionConfig[];
    navOrder?: string[];
  };
};

const ACCESS_LABELS: Record<AccessLevel, string> = {
  free: "Gratuit",
  member: "Membre",
  premium: "Premium",
};

const KIND_LABELS: Record<FeedSectionConfig["kind"], string> = {
  article: "Article",
  episode: "Épisode",
  video: "Vidéo",
};

const TAB_ICON_KEYS = new Set<NavTabKey>(["discover", "explore", "library"]);

function tenantFeatureConfigs(tenant: ModulesTabProps["tenant"]) {
  return resolveEffectiveFeatureConfigs({
    featureConfigs: tenant.featureConfigs,
    enabledModules: tenant.enabledModules,
    navOrder: tenant.navOrder,
  });
}

function AccessSegment({
  value,
  locked,
  disabled,
  onChange,
}: {
  value: AccessLevel;
  locked?: boolean;
  disabled?: boolean;
  onChange: (value: AccessLevel) => void;
}) {
  if (locked) {
    return (
      <span className="seg--fixed">
        {ACCESS_LABELS[value]} · fixe
      </span>
    );
  }

  const options: AccessLevel[] = ["free", "member", "premium"];

  return (
    <div aria-disabled={disabled ? "true" : "false"} className="seg">
      {options.map((option) => (
        <button
          className={`${value === option ? `on ${option}` : ""}`}
          key={option}
          onClick={() => {
            if (!disabled) {
              onChange(option);
            }
          }}
          type="button"
        >
          {ACCESS_LABELS[option]}
        </button>
      ))}
    </div>
  );
}

function ModuleToggle({
  checked,
  locked,
  disabled,
  onChange,
  onLabel = "Activé",
  offLabel = "Désactivé",
  hideLabel = false,
}: {
  checked: boolean;
  locked?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  hideLabel?: boolean;
}) {
  return (
    <div className={`mod-toggle-cell ${hideLabel ? "mod-toggle-cell--compact" : ""}`}>
      {hideLabel ? null : <span className="lbl">{checked ? onLabel : offLabel}</span>}
      <label className="toggle">
        <input
          aria-label={checked ? onLabel : offLabel}
          checked={checked}
          disabled={locked || disabled}
          onChange={(event) => onChange(event.currentTarget.checked)}
          type="checkbox"
        />
        <span className="toggle__sw" />
      </label>
    </div>
  );
}

function NavTabComposer({
  features,
  featureConfigs,
  navOrder,
  onToggleEnabled,
  onToggleInBar,
  onMove,
  onIconChange,
  expandedIconKey,
  setExpandedIconKey,
}: {
  features: FeatureDefinition[];
  featureConfigs: Record<FeatureKey, TenantFeatureConfig>;
  navOrder: string[];
  onToggleEnabled: (key: FeatureKey, enabled: boolean) => void;
  onToggleInBar: (key: FeatureKey, inBar: boolean) => void;
  onMove: (key: FeatureKey, direction: -1 | 1) => void;
  onIconChange: (key: FeatureKey, iconKey: CategoryIconKey) => void;
  expandedIconKey: FeatureKey | null;
  setExpandedIconKey: (key: FeatureKey | null) => void;
}) {
  const inBarCount = countNavTabsInBar(featureConfigs);
  const freeSlots = Math.max(0, NAV_TAB_CAP - inBarCount);
  const atCap = inBarCount >= NAV_TAB_CAP;

  const orderedFeatures = useMemo(() => {
    const byKey = new Map(features.map((feature) => [feature.key, feature]));
    const seen = new Set<string>();
    const ordered: FeatureDefinition[] = [];

    for (const key of navOrder) {
      const feature = byKey.get(key as FeatureKey);
      if (feature && !seen.has(key)) {
        ordered.push(feature);
        seen.add(key);
      }
    }

    for (const key of NAV_TAB_KEYS) {
      const feature = byKey.get(key);
      if (feature && !seen.has(key)) {
        ordered.push(feature);
      }
    }

    return ordered;
  }, [features, navOrder]);

  return (
    <div className="nav-composer">
      <p className="nav-composer__note">
        {atCap ? (
          <>
            Plafond atteint ({NAV_TAB_CAP}/{NAV_TAB_CAP}) — désactivez « Dans la barre » pour une
            table afin d&apos;en promouvoir une autre.{" "}
            <b>Accueil</b> et <b>Profil</b> restent toujours dans la barre. Les tables hors barre
            restent disponibles via l&apos;écran Explorer.
          </>
        ) : (
          <>
            {inBarCount}/{NAV_TAB_CAP} dans la barre
            {freeSlots > 0
              ? ` · ${freeSlots} place${freeSlots > 1 ? "s" : ""} libre${freeSlots > 1 ? "s" : ""}`
              : null}
            . Réordonnez les onglets ; seuls <b>Accueil</b> et <b>Profil</b> sont épinglés.
          </>
        )}
      </p>

      <div className="nav-composer__head" aria-hidden>
        <span className="nav-composer__head-label nav-composer__head-label--info">Table</span>
        <span className="nav-composer__head-label">Ordre</span>
        <span className="nav-composer__head-label">Disponible</span>
        <span className="nav-composer__head-label">Dans la barre</span>
      </div>

      <div className="nav-composer__list">
        {orderedFeatures.map((feature, index) => {
          const config = featureConfigs[feature.key];
          const isCore = CORE_NAV_TAB_KEYS.includes(
            feature.key as (typeof CORE_NAV_TAB_KEYS)[number],
          );
          const isEnabled = config?.enabled ?? false;
          const isInBar = config?.inBar ?? false;
          const blockInBar = !isInBar && atCap;
          const showIconPicker = TAB_ICON_KEYS.has(feature.key as NavTabKey);

          return (
            <div
              className={`nav-composer__row ${isEnabled ? "" : "off"} ${isCore ? "nav-composer__row--core" : ""}`}
              key={feature.key}
            >
              <div className="nav-composer__info">
                <h4 className="nav-composer__title">
                  {feature.label}
                  {isCore ? <span className="mod-row__lock">Épinglé</span> : null}
                  {showIconPicker ? (
                    <button
                      className="mod-row__icon-btn"
                      onClick={() =>
                        setExpandedIconKey(
                          expandedIconKey === feature.key ? null : feature.key,
                        )
                      }
                      title="Changer l'icône"
                      type="button"
                    >
                      {getCategoryIconGlyph(config.iconKey)}
                    </button>
                  ) : null}
                </h4>
                <p className="nav-composer__desc">{feature.desc}</p>
                {expandedIconKey === feature.key ? (
                  <div className="icon-picker icon-picker--compact">
                    {CATEGORY_ICON_CATALOG.map((entry) => {
                      const active = config.iconKey === entry.key;
                      return (
                        <button
                          aria-pressed={active}
                          className={`icon-picker__btn ${active ? "on" : ""}`}
                          key={entry.key}
                          onClick={() => {
                            onIconChange(feature.key, entry.key as CategoryIconKey);
                            setExpandedIconKey(null);
                          }}
                          title={entry.label}
                          type="button"
                        >
                          <span className="icon-picker__glyph">{entry.glyph}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="ord nav-composer__ord">
                <button
                  aria-label={`Monter ${feature.label}`}
                  disabled={index === 0}
                  onClick={() => onMove(feature.key, -1)}
                  type="button"
                >
                  ↑
                </button>
                <button
                  aria-label={`Descendre ${feature.label}`}
                  disabled={index === orderedFeatures.length - 1}
                  onClick={() => onMove(feature.key, 1)}
                  type="button"
                >
                  ↓
                </button>
              </div>

              <div className="nav-composer__control">
                <ModuleToggle
                  checked={isEnabled}
                  hideLabel
                  locked={isCore}
                  onChange={(enabled) => onToggleEnabled(feature.key, enabled)}
                  onLabel="Disponible"
                  offLabel="Désactivée"
                />
              </div>
              <div className="nav-composer__control">
                <ModuleToggle
                  checked={isInBar}
                  disabled={!isEnabled || blockInBar}
                  hideLabel
                  locked={isCore}
                  onChange={(inBar) => onToggleInBar(feature.key, inBar)}
                  onLabel="Dans la barre"
                  offLabel="Hors barre"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ModulesTab({ tenant }: ModulesTabProps) {
  const updateModuleSettings = useMutation(api.cms.mutations.updateModuleSettings);
  const [featureConfigs, setFeatureConfigs] = useState<Record<FeatureKey, TenantFeatureConfig>>(
    () => tenantFeatureConfigs(tenant),
  );
  const [navOrder, setNavOrder] = useState<string[]>(() =>
    normalizeNavOrder(tenant.navOrder),
  );
  const [feedSections, setFeedSections] = useState<FeedSectionConfig[]>(
    tenant.feedSections ?? [],
  );
  const [saveLabel, setSaveLabel] = useState("Enregistrer");
  const [expandedIconKey, setExpandedIconKey] = useState<FeatureKey | null>(null);

  useEffect(() => {
    setFeatureConfigs(tenantFeatureConfigs(tenant));
    setNavOrder(normalizeNavOrder(tenant.navOrder));
    setFeedSections(tenant.feedSections ?? []);
    setSaveLabel("Enregistrer");
  }, [tenant]);

  const enabledModules = useMemo(
    () =>
      (Object.keys(featureConfigs) as FeatureKey[]).filter(
        (key) => featureConfigs[key]?.enabled,
      ),
    [featureConfigs],
  );

  const enabledPublicModules = useMemo(
    () =>
      enabledModules.filter((module): module is ContentModule =>
        PUBLIC_CONTENT_MODULES.includes(module as ContentModule),
      ),
    [enabledModules],
  );

  const addableKinds = useMemo(() => {
    const usedKinds = new Set(feedSections.map((section) => section.kind));
    return enabledPublicModules
      .map((module) => moduleToContentKind(module))
      .filter((kind) => !usedKinds.has(kind));
  }, [enabledPublicModules, feedSections]);

  const stats = useMemo(() => {
    let on = 0;
    let free = 0;
    let member = 0;
    let premium = 0;
    let total = 0;

    for (const config of Object.values(featureConfigs)) {
      total += 1;
      if (!config.enabled) {
        continue;
      }

      on += 1;
      if (config.access === "free") {
        free += 1;
      } else if (config.access === "member") {
        member += 1;
      } else {
        premium += 1;
      }
    }

    return { on, free, member, premium, total };
  }, [featureConfigs]);

  const markDirty = () => setSaveLabel("Enregistrer");

  const updateFeature = (key: FeatureKey, patch: Partial<TenantFeatureConfig>) => {
    setFeatureConfigs((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
    markDirty();
  };

  const toggleNavTabEnabled = (key: FeatureKey, enabled: boolean) => {
    // If disabling, also remove from bar
    if (!enabled) {
      updateFeature(key, { enabled, inBar: false });
      return;
    }
    updateFeature(key, { enabled });
  };

  const toggleNavTabInBar = (key: FeatureKey, inBar: boolean) => {
    if (inBar) {
      // Cannot add to bar if already at cap
      if (countNavTabsInBar(featureConfigs) >= NAV_TAB_CAP) {
        return;
      }
    }
    updateFeature(key, { inBar });
  };

  const toggleFeature = (key: FeatureKey, enabled: boolean) => {
    updateFeature(key, { enabled });

    if (key === "articles" || key === "episodes" || key === "videos") {
      const kind = moduleToContentKind(key);
      setFeedSections((current) => {
        if (!enabled) {
          return current;
        }

        return current.some((section) => section.kind === kind)
          ? current
          : [...current, createDefaultFeedSection(kind)];
      });
    }
  };

  const moveNavTab = (key: FeatureKey, direction: -1 | 1) => {
    setNavOrder((current) => {
      const index = current.indexOf(key);
      if (index < 0) {
        return current;
      }

      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [entry] = next.splice(index, 1);
      next.splice(nextIndex, 0, entry);
      return normalizeNavOrder(next);
    });
    markDirty();
  };

  const updateSection = (index: number, patch: Partial<FeedSectionConfig>) => {
    setFeedSections((current) =>
      current.map((section, currentIndex) =>
        currentIndex === index ? { ...section, ...patch } : section,
      ),
    );
    markDirty();
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setFeedSections((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [section] = next.splice(index, 1);
      next.splice(nextIndex, 0, section);
      return next;
    });
    markDirty();
  };

  const addSection = () => {
    const nextKind = addableKinds[0];
    if (!nextKind) {
      return;
    }

    setFeedSections((current) => [...current, createDefaultFeedSection(nextKind)]);
    markDirty();
  };

  const removeSection = (index: number) => {
    setFeedSections((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    markDirty();
  };

  const reset = () => {
    setFeatureConfigs(tenantFeatureConfigs(tenant));
    setNavOrder(normalizeNavOrder(tenant.navOrder));
    setFeedSections(tenant.feedSections ?? []);
    setExpandedIconKey(null);
    setSaveLabel("Enregistrer");
  };

  const save = async () => {
    await updateModuleSettings({
      featureConfigs,
      feedSections,
      navOrder,
    });
    setSaveLabel("Enregistré");
  };

  return (
    <main className="page">
      <div className="mod-page">
        <div className="mod-col">
          {FEATURE_CATALOG_GROUPS.map((group) => (
            <section className="mod-group" key={group.group}>
              <div className="mod-group__h">
                <span className="t serif">{group.group}</span>
                <span className="c">
                  {group.group === "Tables"
                    ? `${countNavTabsInBar(featureConfigs)}/${NAV_TAB_CAP} dans la barre`
                    : `${group.features.filter((feature) => featureConfigs[feature.key]?.enabled).length}/${group.features.length} actifs`}
                </span>
              </div>

              {group.group === "Tables" ? (
                <NavTabComposer
                  expandedIconKey={expandedIconKey}
                  featureConfigs={featureConfigs}
                  features={group.features}
                  navOrder={navOrder}
                  onIconChange={(key, iconKey) => updateFeature(key, { iconKey })}
                  onMove={moveNavTab}
                  onToggleEnabled={toggleNavTabEnabled}
                  onToggleInBar={toggleNavTabInBar}
                  setExpandedIconKey={setExpandedIconKey}
                />
              ) : (
                group.features.map((feature) => {
                  const config = featureConfigs[feature.key];

                  return (
                    <div
                      className={`mod-row ${config?.enabled ? "" : "off"}`}
                      key={feature.key}
                    >
                      <div className="mod-row__info">
                        <h4 className="mod-row__t">
                          {feature.label}
                          {feature.core ? <span className="mod-row__lock">Core</span> : null}
                        </h4>
                        <p className="mod-row__d">{feature.desc}</p>
                      </div>

                      <AccessSegment
                        disabled={!config?.enabled}
                        locked={feature.lockAccess}
                        onChange={(access) => updateFeature(feature.key, { access })}
                        value={config.access}
                      />

                      <ModuleToggle
                        checked={config.enabled}
                        locked={feature.core}
                        onChange={(enabled) => toggleFeature(feature.key, enabled)}
                      />
                    </div>
                  );
                })
              )}
            </section>
          ))}

          <section className="tenant-section">
            <div className="tenant-section__h">— Sections du feed</div>
            <div className="mod-feed__header">
              <h3 className="tenant-section__t mod-feed__title">
                Architecture <i>du home.</i>
              </h3>
              <button
                className="btn btn--surface btn--sm"
                disabled={addableKinds.length === 0}
                onClick={addSection}
                type="button"
              >
                Ajouter
              </button>
            </div>
            <p className="tenant-note mod-feed__note">
              Ordre, titre et visibilité des sections de contenu sur le home mobile.
            </p>
            <div className="feed-list">
              {feedSections.map((section, index) => (
                <div className="feed-row feed-row--modules" key={`${section.kind}-${index}`}>
                  <span className="grip">⋮⋮</span>
                  <select
                    className="select"
                    onChange={(event) =>
                      updateSection(index, {
                        kind: event.currentTarget.value as FeedSectionConfig["kind"],
                      })
                    }
                    value={section.kind}
                  >
                    {enabledPublicModules
                      .map((module) => moduleToContentKind(module))
                      .filter(
                        (kind) =>
                          kind === section.kind ||
                          !feedSections.some(
                            (existing, existingIndex) =>
                              existingIndex !== index && existing.kind === kind,
                          ),
                      )
                      .map((kind) => (
                        <option key={kind} value={kind}>
                          {KIND_LABELS[kind]}
                        </option>
                      ))}
                  </select>
                  <input
                    className="input"
                    onChange={(event) =>
                      updateSection(index, { title: event.currentTarget.value })
                    }
                    value={section.title}
                  />
                  <label className="check check--inline">
                    <input
                      checked={section.visible !== false}
                      onChange={(event) =>
                        updateSection(index, { visible: event.currentTarget.checked })
                      }
                      type="checkbox"
                    />
                    <span className="check__box" />
                    Visible
                  </label>
                  <div className="ord">
                    <button onClick={() => moveSection(index, -1)} type="button">
                      ↑
                    </button>
                    <button onClick={() => moveSection(index, 1)} type="button">
                      ↓
                    </button>
                  </div>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => removeSection(index)}
                    type="button"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="mod-summary">
          <div className="mod-summary__card">
            <div className="h">— Résumé tenant</div>
            <div className="mod-stat">
              <span className="k">Modules activés</span>
              <span className="v">
                {stats.on}/{stats.total}
              </span>
            </div>
            <div className="mod-stat">
              <span className="k">Tables dans la barre</span>
              <span className="v">
                {countNavTabsInBar(featureConfigs)}/{NAV_TAB_CAP}
              </span>
            </div>
            <div className="mod-stat">
              <span className="k">Gratuit</span>
              <span className="v">{stats.free}</span>
            </div>
            <div className="mod-stat">
              <span className="k">Membre</span>
              <span className="v">{stats.member}</span>
            </div>
            <div className="mod-stat">
              <span className="k">Premium</span>
              <span className="v">{stats.premium}</span>
            </div>
          </div>

          <div className="mod-summary__card">
            <div className="h">— Niveaux d&apos;accès</div>
            <div className="mod-legend">
              <div className="row">
                <span className="dot free" />
                <span>
                  <b>Gratuit</b> — invité, sans compte
                </span>
              </div>
              <div className="row">
                <span className="dot member" />
                <span>
                  <b>Membre</b> — compte requis, gratuit
                </span>
              </div>
              <div className="row">
                <span className="dot premium" />
                <span>
                  <b>Premium</b> — abonnement payant
                </span>
              </div>
            </div>
          </div>

          <div className="mod-summary__card">
            <div className="h">— Comment ça marche</div>
            <p className="mod-note">
              Les <b>tables</b> ont deux niveaux : <b>Disponible</b> (route + grille Explorer)
              et <b>Dans la barre</b> (barre du bas, max {NAV_TAB_CAP}). Le plafond s&apos;applique
              uniquement à « Dans la barre » — une table peut être disponible sans apparaître dans
              la barre. Les contenus et capacités n&apos;ont pas d&apos;option « Dans la barre ».
            </p>
          </div>

          <div className="mod-summary__actions">
            <button className="btn btn--ghost btn--block" onClick={reset} type="button">
              Réinitialiser
            </button>
            <button className="btn btn--primary btn--block" onClick={() => void save()} type="button">
              {saveLabel}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
