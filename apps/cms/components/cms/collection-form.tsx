"use client";

import { useMutation, useQuery } from "convex/react";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { R2UploadField } from "./r2-upload-field";

type CollectionFormProps = {
  selectedId: string | null;
};

type EditorState = {
  slug: string;
  title: string;
  summary: string;
  coverImageUrl: string;
};

const STATUS_PILL: Record<Doc<"collections">["status"], string> = {
  draft: "pill--draft",
  published: "pill--published",
  archived: "pill--archived",
};

const emptyState: EditorState = {
  slug: "",
  title: "",
  summary: "",
  coverImageUrl: "",
};

function toEditorState(
  collection: Doc<"collections"> | null | undefined,
): EditorState {
  if (!collection) {
    return emptyState;
  }

  return {
    slug: collection.slug,
    title: collection.title,
    summary: collection.summary,
    coverImageUrl: collection.coverImageUrl ?? "",
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

export function CollectionForm({ selectedId }: CollectionFormProps) {
  const detail = useQuery(
    api.cms.collections.getCmsCollection,
    selectedId ? { id: selectedId as Id<"collections"> } : "skip",
  );
  const publishedContents = useQuery(api.cms.queries.listContents, {});
  const updateCollection = useMutation(api.cms.collections.updateCollection);
  const setCollectionStatus = useMutation(api.cms.collections.setCollectionStatus);
  const setCollectionItems = useMutation(api.cms.collections.setCollectionItems);
  const [state, setState] = useState<EditorState>(emptyState);
  const [itemQuery, setItemQuery] = useState("");
  const [saveLabel, setSaveLabel] = useState("Enregistrer");

  const collection = detail?.collection;
  const selectedContentIds = useMemo(
    () => detail?.items.map((item) => item.contentId) ?? [],
    [detail?.items],
  );

  useEffect(() => {
    if (collection) {
      setState(toEditorState(collection));
      setSaveLabel("Enregistrer");
    }
  }, [collection]);

  const publishedPickerItems = useMemo(
    () =>
      (publishedContents ?? []).filter((item) => {
        if (item.status !== "published") {
          return false;
        }

        if (!itemQuery.trim()) {
          return true;
        }

        const haystack = [item.title, item.slug, item.category]
          .join(" ")
          .toLowerCase();
        return haystack.includes(itemQuery.trim().toLowerCase());
      }),
    [itemQuery, publishedContents],
  );

  if (!selectedId) {
    return (
      <section className="editor">
        <div className="empty">
          <h3 className="empty__t">Sélectionne une collection</h3>
          <p className="empty__sub">
            Choisis une collection à gauche ou crée-en une nouvelle.
          </p>
        </div>
      </section>
    );
  }

  if (detail === undefined) {
    return (
      <section className="editor">
        <div className="empty">
          <h3 className="empty__t">Chargement de l’éditeur</h3>
          <p className="empty__sub">Convex récupère la collection sélectionnée.</p>
        </div>
      </section>
    );
  }

  if (!collection) {
    return (
      <section className="editor">
        <div className="empty">
          <h3 className="empty__t">Collection introuvable</h3>
          <p className="empty__sub">
            L’item n’existe plus ou a été supprimé côté backend.
          </p>
        </div>
      </section>
    );
  }

  const onTextChange =
    (key: keyof EditorState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Read synchronously: React nulls currentTarget before the deferred
      // setState updater runs (reading it there crashes "reading 'value'").
      const value = event.currentTarget.value;
      setState((current) => ({ ...current, [key]: value }));
      setSaveLabel("Enregistrer");
    };

  const save = async () => {
    const normalizedSlug =
      state.slug.trim() || slugify(state.title) || `collection-${Date.now()}`;

    try {
      await updateCollection({
        id: collection._id,
        slug: normalizedSlug,
        title: state.title.trim() || "Sans titre",
        summary: state.summary.trim(),
        coverImageUrl: state.coverImageUrl.trim() || null,
      });

      setSaveLabel("Enregistré");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setSaveLabel(
        message.includes("Slug already exists")
          ? "Slug déjà utilisé — choisis-en un autre"
          : "Erreur — non enregistré",
      );
    }
  };

  const changeStatus = async (status: Doc<"collections">["status"]) => {
    await setCollectionStatus({ id: collection._id, status });
  };

  const moveItem = async (contentId: Id<"contents">, direction: -1 | 1) => {
    const index = selectedContentIds.indexOf(contentId);
    if (index < 0) {
      return;
    }

    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= selectedContentIds.length) {
      return;
    }

    const nextIds = [...selectedContentIds];
    const [removed] = nextIds.splice(index, 1);
    nextIds.splice(nextIndex, 0, removed);

    await setCollectionItems({
      collectionId: collection._id,
      contentIds: nextIds,
    });
  };

  const addItem = async (contentId: Id<"contents">) => {
    if (selectedContentIds.includes(contentId)) {
      return;
    }

    await setCollectionItems({
      collectionId: collection._id,
      contentIds: [...selectedContentIds, contentId],
    });
  };

  const removeItem = async (contentId: Id<"contents">) => {
    await setCollectionItems({
      collectionId: collection._id,
      contentIds: selectedContentIds.filter((id) => id !== contentId),
    });
  };

  return (
    <section className="editor">
      <article className="editor__card">
        <div className="editor__head">
          <div>
            <div className="editor__crumb">
              <span>Collection</span>
              <span className="sep">·</span>
              <span>{collection.slug}</span>
            </div>
            <input
              className="editor__title-input"
              onChange={onTextChange("title")}
              placeholder="Sans titre"
              value={state.title}
            />
          </div>

          <div className="editor__status-row">
            <button
              className="btn btn--surface btn--sm"
              onClick={() => changeStatus("draft")}
              type="button"
            >
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
            <span className={`pill ${STATUS_PILL[collection.status]}`}>
              {collection.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="fields-grid">
          <Field label="Slug">
            <input
              className="input input--mono"
              onChange={onTextChange("slug")}
              placeholder="slug-de-collection"
              value={state.slug}
            />
          </Field>

          <Field label="Résumé" wide>
            <textarea
              className="textarea"
              onChange={onTextChange("summary")}
              placeholder="Résumé public de la collection"
              rows={3}
              value={state.summary}
            />
          </Field>

          <R2UploadField
            accept="image/*"
            currentUrl={state.coverImageUrl}
            hint="Image de couverture pour l’explore mobile."
            kind="image"
            label="Couverture"
            onUploaded={(_key, url) => {
              setState((current) => ({ ...current, coverImageUrl: url }));
              setSaveLabel("Enregistrer");
            }}
          />

          <div className="field field--wide">
            <span className="field__lbl">Contenus de la collection</span>
            <div className="itemlist" style={{ marginTop: 12 }}>
              {(detail.items ?? []).map((item) => (
                <div className="item" key={item.contentId} style={{ cursor: "default" }}>
                  <div className="item__row1">
                    <span className="item__pills">
                      <span className="pill pill--article">
                        {item.kind.toUpperCase()}
                      </span>
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn--surface btn--sm"
                        onClick={() => moveItem(item.contentId, -1)}
                        type="button"
                      >
                        ↑
                      </button>
                      <button
                        className="btn btn--surface btn--sm"
                        onClick={() => moveItem(item.contentId, 1)}
                        type="button"
                      >
                        ↓
                      </button>
                      <button
                        className="btn btn--surface btn--sm"
                        onClick={() => removeItem(item.contentId)}
                        type="button"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                  <h4 className="item__t">{item.title}</h4>
                  <span className="item__slug">{item.slug}</span>
                </div>
              ))}

              {(detail.items ?? []).length === 0 ? (
                <p className="empty__sub">Aucun contenu attaché pour l’instant.</p>
              ) : null}
            </div>

            <label className="search" style={{ marginTop: 16 }}>
              <span className="ic">⌕</span>
              <input
                onChange={(event) => setItemQuery(event.currentTarget.value)}
                placeholder="Ajouter un contenu publié…"
                type="search"
                value={itemQuery}
              />
            </label>

            <div className="itemlist" style={{ marginTop: 12 }}>
              {publishedPickerItems
                .filter((item) => !selectedContentIds.includes(item._id))
                .slice(0, 8)
                .map((item) => (
                  <button
                    className="item"
                    key={item._id}
                    onClick={() => addItem(item._id)}
                    type="button"
                  >
                    <div className="item__row1">
                      <span className="item__pills">
                        <span className="pill pill--published">PUBLISHED</span>
                        <span className="pill pill--article">
                          {item.kind.toUpperCase()}
                        </span>
                      </span>
                    </div>
                    <h4 className="item__t">{item.title}</h4>
                    <span className="item__slug">{item.slug}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="editor__foot">
          <div className="editor__foot-l">
            <span>
              Mis à jour ·{" "}
              {new Intl.DateTimeFormat("fr-FR", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(collection.updatedAt)}
            </span>
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
