"use client";

import { useQuery } from "convex/react";
import type { CSSProperties } from "react";

import { api } from "../../../../convex/_generated/api";
import {
  isThemePaletteName,
  resolveTheme,
} from "../../../../src/features/theme/palette-catalog";

type PreviewPaneProps = {
  selectedId: string | null;
};

const STATUS_LABELS = {
  draft: "Draft preview",
  published: "Published preview",
  archived: "Archived preview",
} as const;

export function PreviewPane({ selectedId }: PreviewPaneProps) {
  const preview = useQuery(
    api.cms.queries.getPreview,
    selectedId ? { id: selectedId as never } : "skip",
  );

  if (!selectedId) {
    return (
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>No content selected</h2>
          </div>
        </div>
        <p className="empty-copy">
          Save and select a story, episode, or video to see the mobile-facing preview.
        </p>
      </section>
    );
  }

  if (preview === undefined) {
    return (
      <section className="panel">
        <p className="empty-copy">Loading preview…</p>
      </section>
    );
  }

  if (!preview) {
    return (
      <section className="panel">
        <p className="empty-copy">Preview unavailable for this content.</p>
      </section>
    );
  }

  const paletteName = preview.tenant.themeConfig?.paletteName;
  const theme = resolveTheme({
    paletteName: paletteName && isThemePaletteName(paletteName) ? paletteName : "brick",
  });

  return (
    <section className="panel preview-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Preview</p>
          <h2>Public model snapshot</h2>
        </div>
      </div>

      <article
        className="preview-card"
        style={
          {
            "--preview-canvas": theme.colors.canvas,
            "--preview-surface": theme.colors.surface,
            "--preview-heading": theme.colors.heading,
            "--preview-text": theme.colors.text,
            "--preview-muted": theme.colors.textMuted,
            "--preview-accent": theme.colors.accent,
            "--preview-accent-soft": theme.colors.accentSoft,
            "--preview-accent-contrast": theme.colors.accentContrast,
            "--preview-border": theme.colors.border,
            "--preview-premium": theme.colors.premium,
          } as CSSProperties
        }
      >
        <span className="preview-status">
          {STATUS_LABELS[preview.content.status]}
        </span>
        <span className="preview-kicker">
          {preview.content.kind} · {preview.content.category}
        </span>
        <h3>{preview.content.title}</h3>
        <p className="preview-summary">{preview.content.summary}</p>

        {preview.content.kind === "article" ? (
          <p className="preview-body">
            {preview.content.articleBody ?? "Add article body to complete the preview."}
          </p>
        ) : null}

        {preview.content.kind === "episode" ? (
          <div className="preview-inline-note">
            {preview.content.durationSeconds
              ? `${Math.round(preview.content.durationSeconds / 60)} min audio`
              : "Episode duration missing"}
          </div>
        ) : null}

        {preview.content.kind === "video" ? (
          <div className="preview-inline-note">
            {preview.content.videoSource?.kind === "youtube"
              ? `YouTube: ${preview.content.videoSource.youtubeVideoId}`
              : preview.content.videoSource?.kind === "hosted"
                ? `Hosted: ${preview.content.videoSource.uploadKey}`
                : "No video source configured"}
          </div>
        ) : null}

        {preview.content.isPremium ? (
          <div className="preview-premium">Premium gate visible on mobile detail</div>
        ) : null}
      </article>
    </section>
  );
}
