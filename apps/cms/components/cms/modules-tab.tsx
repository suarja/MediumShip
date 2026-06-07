"use client";

import { useMutation } from "convex/react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import {
  FEATURE_CATALOG_GROUPS,
  resolveEffectiveFeatureConfigs,
  type AccessLevel,
  type FeatureKey,
  type TenantFeatureConfig,
} from "../../../../convex/featureCatalog";
import {
  CATEGORY_ICON_CATALOG,
  getCategoryIconGlyph,
  type CategoryIconKey,
} from "../../../../src/features/categories/category-icon-catalog";
import {
  contentKindToModule,
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

const NAVIGATION_ICON_KEYS = new Set<FeatureKey>([
  "discover",
  "collections",
  "agenda",
  "community",
]);

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
  onChange,
}: {
  checked: boolean;
  locked?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="mod-toggle-cell">
      <span className="lbl">{checked ? "Activé" : "Désactivé"}</span>
      <label className="toggle">
        <input
          checked={checked}
          disabled={locked}
          onChange={(event) => onChange(event.currentTarget.checked)}
          type="checkbox"
        />
        <span className="toggle__sw" />
      </label>
    </div>
  );
}

export function ModulesTab({ tenant }: ModulesTabProps) {
  const updateModuleSettings = useMutation(api.cms.mutations.updateModuleSettings);
  const [featureConfigs, setFeatureConfigs] = useState<Record<FeatureKey, TenantFeatureConfig>>(
    () => resolveEffectiveFeatureConfigs(tenant),
  );
  const [feedSections, setFeedSections] = useState<FeedSectionConfig[]>(
    tenant.feedSections ?? [],
  );
  const [saveLabel, setSaveLabel] = useState("Enregistrer");
  const [expandedIconKey, setExpandedIconKey] = useState<FeatureKey | null>(null);

  useEffect(() => {
    setFeatureConfigs(resolveEffectiveFeatureConfigs(tenant));
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

  const updateFeature = (key: FeatureKey, patch: Partial<TenantFeatureConfig>) => {
    setFeatureConfigs((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
    setSaveLabel("Enregistrer");
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

  const updateSection = (index: number, patch: Partial<FeedSectionConfig>) => {
    setFeedSections((current) =>
      current.map((section, currentIndex) =>
        currentIndex === index ? { ...section, ...patch } : section,
      ),
    );
    setSaveLabel("Enregistrer");
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
    setSaveLabel("Enregistrer");
  };

  const addSection = () => {
    const nextKind = addableKinds[0];
    if (!nextKind) {
      return;
    }

    setFeedSections((current) => [...current, createDefaultFeedSection(nextKind)]);
    setSaveLabel("Enregistrer");
  };

  const removeSection = (index: number) => {
    setFeedSections((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    setSaveLabel("Enregistrer");
  };

  const reset = () => {
    setFeatureConfigs(resolveEffectiveFeatureConfigs(tenant));
    setFeedSections(tenant.feedSections ?? []);
    setExpandedIconKey(null);
    setSaveLabel("Enregistrer");
  };

  const save = async () => {
    await updateModuleSettings({
      featureConfigs,
      feedSections,
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
                  {group.features.filter((feature) => featureConfigs[feature.key]?.enabled).length}
                  /{group.features.length} actifs
                </span>
              </div>

              {group.features.map((feature) => {
                const config = featureConfigs[feature.key];
                const showIconPicker = NAVIGATION_ICON_KEYS.has(feature.key);

                return (
                  <div
                    className={`mod-row ${config?.enabled ? "" : "off"}`}
                    key={feature.key}
                  >
                    <div className="mod-row__info">
                      <h4 className="mod-row__t">
                        {feature.label}
                        {feature.core ? <span className="mod-row__lock">Core</span> : null}
                        {showIconPicker ? (
                          <button
                            className="mod-row__icon-btn"
                            onClick={() =>
                              setExpandedIconKey((current) =>
                                current === feature.key ? null : feature.key,
                              )
                            }
                            title="Changer l'icône"
                            type="button"
                          >
                            {getCategoryIconGlyph(config.iconKey)}
                          </button>
                        ) : null}
                      </h4>
                      <p className="mod-row__d">{feature.desc}</p>
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
                                  updateFeature(feature.key, {
                                    iconKey: entry.key as CategoryIconKey,
                                  });
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
              })}
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
              Le <b>toggle</b> active ou retire la feature de l&apos;app pour ce client.
              Le <b>sélecteur</b> définit qui peut l&apos;utiliser. Une feature désactivée
              disparaît de la navigation ; une feature premium déclenche le paywall
              contextuel au moment de l&apos;usage.
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
