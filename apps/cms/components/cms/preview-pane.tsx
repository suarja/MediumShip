"use client";

import { useQuery } from "convex/react";
import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import {
  isThemePaletteName,
  resolveTheme,
} from "../../../../src/features/theme/palette-catalog";

type PreviewPaneProps = {
  selectedId: string | null;
};

type ScreenId = "home" | "article" | "podcast" | "player" | "paywall";

const SCREENS: Array<{
  description: string;
  id: ScreenId;
  label: string;
  number: string;
}> = [
  {
    id: "home",
    number: "01",
    label: "Home / Feed",
    description: "Vue d’accueil construite depuis le tenant et le contenu sélectionné.",
  },
  {
    id: "article",
    number: "02",
    label: "Article detail",
    description: "Détail éditorial text-first, hero, résumé et corps du contenu.",
  },
  {
    id: "podcast",
    number: "03",
    label: "Episode detail",
    description: "Fiche épisode/podcast avec durée, description et CTA d’écoute.",
  },
  {
    id: "player",
    number: "04",
    label: "Audio player",
    description: "Lecteur immersif réutilisant le contenu comme source principale.",
  },
  {
    id: "paywall",
    number: "05",
    label: "Paywall premium",
    description: "Projection premium tenant-first avec palette et branding réels.",
  },
];

function buildPhoneTheme(preview: NonNullable<ReturnType<typeof usePreviewData>>) {
  const paletteName = preview.tenant.themeConfig?.paletteName;
  const theme = resolveTheme({
    paletteName:
      paletteName && isThemePaletteName(paletteName) ? paletteName : "brick",
  });

  return {
    css: {
      "--m-accent": theme.colors.accent,
      "--m-bg": theme.colors.canvas,
      "--m-body": '"Hanken Grotesk", system-ui, sans-serif',
      "--m-display": '"Newsreader", Georgia, serif',
      "--m-display-style": "italic",
      "--m-display-weight": "500",
      "--m-ink": theme.colors.heading,
      "--m-muted": theme.colors.surfaceMuted,
    } as CSSProperties,
    paletteName:
      paletteName && isThemePaletteName(paletteName) ? paletteName : "brick",
    theme,
  };
}

function usePreviewData(selectedId: string | null) {
  return useQuery(
    api.cms.queries.getPreview,
    selectedId ? { id: selectedId as never } : "skip",
  );
}

function HomeScreen({
  preview,
  style,
}: {
  preview: NonNullable<ReturnType<typeof usePreviewData>>;
  style: CSSProperties;
}) {
  const sections = preview.tenant.feedSections ?? [
    { kind: preview.content.kind, title: preview.content.category },
  ];

  return (
    <div className="phone phone--lg" style={style}>
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
              <i>{preview.tenant.name}</i>
              <span className="d" />
            </div>
            <div className="mfeed__av" />
          </div>
          <div className="mfeed__tabs">
            {sections.slice(0, 4).map((section, index) => (
              <span className={index === 0 ? "on" : ""} key={`${section.kind}-${section.title}`}>
                {section.title}
              </span>
            ))}
          </div>
          <div className="mfeed__hero">
            <span className="k">◉ {preview.content.category.toUpperCase()}</span>
            <span className="t">{preview.content.title}</span>
            <span className="m">
              <span className="pl">▶</span>
              <span>{preview.content.kind.toUpperCase()}</span>
            </span>
          </div>
          <div className="mfeed__list">
            {sections.slice(1, 4).map((section, index) => (
              <div className="mfeed__item" key={`${section.kind}-${section.title}-${index}`}>
                <div className={`ph ${index === 1 ? "alt" : index === 2 ? "dk" : ""}`} />
                <div className="meta">
                  <span className="k">{section.kind.toUpperCase()}</span>
                  <span className="t">{section.title}</span>
                  <span className="d">{preview.content.summary}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ArticleScreen({
  preview,
  style,
}: {
  preview: NonNullable<ReturnType<typeof usePreviewData>>;
  style: CSSProperties;
}) {
  return (
    <div className="phone phone--lg" style={style}>
      <div className="phone__notch" />
      <div className="phone__home" />
      <div className="phone__screen">
        <div className="phone__sb">
          <span>9:41</span>
          <span>⌁</span>
        </div>
        <div
          style={{
            background:
              "linear-gradient(135deg, var(--m-accent), color-mix(in oklab, var(--m-ink) 75%, transparent))",
            height: 190,
            position: "relative",
          }}
        >
          <div
            style={{
              background:
                "repeating-linear-gradient(135deg, transparent 0 6px, rgba(255,255,255,.08) 6px 7px)",
              inset: 0,
              position: "absolute",
            }}
          />
        </div>
        <div style={{ padding: 22, color: "var(--m-ink)" }}>
          <span
            style={{
              color: "var(--m-accent)",
              fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
              fontSize: 10,
              letterSpacing: ".14em",
              textTransform: "uppercase",
            }}
          >
            ◉ {preview.content.category}
          </span>
          <h2
            style={{
              fontFamily: '"Newsreader", Georgia, serif',
              fontSize: 24,
              fontStyle: "italic",
              lineHeight: 1.08,
              margin: "10px 0 12px",
            }}
          >
            {preview.content.title}
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.55, margin: "0 0 10px" }}>
            {preview.content.summary}
          </p>
          <p style={{ fontSize: 12, lineHeight: 1.65, margin: 0, opacity: 0.75 }}>
            {preview.content.articleBody ?? preview.content.summary}
          </p>
        </div>
      </div>
    </div>
  );
}

function PodcastScreen({
  preview,
  style,
}: {
  preview: NonNullable<ReturnType<typeof usePreviewData>>;
  style: CSSProperties;
}) {
  const duration = preview.content.durationSeconds
    ? `${Math.round(preview.content.durationSeconds / 60)} min`
    : "Durée à venir";

  return (
    <div className="phone phone--lg" style={style}>
      <div className="phone__notch" />
      <div className="phone__home" />
      <div className="phone__screen">
        <div className="phone__sb">
          <span>9:41</span>
          <span>⌁</span>
        </div>
        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 18,
              background:
                "radial-gradient(circle at 72% 28%, rgba(255,255,255,.18), transparent 45%), linear-gradient(135deg, var(--m-accent), var(--m-ink))",
            }}
          />
          <span
            style={{
              color: "var(--m-accent)",
              fontSize: 10,
              fontFamily: '"Hanken Grotesk", system-ui, sans-serif',
              letterSpacing: ".14em",
              textTransform: "uppercase",
            }}
          >
            {preview.tenant.name.toUpperCase()} · PODCAST
          </span>
          <h3
            style={{
              fontFamily: '"Newsreader", Georgia, serif',
              fontSize: 22,
              fontStyle: "italic",
              lineHeight: 1.08,
              margin: 0,
            }}
          >
            {preview.content.title}
          </h3>
          <p style={{ fontSize: 13, lineHeight: 1.55, margin: 0 }}>
            {preview.content.summary}
          </p>
          <div style={{ marginTop: "auto", display: "flex", gap: 10 }}>
            <span
              style={{
                background: "var(--m-ink)",
                borderRadius: 999,
                color: "var(--m-bg)",
                display: "grid",
                flex: 1,
                height: 44,
                placeItems: "center",
              }}
            >
              ▶ Écouter
            </span>
            <span
              style={{
                alignItems: "center",
                border: "1px solid rgba(0,0,0,.1)",
                borderRadius: 999,
                display: "inline-flex",
                fontSize: 11,
                padding: "0 14px",
              }}
            >
              {duration}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerScreen({
  preview,
  style,
}: {
  preview: NonNullable<ReturnType<typeof usePreviewData>>;
  style: CSSProperties;
}) {
  return (
    <div
      className="phone phone--lg"
      style={{
        ...style,
        "--m-bg": "#161412",
        "--m-ink": "#f3efe6",
      } as CSSProperties}
    >
      <div className="phone__notch" />
      <div className="phone__home" />
      <div className="phone__screen">
        <div className="phone__sb" style={{ color: "#f3efe6" }}>
          <span>9:41</span>
          <span>⋯</span>
        </div>
        <div style={{ padding: 24, color: "#f3efe6" }}>
          <div
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 18,
              background:
                "radial-gradient(circle at 72% 28%, rgba(255,220,180,.22), transparent 45%), linear-gradient(135deg, var(--m-accent), #6b2417)",
              marginBottom: 24,
            }}
          />
          <span style={{ fontSize: 11, letterSpacing: ".14em", opacity: 0.55, textTransform: "uppercase" }}>
            Lecture
          </span>
          <h3
            style={{
              fontFamily: '"Newsreader", Georgia, serif',
              fontSize: 24,
              fontStyle: "italic",
              lineHeight: 1.08,
              margin: "8px 0 4px",
            }}
          >
            {preview.content.title}
          </h3>
          <p style={{ margin: 0, opacity: 0.7 }}>{preview.tenant.name}</p>
          <div
            style={{
              background: "rgba(255,255,255,.12)",
              borderRadius: 999,
              height: 4,
              marginTop: 22,
              position: "relative",
            }}
          >
            <div
              style={{
                background: "var(--m-accent)",
                borderRadius: 999,
                bottom: 0,
                left: 0,
                position: "absolute",
                top: 0,
                width: "42%",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, opacity: 0.5 }}>
            <span>22:48</span>
            <span>−31:12</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 28 }}>
            <span>15</span>
            <span>⏮</span>
            <span
              style={{
                background: "#f3efe6",
                borderRadius: 999,
                color: "#161412",
                display: "grid",
                height: 56,
                placeItems: "center",
                width: 56,
              }}
            >
              ▶
            </span>
            <span>⏭</span>
            <span>30</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaywallScreen({
  preview,
  style,
}: {
  preview: NonNullable<ReturnType<typeof usePreviewData>>;
  style: CSSProperties;
}) {
  return (
    <div className="phone phone--lg" style={style}>
      <div className="phone__notch" />
      <div className="phone__home" />
      <div className="phone__screen">
        <div className="phone__sb">
          <span>9:41</span>
          <span>✕</span>
        </div>
        <div style={{ padding: 24 }}>
          <div
            style={{
              background: "var(--m-ink)",
              borderRadius: 12,
              color: "var(--m-bg)",
              display: "grid",
              fontFamily: '"Newsreader", Georgia, serif',
              fontSize: 22,
              fontStyle: "italic",
              height: 42,
              placeItems: "center",
              width: 42,
            }}
          >
            {preview.tenant.name.charAt(0).toUpperCase()}
          </div>
          <span
            style={{
              color: "var(--m-accent)",
              display: "inline-block",
              fontSize: 10,
              letterSpacing: ".14em",
              marginTop: 18,
              textTransform: "uppercase",
            }}
          >
            ◉ Accès {preview.tenant.name} Premium
          </span>
          <h3
            style={{
              fontFamily: '"Newsreader", Georgia, serif',
              fontSize: 30,
              fontStyle: "italic",
              lineHeight: 1.02,
              margin: "10px 0 8px",
            }}
          >
            Soutenez. Recevez plus.
          </h3>
          <p style={{ lineHeight: 1.55, margin: 0, opacity: 0.75 }}>
            Tous les formats, les éditions longues, et un meilleur accès au contenu premium.
          </p>
          {["Mensuel · 7€", "Annuel · 59€"].map((plan, index) => (
            <div
              key={plan}
              style={{
                background: index === 1 ? "#fffcf4" : "var(--m-bg)",
                border: "1px solid rgba(0,0,0,.1)",
                borderRadius: 14,
                marginTop: 14,
                padding: "14px 16px",
              }}
            >
              {plan}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SCREEN_COMPONENTS: Record<
  ScreenId,
  (props: {
    preview: NonNullable<ReturnType<typeof usePreviewData>>;
    style: CSSProperties;
  }) => ReactNode
> = {
  article: ArticleScreen,
  home: HomeScreen,
  paywall: PaywallScreen,
  player: PlayerScreen,
  podcast: PodcastScreen,
};

export function PreviewPane({ selectedId }: PreviewPaneProps) {
  const preview = usePreviewData(selectedId);
  const [activeScreen, setActiveScreen] = useState<ScreenId>("home");

  const palette = useMemo(
    () => (preview ? buildPhoneTheme(preview) : null),
    [preview],
  );

  if (!selectedId) {
    return (
      <section className="panel">
        <div className="empty">
          <h3 className="empty__t">Aucun contenu sélectionné</h3>
          <p className="empty__sub">
            Sélectionne un contenu depuis l’onglet Contenus pour alimenter la preview.
          </p>
        </div>
      </section>
    );
  }

  if (preview === undefined) {
    return (
      <section className="panel">
        <div className="empty">
          <h3 className="empty__t">Chargement du snapshot</h3>
          <p className="empty__sub">Convex prépare le modèle public à prévisualiser.</p>
        </div>
      </section>
    );
  }

  if (!preview || !palette) {
    return (
      <section className="panel">
        <div className="empty">
          <h3 className="empty__t">Preview indisponible</h3>
          <p className="empty__sub">
            Le snapshot public n’a pas pu être construit pour ce contenu.
          </p>
        </div>
      </section>
    );
  }

  const screen = SCREENS.find((candidate) => candidate.id === activeScreen) ?? SCREENS[0];
  const ScreenComponent = SCREEN_COMPONENTS[screen.id];

  return (
    <div className="preview-page">
      <aside className="preview-rail">
        <div className="preview-rail__h">— Écrans</div>
        <h3 className="preview-rail__t">
          5 écrans <i>clés.</i>
        </h3>
        <div className="screen-list">
          {SCREENS.map((candidate) => (
            <button
              className={candidate.id === activeScreen ? "on" : ""}
              key={candidate.id}
              onClick={() => setActiveScreen(candidate.id)}
              type="button"
            >
              <span>{candidate.label}</span>
              <span className="n">{candidate.number}</span>
            </button>
          ))}
        </div>
        <hr className="divider" />
        <div
          style={{
            color: "var(--ink-soft)",
            display: "flex",
            flexDirection: "column",
            fontSize: 12.5,
            gap: 8,
            lineHeight: 1.5,
          }}
        >
          <div>
            <strong style={{ color: "var(--ink)", fontFamily: "var(--font-display)" }}>
              {preview.tenant.name}
            </strong>{" "}
            · {preview.tenant.slug}
          </div>
          <div>
            Palette : <strong style={{ color: "var(--ink)" }}>{palette.paletteName}</strong>
          </div>
          <div>
            Typo : <strong style={{ color: "var(--ink)" }}>Newsreader / Hanken Grotesk</strong>
          </div>
          <div>
            Statut :{" "}
            <strong style={{ color: "var(--ink)" }}>{preview.content.status}</strong>
          </div>
        </div>
      </aside>

      <section className="preview-stage">
        <div className="preview-stage__h">
          <div>
            <span className="lbl">— Écran {screen.number}</span>
            <h2 className="nm">
              {screen.label}
              <i>.</i>
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className={`pill pill--${preview.content.status}`}>
              {preview.content.status.toUpperCase()}
            </span>
            <span className="pill pill--accent">
              {palette.paletteName.toUpperCase()} · CMS PREVIEW
            </span>
          </div>
        </div>

        <ScreenComponent preview={preview} style={palette.css} />

        <p
          style={{
            color: "var(--ink-soft)",
            lineHeight: 1.5,
            margin: 0,
            maxWidth: "52ch",
            textAlign: "center",
          }}
        >
          {screen.description}
        </p>
      </section>
    </div>
  );
}
