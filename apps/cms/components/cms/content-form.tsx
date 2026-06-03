"use client";

import { useMutation, useQuery } from "convex/react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";

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
  youtubeVideoId: string;
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
  youtubeVideoId: "",
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
    youtubeVideoId:
      content.videoSource?.kind === "youtube"
        ? content.videoSource.youtubeVideoId
        : "",
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

  useEffect(() => {
    if (content) {
      setState(toEditorState(content));
      setSaveLabel("Save");
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
    await updateContent({
      id: content._id,
      slug: state.slug,
      title: state.title,
      summary: state.summary,
      category: state.category,
      tags: state.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      isPremium: state.isPremium,
      heroImageUrl: state.heroImageUrl || null,
      readingTimeMinutes:
        content.kind === "article" && state.readingTimeMinutes
          ? Number(state.readingTimeMinutes)
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
                youtubeVideoId: state.youtubeVideoId,
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
        <label>
          <span>Slug</span>
          <input value={state.slug} onChange={onChange("slug")} />
        </label>
        <label>
          <span>Category</span>
          <input value={state.category} onChange={onChange("category")} />
        </label>
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
        <label className="field-wide checkbox-row">
          <input
            checked={state.isPremium}
            onChange={onChange("isPremium")}
            type="checkbox"
          />
          <span>Premium content</span>
        </label>
        <label className="field-wide">
          <span>Hero image URL</span>
          <input value={state.heroImageUrl} onChange={onChange("heroImageUrl")} />
        </label>

        {content.kind === "article" ? (
          <>
            <label>
              <span>Reading time (minutes)</span>
              <input
                value={state.readingTimeMinutes}
                onChange={onChange("readingTimeMinutes")}
                type="number"
              />
            </label>
            <label className="field-wide">
              <span>Body</span>
              <textarea value={state.articleBody} onChange={onChange("articleBody")} rows={10} />
            </label>
          </>
        ) : null}

        {content.kind === "episode" ? (
          <>
            <label>
              <span>Duration (seconds)</span>
              <input
                value={state.durationSeconds}
                onChange={onChange("durationSeconds")}
                type="number"
              />
            </label>
            <label className="field-wide">
              <span>Audio URL</span>
              <input value={state.audioUrl} onChange={onChange("audioUrl")} />
            </label>
          </>
        ) : null}

        {content.kind === "video" ? (
          <>
            <label>
              <span>Duration (seconds)</span>
              <input
                value={state.durationSeconds}
                onChange={onChange("durationSeconds")}
                type="number"
              />
            </label>
            <label>
              <span>Video source</span>
              <select value={state.videoSourceKind} onChange={onChange("videoSourceKind")}>
                <option value="">None</option>
                <option value="youtube">YouTube</option>
                <option value="hosted">Hosted</option>
              </select>
            </label>
            {state.videoSourceKind === "youtube" ? (
              <>
                <label>
                  <span>YouTube video id</span>
                  <input value={state.youtubeVideoId} onChange={onChange("youtubeVideoId")} />
                </label>
                <label className="field-wide">
                  <span>YouTube URL</span>
                  <input value={state.youtubeUrl} onChange={onChange("youtubeUrl")} />
                </label>
              </>
            ) : null}
            {state.videoSourceKind === "hosted" ? (
              <>
                <label>
                  <span>Upload key</span>
                  <input value={state.uploadKey} onChange={onChange("uploadKey")} />
                </label>
                <label className="field-wide">
                  <span>Playback URL</span>
                  <input value={state.playbackUrl} onChange={onChange("playbackUrl")} />
                </label>
              </>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="panel-footer">
        <span className={`status-pill status-${content.status}`}>{content.status}</span>
        <button className="primary-button" onClick={save} type="button">
          {saveLabel}
        </button>
      </div>
    </section>
  );
}
