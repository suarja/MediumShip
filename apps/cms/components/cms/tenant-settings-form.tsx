"use client";

import { useMutation } from "convex/react";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import {
  isThemePaletteName,
  resolveTheme,
  themePaletteNames,
} from "../../../../src/features/theme/palette-catalog";

type TenantSettingsFormProps = {
  tenant: {
    appIconUrl?: string;
    brandLogoUrl?: string;
    name: string;
    slug: string;
    themeConfig?: { paletteName: string };
  };
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

function BrandLogoMark({
  logoUrl,
  name,
}: {
  logoUrl: string;
  name: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  if (!logoUrl || hasError) {
    return (
      <>
        <i>{name || "MediumShip"}</i>
        <span className="d" />
      </>
    );
  }

  return (
    <img
      alt={`${name || "MediumShip"} logo`}
      onError={() => setHasError(true)}
      src={logoUrl}
      style={{ height: 24, maxWidth: 112, objectFit: "contain", marginLeft: -4 }}
    />
  );
}

function TenantMobileMockup({
  appIconUrl,
  logoUrl,
  name,
  paletteName,
}: {
  appIconUrl: string;
  logoUrl: string;
  name: string;
  paletteName: string;
}) {
  const safePalette = isThemePaletteName(paletteName) ? paletteName : "brick";
  const theme = resolveTheme({ paletteName: safePalette });

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
        <div className="mhead">
          <BrandLogoMark logoUrl={logoUrl} name={name} />
        </div>
        <div className="mtab">
          <span className="on" />
          <span />
          <span />
          <span />
        </div>
        {appIconUrl ? (
          <div
            className="mappicon"
            style={{
              backgroundImage: `url(${appIconUrl})`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }}
          />
        ) : null}
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
  const [logoUrl, setLogoUrl] = useState(tenant.brandLogoUrl ?? "");
  const [appIconUrl, setAppIconUrl] = useState(tenant.appIconUrl ?? "");
  const [saveLabel, setSaveLabel] = useState("Enregistrer");

  useEffect(() => {
    setName(tenant.name);
    setPaletteName(tenant.themeConfig?.paletteName ?? "brick");
    setLogoUrl(tenant.brandLogoUrl ?? "");
    setAppIconUrl(tenant.appIconUrl ?? "");
    setSaveLabel("Enregistrer");
  }, [tenant]);

  const safePalette = useMemo(
    () => (isThemePaletteName(paletteName) ? paletteName : "brick"),
    [paletteName],
  );

  const save = async () => {
    try {
      await updateTenantSettings({
        name,
        brandLogoUrl: logoUrl,
        appIconUrl,
        paletteName: safePalette,
      });
      setSaveLabel("Enregistré");
    } catch {
      setSaveLabel("Erreur — non enregistré");
    }
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
            <div
              className="upload__thumb"
              style={
                logoUrl
                  ? {
                      backgroundImage: `url(${logoUrl})`,
                      backgroundPosition: "center",
                      backgroundSize: "contain",
                      backgroundRepeat: "no-repeat",
                    }
                  : undefined
              }
            />
            <div className="upload__meta">
              <h5 className="upload__t">Logo de marque</h5>
              <div className="upload__d">URL persistée et affichée dans l&apos;application mobile</div>
            </div>
          </div>
          <input
            className="input input--mono"
            onChange={(event) => {
              setLogoUrl(event.currentTarget.value);
              setSaveLabel("Enregistrer");
            }}
            placeholder="https://…/logo.png"
            style={{ marginTop: 10 }}
            value={logoUrl}
          />
          <div className="field-actions">
            <button
              className="btn btn--surface btn--sm"
              disabled={!logoUrl}
              onClick={() => {
                setLogoUrl("");
                setSaveLabel("Enregistrer");
              }}
              type="button"
            >
              Retirer le logo
            </button>
          </div>

          <div className="upload" style={{ marginTop: 14 }}>
            <div
              className="upload__thumb"
              style={
                appIconUrl
                  ? {
                      backgroundImage: `url(${appIconUrl})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }
                  : undefined
              }
            />
            <div className="upload__meta">
              <h5 className="upload__t">App icon</h5>
              <div className="upload__d">URL persistée et utilisée dans l’app/settings</div>
            </div>
          </div>
          <input
            className="input input--mono"
            onChange={(event) => {
              setAppIconUrl(event.currentTarget.value);
              setSaveLabel("Enregistrer");
            }}
            placeholder="https://…/app-icon.png"
            style={{ marginTop: 10 }}
            value={appIconUrl}
          />
          <div className="field-actions">
            <button
              className="btn btn--surface btn--sm"
              disabled={!appIconUrl}
              onClick={() => {
                setAppIconUrl("");
                setSaveLabel("Enregistrer");
              }}
              type="button"
            >
              Retirer l’icône
            </button>
          </div>
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
      </div>

      <div className="tenant-col tenant-col--right">
        <div className="mobile-mockup">
          <div className="mobile-mockup__h">
            <span className="lbl">— Aperçu mobile</span>
            <span className="tg">{titleCase(safePalette)}</span>
          </div>

          <TenantMobileMockup
            appIconUrl={appIconUrl}
            logoUrl={logoUrl}
            name={name}
            paletteName={safePalette}
          />

          <button className="btn btn--primary btn--block" onClick={() => void save()} type="button">
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
