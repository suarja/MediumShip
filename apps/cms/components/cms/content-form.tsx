"use client";

import { useMutation, useQuery } from "convex/react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { collectContentUrlWarnings } from "../../lib/content-url-warnings";

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

const emptyState: EditorState = {
  slug: "",
  title: "",
  summary: "",
  category: "",
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

function toEditorState(
  content: Doc<"contents"> | null | undefined,
): EditorState {
  if (!content) {
    return emptyState;
  }

  return {
    slug: content.slug,
    title: content.title,
    summary: content.summary,
    category: content.category,
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
      content.videoSource?.kind === "hosted" ? content.videoSource.uploadKey : "",
    playbackUrl:
      content.videoSource?.kind === "hosted"
        ? content.videoSource.playbackUrl
        : "",
  };
}

export function ContentForm({ selectedId }: ContentFormProps) {
  const content = useQuery(
    api.cms.queries.getContent,
    selectedId ? { id: selectedId as never } : "skip",
  );
  const updateContent = useMutation(api.cms.mutations.updateContent);
  const setContentStatus = useMutation(api.cms.mutations.setContentStatus);
  const [state, setState] = useState<EditorState>(emptyState);
  const [saveLabel, setSaveLabel] = useState("Save");
  const [metadataOpen, setMetadataOpen] = useState(false);

  useEffect(() => {
    if (content) {
      setState(toEditorState(content));
      setSaveLabel("Save");
      setMetadataOpen(false);
    }
  }, [content]);

  if (!selectedId) {
    return (
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Editor</p>
            <h2>Select content</h2>
          </div>
        </div>
        <p className="empty-copy">
          Pick a content item on the left, or create a new draft to start the first CMS slice.
        </p>
      </section>
    );
  }

  if (content === undefined) {
    return (
      <section className="panel">
        <p className="empty-copy">Loading editor…</p>
      </section>
    );
  }

  if (!content) {
    return (
      <section className="panel">
        <p className="empty-copy">This content item no longer exists.</p>
      </section>
    );
  }

  const onChange =
    (key: keyof EditorState) =>
    (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
      const value =
        event.currentTarget instanceof HTMLInputElement &&
        event.currentTarget.type === "checkbox"
          ? event.currentTarget.checked
          : event.currentTarget.value;
      setState((current) => ({ ...current, [key]: value }));
      setSaveLabel("Save");
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

    const fallbackSlug =
      state.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `draft-${content.kind}`;
    const fallbackCategory =
      state.category.trim() ||
      (content.kind === "article"
        ? "Analysis"
        : content.kind === "episode"
          ? "Podcast"
          : "Video");
    const articleWordCount = state.articleBody
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const estimatedReadingTime =
      articleWordCount > 0 ? Math.max(1, Math.ceil(articleWordCount / 220)) : null;

    await updateContent({
      id: content._id,
      slug: state.slug.trim() || fallbackSlug,
      title: state.title,
      summary: state.summary,
      category: fallbackCategory,
      tags: state.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      isPremium: state.isPremium,
      heroImageUrl: state.heroImageUrl || null,
      readingTimeMinutes:
        content.kind === "article"
          ? state.readingTimeMinutes
            ? Number(state.readingTimeMinutes)
            : estimatedReadingTime
          : null,
      articleBody: content.kind === "article" ? state.articleBody || null : null,
      audioUrl: content.kind === "episode" ? state.audioUrl || null : null,
      durationSeconds:
        (content.kind === "episode" || content.kind === "video") &&
        state.durationSeconds
          ? Number(state.durationSeconds)
          : null,
      videoSource:
        content.kind !== "video" || !state.videoSourceKind
          ? null
          : state.videoSourceKind === "youtube"
            ? {
                kind: "youtube",
                youtubeVideoId: "",
                youtubeUrl: state.youtubeUrl,
              }
            : {
                kind: "hosted",
                uploadKey: state.uploadKey,
                playbackUrl: state.playbackUrl,
              },
    });

    setSaveLabel("Saved");
  };

  const changeStatus = async (status: "draft" | "published" | "archived") => {
    await setContentStatus({ id: content._id, status });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Editor</p>
          <h2>{content.title}</h2>
        </div>
        <div className="stack-actions">
          <button className="ghost-button" onClick={() => changeStatus("draft")} type="button">
            Draft
          </button>
          <button className="ghost-button" onClick={() => changeStatus("published")} type="button">
            Publish
          </button>
          <button className="ghost-button" onClick={() => changeStatus("archived")} type="button">
            Archive
          </button>
        </div>
      </div>

      <div className="form-grid">
        <label className="field-wide">
          <span>Title</span>
          <input value={state.title} onChange={onChange("title")} />
        </label>
        <label className="field-wide">
          <span>Summary</span>
          <textarea value={state.summary} onChange={onChange("summary")} rows={3} />
        </label>
        <label className="field-wide">
          <span>Tags</span>
          <input
            value={state.tags}
            onChange={onChange("tags")}
            placeholder="policy, podcast, culture"
          />
        </label>

        {content.kind === "article" ? (
          <>
            <label className="field-wide">
              <span>Body</span>
              <textarea value={state.articleBody} onChange={onChange("articleBody")} rows={10} />
            </label>
          </>
        ) : null}

        {content.kind === "episode" ? (
          <>
            <label className="field-wide">
              <span>Audio URL</span>
              <input value={state.audioUrl} onChange={onChange("audioUrl")} />
            </label>
          </>
        ) : null}

        {content.kind === "video" ? (
          <>
            <label>
              <span>Video source</span>
              <select value={state.videoSourceKind} onChange={onChange("videoSourceKind")}>
                <option value="">None</option>
                <option value="youtube">YouTube</option>
                <option value="hosted">Hosted</option>
              </select>
            </label>
            {state.videoSourceKind === "youtube" ? (
              <label className="field-wide">
                <span>YouTube URL</span>
                <input value={state.youtubeUrl} onChange={onChange("youtubeUrl")} />
              </label>
            ) : null}
            {state.videoSourceKind === "hosted" ? (
              <>
                <label className="field-wide">
                  <span>Playback URL</span>
                  <input value={state.playbackUrl} onChange={onChange("playbackUrl")} />
                </label>
                <label className="field-wide">
                  <span>Upload key</span>
                  <input value={state.uploadKey} onChange={onChange("uploadKey")} />
                </label>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      <details
        className="advanced-fields"
        open={metadataOpen}
        onToggle={(event) =>
          setMetadataOpen((event.currentTarget as HTMLDetailsElement).open)
        }
      >
        <summary>Advanced metadata</summary>
        <div className="form-grid">
          <label>
            <span>Slug</span>
            <input
              value={state.slug}
              onChange={onChange("slug")}
              placeholder="Auto-generated from title if left blank"
            />
          </label>
          <label>
            <span>Category</span>
            <input
              value={state.category}
              onChange={onChange("category")}
              placeholder="Defaults from content type"
            />
          </label>
          <label className="field-wide">
            <span>Hero image URL</span>
            <input value={state.heroImageUrl} onChange={onChange("heroImageUrl")} />
          </label>
          <label className="field-wide checkbox-row">
            <input
              checked={state.isPremium}
              onChange={onChange("isPremium")}
              type="checkbox"
            />
            <span>Premium content</span>
          </label>

          {content.kind === "article" ? (
            <label>
              <span>Reading time override (minutes)</span>
              <input
                value={state.readingTimeMinutes}
                onChange={onChange("readingTimeMinutes")}
                placeholder="Auto-estimated from body if left blank"
                type="number"
              />
            </label>
          ) : null}

          {content.kind === "episode" || content.kind === "video" ? (
            <label>
              <span>Duration override (seconds)</span>
              <input
                value={state.durationSeconds}
                onChange={onChange("durationSeconds")}
                placeholder="Optional"
                type="number"
              />
            </label>
          ) : null}
        </div>
      </details>

      <div className="panel-footer">
        <span className={`status-pill status-${content.status}`}>{content.status}</span>
        <button className="primary-button" onClick={save} type="button">
          {saveLabel}
        </button>
      </div>
    </section>
  );
}
