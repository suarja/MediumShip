"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { extractYoutubeVideoId } from "../../../../convex/youtube/helpers";
import { defaultTenant } from "../../../../src/features/tenant/default-tenant";
import { collectContentUrlWarnings } from "../../lib/content-url-warnings";
import { R2UploadField } from "./r2-upload-field";

type ContentFormProps = {
  selectedId: string | null;
};

type EditorState = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string;
  isPremium: boolean;
  heroImageUrl: string;
  readingTimeMinutes: string;
  articleBody: string;
  audioUrl: string;
  durationSeconds: string;
  videoSourceKind: "" | "youtube" | "hosted";
  youtubeUrl: string;
  uploadKey: string;
  playbackUrl: string;
};

const CATEGORY_OPTIONS = [
  "Actualités",
  "Analyses",
  "Podcasts",
  "Agenda",
  "Bibliothèque",
  "Économie",
  "Culture",
];

const KIND_LABEL: Record<Doc<"contents">["kind"], string> = {
  article: "Article",
  episode: "Épisode",
  video: "Vidéo",
};

const STATUS_PILL: Record<Doc<"contents">["status"], string> = {
  draft: "pill--draft",
  published: "pill--published",
  archived: "pill--archived",
};

const emptyState: EditorState = {
  slug: "",
  title: "",
  summary: "",
  category: CATEGORY_OPTIONS[1],
  tags: "",
  isPremium: false,
  heroImageUrl: "",
  readingTimeMinutes: "",
  articleBody: "",
  audioUrl: "",
  durationSeconds: "",
  videoSourceKind: "",
  youtubeUrl: "",
  uploadKey: "",
  playbackUrl: "",
};

function toEditorState(content: Doc<"contents"> | null | undefined): EditorState {
  if (!content) {
    return emptyState;
  }

  return {
    slug: content.slug,
    title: content.title,
    summary: content.summary,
    category: content.category || CATEGORY_OPTIONS[1],
    tags: content.tags.join(", "),
    isPremium: content.isPremium,
    heroImageUrl: content.heroImageUrl ?? "",
    readingTimeMinutes:
      content.readingTimeMinutes !== undefined
        ? String(content.readingTimeMinutes)
        : "",
    articleBody: content.articleBody ?? "",
    audioUrl: content.audioUrl ?? "",
    durationSeconds:
      content.durationSeconds !== undefined ? String(content.durationSeconds) : "",
    videoSourceKind: content.videoSource?.kind ?? "",
    youtubeUrl:
      content.videoSource?.kind === "youtube"
        ? content.videoSource.youtubeUrl
        : "",
    uploadKey:
      content.videoSource?.kind === "hosted"
        ? content.videoSource.uploadKey
        : "",
    playbackUrl:
      content.videoSource?.kind === "hosted"
        ? content.videoSource.playbackUrl
        : "",
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatTimestamp(value: number | string | undefined) {
  if (!value) {
    return "Date inconnue";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Field({
  children,
  label,
  optional,
  wide,
}: {
  children: ReactNode;
  label: string;
  optional?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`field ${wide ? "field--wide" : ""}`}>
      <span className="field__lbl">
        {label}
        {optional ? <span className="opt">facultatif</span> : null}
      </span>
      {children}
    </div>
  );
}

export function ContentForm({ selectedId }: ContentFormProps) {
  const categoryRows = useQuery(api.categories.queries.listCategoryOptions, {
    tenantSlug: defaultTenant.slug,
  });
  const categoryOptions =
    categoryRows && categoryRows.length > 0
      ? categoryRows
      : CATEGORY_OPTIONS.map((label) => ({ label, icon: "◉", iconKey: "default" }));
  const content = useQuery(
    api.cms.queries.getContent,
    selectedId ? { id: selectedId as never } : "skip",
  );
  const enrichFromYoutube = useAction(api.youtube.enrich.enrichFromYoutube);
  const updateContent = useMutation(api.cms.mutations.updateContent);
  const setContentStatus = useMutation(api.cms.mutations.setContentStatus);
  const [state, setState] = useState<EditorState>(emptyState);
  const [enrichMessage, setEnrichMessage] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [saveLabel, setSaveLabel] = useState("Enregistrer");

  useEffect(() => {
    if (content) {
      setState(toEditorState(content));
      setEnrichMessage(null);
      setSaveLabel("Enregistrer");
    }
  }, [content]);

  if (!selectedId) {
    return (
      <section className="editor">
        <div className="empty">
          <h3 className="empty__t">Sélectionne un contenu</h3>
          <p className="empty__sub">
            Choisis un item à gauche ou crée un nouvel Article, Épisode ou Vidéo.
          </p>
        </div>
      </section>
    );
  }

  if (content === undefined) {
    return (
      <section className="editor">
        <div className="empty">
          <h3 className="empty__t">Chargement de l’éditeur</h3>
          <p className="empty__sub">Convex récupère la fiche éditoriale sélectionnée.</p>
        </div>
      </section>
    );
  }

  if (!content) {
    return (
      <section className="editor">
        <div className="empty">
          <h3 className="empty__t">Contenu introuvable</h3>
          <p className="empty__sub">
            L’item n’existe plus ou a été supprimé côté backend.
          </p>
        </div>
      </section>
    );
  }

  const onTextChange =
    (key: keyof EditorState) =>
    (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
      const value = event.currentTarget.value;
      setState((current) => ({ ...current, [key]: value }));
      setSaveLabel("Enregistrer");
    };

  const onBooleanChange =
    (key: keyof EditorState) => (event: ChangeEvent<HTMLInputElement>) => {
      const { checked } = event.currentTarget;
      setState((current) => ({ ...current, [key]: checked }));
      setSaveLabel("Enregistrer");
    };

  const save = async () => {
    const warnings = collectContentUrlWarnings({
      kind: content.kind,
      audioUrl: state.audioUrl,
      heroImageUrl: state.heroImageUrl,
      videoSourceKind: state.videoSourceKind,
      youtubeUrl: state.youtubeUrl,
      playbackUrl: state.playbackUrl,
    });

    if (warnings.length > 0) {
      const proceed = window.confirm(
        `⚠️ Vérifie les URLs avant d'enregistrer :\n\n- ${warnings.join(
          "\n- ",
        )}\n\nEnregistrer quand même ?`,
      );
      if (!proceed) {
        return;
      }
    }

    const articleWordCount = state.articleBody
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const estimatedReadingTime =
      articleWordCount > 0 ? Math.max(1, Math.ceil(articleWordCount / 220)) : null;
    const normalizedSlug = state.slug.trim() || slugify(state.title) || `draft-${content.kind}`;
    const youtubeVideoId =
      content.kind === "video" && state.videoSourceKind === "youtube"
        ? extractYoutubeVideoId(state.youtubeUrl.trim()) ?? ""
        : "";

    await updateContent({
      id: content._id,
      slug: normalizedSlug,
      title: state.title.trim() || "Sans titre",
      summary: state.summary.trim(),
      category: state.category.trim() || CATEGORY_OPTIONS[1],
      tags: state.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      isPremium: state.isPremium,
      heroImageUrl: state.heroImageUrl.trim() || null,
      readingTimeMinutes:
        content.kind === "article"
          ? state.readingTimeMinutes
            ? Number(state.readingTimeMinutes)
            : estimatedReadingTime
          : null,
      articleBody: content.kind === "article" ? state.articleBody || null : null,
      audioUrl: content.kind === "episode" ? state.audioUrl.trim() || null : null,
      durationSeconds:
        content.kind === "episode" || content.kind === "video"
          ? state.durationSeconds
            ? Number(state.durationSeconds)
            : null
          : null,
      videoSource:
        content.kind !== "video" || !state.videoSourceKind
          ? null
          : state.videoSourceKind === "youtube"
            ? {
                kind: "youtube",
                youtubeVideoId,
                youtubeUrl: state.youtubeUrl.trim(),
              }
            : {
                kind: "hosted",
                uploadKey: state.uploadKey.trim(),
                playbackUrl: state.playbackUrl.trim(),
              },
    });

    setSaveLabel("Enregistré");
  };

  const changeStatus = async (status: "draft" | "published" | "archived") => {
    await setContentStatus({ id: content._id, status });
  };

  const handleYoutubeEnrich = async () => {
    if (!state.youtubeUrl.trim()) {
      return;
    }

    setEnriching(true);
    setEnrichMessage(null);

    try {
      const result = await enrichFromYoutube({
        youtubeUrl: state.youtubeUrl.trim(),
      });

      if (!result.enriched) {
        const message =
          result.reason === "not-a-youtube-url"
            ? "Le lien fourni ne ressemble pas à une URL YouTube valide."
            : result.reason === "missing-api-key"
              ? "La variable YOUTUBE_DATA_API_KEY n’est pas configurée sur Convex."
              : "Impossible de récupérer la vidéo (quota ou vidéo introuvable).";
        setEnrichMessage(message);
        return;
      }

      setState((current) => ({
        ...current,
        durationSeconds: result.durationSeconds
          ? String(result.durationSeconds)
          : current.durationSeconds,
        heroImageUrl: result.thumbnailUrl || current.heroImageUrl,
        title: current.title.trim() ? current.title : result.title,
      }));
      setEnrichMessage("Enrichissement YouTube appliqué à l’éditeur.");
      setSaveLabel("Enregistrer");
    } catch {
      setEnrichMessage("L’enrichissement YouTube a échoué.");
    } finally {
      setEnriching(false);
    }
  };

  return (
    <section className="editor">
      <article className="editor__card">
        <div className="editor__head">
          <div>
            <div className="editor__crumb">
              <span>{KIND_LABEL[content.kind]}</span>
              <span className="sep">·</span>
              <span>{content.slug}</span>
            </div>
            <input
              className="editor__title-input"
              onChange={onTextChange("title")}
              placeholder="Sans titre"
              value={state.title}
            />
          </div>

          <div className="editor__status-row">
            <button className="btn btn--surface btn--sm" onClick={() => changeStatus("draft")} type="button">
              Draft
            </button>
            <button
              className="btn btn--surface btn--sm"
              onClick={() => changeStatus("published")}
              type="button"
            >
              Published
            </button>
            <button
              className="btn btn--surface btn--sm"
              onClick={() => changeStatus("archived")}
              type="button"
            >
              Archived
            </button>
            <span className={`pill ${STATUS_PILL[content.status]}`}>
              {content.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="fields-grid">
          <Field label="Slug">
            <input
              className="input input--mono"
              onChange={onTextChange("slug")}
              placeholder="slug-du-contenu"
              value={state.slug}
            />
          </Field>

          <Field label="Catégorie">
            <select
              className="select"
              onChange={onTextChange("category")}
              value={state.category}
            >
              {categoryOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Résumé" wide>
            <textarea
              className="textarea"
              onChange={onTextChange("summary")}
              placeholder="Une phrase ou deux, affichée dans le feed."
              rows={3}
              value={state.summary}
            />
          </Field>

          <Field label="Tags" wide>
            <input
              className="input"
              onChange={onTextChange("tags")}
              placeholder="politique, culture, analyse"
              value={state.tags}
            />
          </Field>

          <R2UploadField
            accept="image/*"
            currentUrl={state.heroImageUrl}
            hint="Upload R2 (recommandé) — ou colle une URL distante ci-dessous."
            kind="image"
            label="Cover"
            onUploaded={(_key, url) => {
              setState((current) => ({ ...current, heroImageUrl: url }));
              setSaveLabel("Enregistrer");
            }}
          />

          <Field label="Cover URL (upload ou URL distante)" wide>
            <input
              className="input input--mono"
              onChange={onTextChange("heroImageUrl")}
              placeholder="https://…/cover.jpg"
              value={state.heroImageUrl}
            />
          </Field>

          {content.kind === "article" ? (
            <>
              <Field label="Temps de lecture override" optional>
                <input
                  className="input input--mono"
                  onChange={onTextChange("readingTimeMinutes")}
                  placeholder="Auto"
                  type="number"
                  value={state.readingTimeMinutes}
                />
              </Field>

              <Field label="Corps de l’article" wide>
                <textarea
                  className="textarea textarea--body"
                  onChange={onTextChange("articleBody")}
                  placeholder="Écrivez ici…"
                  value={state.articleBody}
                />
              </Field>
            </>
          ) : null}

          {content.kind === "episode" ? (
            <>
              <Field label="Audio URL" wide>
                <input
                  className="input input--mono"
                  onChange={onTextChange("audioUrl")}
                  placeholder="https://…/episode.mp3"
                  value={state.audioUrl}
                />
              </Field>

              <Field label="Durée (secondes)" optional>
                <input
                  className="input input--mono"
                  onChange={onTextChange("durationSeconds")}
                  placeholder="ex. 3240"
                  type="number"
                  value={state.durationSeconds}
                />
              </Field>
            </>
          ) : null}

          {content.kind === "video" ? (
            <>
              <Field label="Source vidéo">
                <select
                  className="select"
                  onChange={(event) => {
                    const value = event.currentTarget.value as EditorState["videoSourceKind"];
                    setState((current) => ({ ...current, videoSourceKind: value }));
                    setSaveLabel("Enregistrer");
                  }}
                  value={state.videoSourceKind}
                >
                  <option value="">Choisir</option>
                  <option value="youtube">YouTube</option>
                  <option value="hosted">Hosted</option>
                </select>
              </Field>

              <Field label="Durée (secondes)" optional>
                <input
                  className="input input--mono"
                  onChange={onTextChange("durationSeconds")}
                  placeholder="ex. 3840"
                  type="number"
                  value={state.durationSeconds}
                />
              </Field>

              {state.videoSourceKind === "youtube" ? (
                <div className="field field--wide">
                  <span className="field__lbl">YouTube URL</span>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <input
                      className="input input--mono"
                      onChange={onTextChange("youtubeUrl")}
                      placeholder="https://youtube.com/watch?v=…"
                      value={state.youtubeUrl}
                    />
                    <button
                      className="btn btn--surface"
                      disabled={!state.youtubeUrl.trim() || enriching}
                      onClick={handleYoutubeEnrich}
                      type="button"
                    >
                      {enriching ? "Enrich…" : "Enrichir"}
                    </button>
                  </div>
                  {enrichMessage ? (
                    <div className="upload__d" style={{ marginTop: 8 }}>
                      {enrichMessage}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {state.videoSourceKind === "hosted" ? (
                <>
                  <R2UploadField
                    accept="video/*"
                    currentUrl={state.playbackUrl}
                    hint={
                      state.uploadKey
                        ? `Hébergé sur R2 · clé ${state.uploadKey}`
                        : "Upload MP4 vers R2 — ou colle une URL de stream ci-dessous."
                    }
                    kind="video"
                    label="Fichier vidéo (R2)"
                    onUploaded={(key, url) => {
                      setState((current) => ({
                        ...current,
                        playbackUrl: url,
                        uploadKey: key,
                      }));
                      setSaveLabel("Enregistrer");
                    }}
                  />

                  <Field label="Playback URL (upload ou stream externe)" wide>
                    <input
                      className="input input--mono"
                      onChange={onTextChange("playbackUrl")}
                      placeholder="https://…/master.m3u8"
                      value={state.playbackUrl}
                    />
                  </Field>
                </>
              ) : null}
            </>
          ) : null}

          <div className="field field--wide">
            <div className="premium-block">
              <div className="premium-block__h">
                <span className="premium-block__t">Contenu premium</span>
                <label className="toggle">
                  <input
                    checked={state.isPremium}
                    onChange={onBooleanChange("isPremium")}
                    type="checkbox"
                  />
                  <span className="toggle__sw" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="editor__foot">
          <div className="editor__foot-l">
            <span>Créé · {formatTimestamp(content._creationTime)}</span>
            <span>Publié · {formatTimestamp(content.publishedAt)}</span>
          </div>
          <div className="editor__foot-r">
            <button className="btn btn--primary btn--lg" onClick={save} type="button">
              {saveLabel}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
