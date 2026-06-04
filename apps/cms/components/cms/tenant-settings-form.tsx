"use client";

import { useMutation } from "convex/react";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import {
  ENABLED_MODULES,
  contentKindToModule,
  type FeedSectionConfig,
} from "../../../../src/features/tenant/public-config";
import {
  isThemePaletteName,
  resolveTheme,
  themePaletteNames,
} from "../../../../src/features/theme/palette-catalog";

type TenantSettingsFormProps = {
  tenant: {
    enabledModules: string[];
    feedSections?: FeedSectionConfig[];
    name: string;
    slug: string;
    themeConfig?: { paletteName: string };
  };
};

const MODULE_LABELS: Record<(typeof ENABLED_MODULES)[number], string> = {
  articles: "Articles",
  episodes: "Épisodes",
  videos: "Vidéos",
  premium: "Premium",
};

const KIND_LABELS: Record<FeedSectionConfig["kind"], string> = {
  article: "Article",
  episode: "Épisode",
  video: "Vidéo",
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <span className="field__lbl">{label}</span>
      {children}
    </div>
  );
}

function MobilePhonePreview({
  enabledModules,
  feedSections,
  name,
  paletteName,
}: {
  enabledModules: string[];
  feedSections: FeedSectionConfig[];
  name: string;
  paletteName: string;
}) {
  const safePalette = isThemePaletteName(paletteName) ? paletteName : "brick";
  const theme = resolveTheme({ paletteName: safePalette });
  const visibleSections = feedSections.filter((section) =>
    enabledModules.includes(contentKindToModule(section.kind)),
  );
  const sections = visibleSections;
  const hero = sections[0];
  const rest = sections.slice(1, 4);

  return (
    <div
      className="phone"
      style={
        {
          "--m-accent": theme.colors.accent,
          "--m-bg": theme.colors.canvas,
          "--m-body": '"Hanken Grotesk", system-ui, sans-serif',
          "--m-display": '"Newsreader", Georgia, serif',
          "--m-display-style": "italic",
          "--m-display-weight": "500",
          "--m-ink": theme.colors.heading,
          "--m-muted": theme.colors.surfaceMuted,
        } as CSSProperties
      }
    >
      <div className="phone__notch" />
      <div className="phone__home" />
      <div className="phone__screen">
        <div className="phone__sb">
          <span>9:41</span>
          <span>● ● ●</span>
        </div>
        <div className="mfeed">
          <div className="mfeed__hdr">
            <div className="mfeed__logo">
              <i>{name || "MediumShip"}</i>
              <span className="d" />
            </div>
            <div className="mfeed__av" />
          </div>

          <div className="mfeed__tabs">
            {sections.length > 0 ? (
              sections.slice(0, 4).map((section, index) => (
                <span className={index === 0 ? "on" : ""} key={`${section.kind}-${section.title}`}>
                  {section.title}
                </span>
              ))
            ) : (
              <span className="on">Aucun module actif</span>
            )}
          </div>

          {hero ? (
            <div className="mfeed__hero">
              <span className="k">◉ {KIND_LABELS[hero.kind].toUpperCase()}</span>
              <span className="t">{hero.title}</span>
              <span className="m">
                <span className="pl">▶</span>
                <span>{MODULE_LABELS[contentKindToModule(hero.kind)]}</span>
              </span>
            </div>
          ) : (
            <div className="mfeed__hero">
              <span className="k">◉ CONFIG</span>
              <span className="t">Activez au moins un module public.</span>
              <span className="m">
                <span className="pl">•</span>
                <span>Feed vide</span>
              </span>
            </div>
          )}

          <div className="mfeed__list">
            {rest.map((section, index) => (
              <div className="mfeed__item" key={`${section.kind}-${section.title}-${index}`}>
                <div className={`ph ${index === 1 ? "alt" : index === 2 ? "dk" : ""}`} />
                <div className="meta">
                  <span className="k">{KIND_LABELS[section.kind].toUpperCase()}</span>
                  <span className="t">{section.title}</span>
                  <span className="d">
                    {MODULE_LABELS[contentKindToModule(section.kind)]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TenantSettingsForm({ tenant }: TenantSettingsFormProps) {
  const updateTenantSettings = useMutation(api.cms.mutations.updateTenantSettings);
  const [name, setName] = useState(tenant.name);
  const [paletteName, setPaletteName] = useState(
    tenant.themeConfig?.paletteName ?? "brick",
  );
  const [enabledModules, setEnabledModules] = useState<string[]>(
    tenant.enabledModules,
  );
  const [feedSections, setFeedSections] = useState<FeedSectionConfig[]>(
    tenant.feedSections ?? [],
  );
  // TODO: real upload needs Convex storage.
  const [logoUrl, setLogoUrl] = useState("");
  const [appIconUrl, setAppIconUrl] = useState("");
  const [saveLabel, setSaveLabel] = useState("Enregistrer");

  useEffect(() => {
    setName(tenant.name);
    setPaletteName(tenant.themeConfig?.paletteName ?? "brick");
    setEnabledModules(tenant.enabledModules);
    setFeedSections(tenant.feedSections ?? []);
    setSaveLabel("Enregistrer");
  }, [tenant]);

  const safePalette = useMemo(
    () => (isThemePaletteName(paletteName) ? paletteName : "brick"),
    [paletteName],
  );

  const toggleModule = (module: string) => {
    setEnabledModules((current) =>
      current.includes(module)
        ? current.filter((value) => value !== module)
        : [...current, module],
    );
    setSaveLabel("Enregistrer");
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
    setFeedSections((current) => [
      ...current,
      { kind: "article", title: "Nouvelle section" },
    ]);
    setSaveLabel("Enregistrer");
  };

  const removeSection = (index: number) => {
    setFeedSections((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    setSaveLabel("Enregistrer");
  };

  const save = async () => {
    await updateTenantSettings({
      name,
      paletteName: safePalette,
      enabledModules,
      feedSections,
    });
    setSaveLabel("Enregistré");
  };

  return (
    <div className="tenant-grid">
      <div className="tenant-col">
        <section className="tenant-section">
          <div className="tenant-section__h">— Identité</div>
          <h3 className="tenant-section__t">
            Marque <i>de l’app.</i>
          </h3>
          <div className="identity">
            <div className="identity__logo">
              {(name.trim().charAt(0) || "M").toUpperCase()}
            </div>
            <div className="identity__fields">
              <Field label="Nom de la marque">
                <input
                  className="input"
                  onChange={(event) => {
                    setName(event.currentTarget.value);
                    setSaveLabel("Enregistrer");
                  }}
                  value={name}
                />
              </Field>
              <Field label="Slug du tenant">
                <input className="input input--mono" disabled value={tenant.slug} />
              </Field>
            </div>
          </div>

          <div className="upload" style={{ marginTop: 14 }}>
            <div className="upload__thumb" />
            <div className="upload__meta">
              <h5 className="upload__t">Logo de marque</h5>
              <div className="upload__d">Affichage local uniquement pour cette refonte</div>
            </div>
          </div>
          <input
            className="input input--mono"
            onChange={(event) => setLogoUrl(event.currentTarget.value)}
            placeholder="https://…/logo.png"
            style={{ marginTop: 10 }}
            value={logoUrl}
          />

          <div className="upload" style={{ marginTop: 14 }}>
            <div className="upload__thumb" />
            <div className="upload__meta">
              <h5 className="upload__t">App icon</h5>
              <div className="upload__d">TODO: vrai upload via Convex storage</div>
            </div>
          </div>
          <input
            className="input input--mono"
            onChange={(event) => setAppIconUrl(event.currentTarget.value)}
            placeholder="https://…/app-icon.png"
            style={{ marginTop: 10 }}
            value={appIconUrl}
          />
        </section>

        <section className="tenant-section">
          <div className="tenant-section__h">— Palette</div>
          <h3 className="tenant-section__t">
            Couleurs de <i>l’app.</i>
          </h3>
          <div className="palette-grid">
            {themePaletteNames.map((palette) => {
              const theme = resolveTheme({ paletteName: palette });
              return (
                <button
                  className={`swatch ${safePalette === palette ? "on" : ""}`}
                  key={palette}
                  onClick={() => {
                    setPaletteName(palette);
                    setSaveLabel("Enregistrer");
                  }}
                  type="button"
                >
                  <div className="swatch__chips">
                    <span style={{ background: theme.colors.heading }} />
                    <span style={{ background: theme.colors.accent }} />
                    <span style={{ background: theme.colors.canvas }} />
                  </div>
                  <h5 className="swatch__nm">{titleCase(palette)}</h5>
                  <span className="swatch__d">{theme.isDark ? "Dark" : "Light"}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="tenant-section">
          <div className="tenant-section__h">— Modules</div>
          <h3 className="tenant-section__t">
            Visibilité <i>publique.</i>
          </h3>
          <div className="visibility-grid">
            {ENABLED_MODULES.map((module) => (
              <label className="check" key={module}>
                <input
                  checked={enabledModules.includes(module)}
                  onChange={() => toggleModule(module)}
                  type="checkbox"
                />
                <span className="check__box" />
                {MODULE_LABELS[module]}
              </label>
            ))}
          </div>
        </section>

        <section className="tenant-section">
          <div className="tenant-section__h">— Sections du feed</div>
          <div
            style={{
              alignItems: "end",
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <h3 className="tenant-section__t" style={{ marginBottom: 0 }}>
              Architecture <i>du home.</i>
            </h3>
            <button className="btn btn--surface btn--sm" onClick={addSection} type="button">
              Ajouter
            </button>
          </div>
          <div className="feed-list">
            {feedSections.map((section, index) => (
              <div className="feed-row" key={`${section.kind}-${index}`}>
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
                  <option value="article">article</option>
                  <option value="episode">episode</option>
                  <option value="video">video</option>
                </select>
                <input
                  className="input"
                  onChange={(event) =>
                    updateSection(index, { title: event.currentTarget.value })
                  }
                  value={section.title}
                />
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

      <div className="tenant-col tenant-col--right">
        <div className="mobile-preview">
          <div className="mobile-preview__h">
            <span className="lbl">— Live mobile preview</span>
            <span className="tg">{titleCase(safePalette)}</span>
          </div>

          <MobilePhonePreview
            enabledModules={enabledModules}
            feedSections={feedSections}
            name={name}
            paletteName={safePalette}
          />

          <button className="btn btn--primary btn--block" onClick={save} type="button">
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
