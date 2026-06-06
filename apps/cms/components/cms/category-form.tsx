"use client";

import { useMutation, useQuery } from "convex/react";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  CATEGORY_ICON_CATALOG,
  getCategoryIconGlyph,
  type CategoryIconKey,
} from "../../../../src/features/categories/category-icon-catalog";

type CategoryFormProps = {
  selectedId: string | null;
};

type EditorState = {
  label: string;
  slug: string;
  iconKey: CategoryIconKey;
  sortOrder: string;
};

const emptyState: EditorState = {
  label: "",
  slug: "",
  iconKey: "default",
  sortOrder: "0",
};

function toEditorState(category: Doc<"categories"> | null | undefined): EditorState {
  if (!category) {
    return emptyState;
  }

  return {
    label: category.label,
    slug: category.slug,
    iconKey: category.iconKey as CategoryIconKey,
    sortOrder: String(category.sortOrder),
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

export function CategoryForm({ selectedId }: CategoryFormProps) {
  const category = useQuery(
    api.cms.categories.getCmsCategory,
    selectedId ? { id: selectedId as Id<"categories"> } : "skip",
  );
  const updateCategory = useMutation(api.cms.categories.updateCategory);
  const deleteCategory = useMutation(api.cms.categories.deleteCategory);
  const [state, setState] = useState<EditorState>(emptyState);
  const [saveLabel, setSaveLabel] = useState("Enregistrer");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setState(toEditorState(category));
      setSaveLabel("Enregistrer");
      setErrorMessage(null);
    }
  }, [category]);

  if (!selectedId) {
    return (
      <section className="editor">
        <article className="editor__card">
          <p className="empty-copy">Sélectionne une entrée dans la liste ou crée-en une avec +.</p>
        </article>
      </section>
    );
  }

  if (!category) {
    return (
      <section className="editor">
        <article className="editor__card">
          <p className="empty-copy">Chargement…</p>
        </article>
      </section>
    );
  }

  const onTextChange =
    (key: keyof EditorState) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      setState((current) => {
        const next = { ...current, [key]: value };
        if (key === "label" && (!current.slug || current.slug === slugify(current.label))) {
          next.slug = slugify(value);
        }
        return next;
      });
      setSaveLabel("Enregistrer");
    };

  const onSave = async () => {
    setErrorMessage(null);
    try {
      await updateCategory({
        id: category._id,
        label: state.label.trim() || "Sans titre",
        slug: state.slug,
        iconKey: state.iconKey,
        sortOrder: Number.parseInt(state.sortOrder, 10) || 0,
      });
      setSaveLabel("Enregistré");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Échec de l'enregistrement");
    }
  };

  const onDelete = async () => {
    setErrorMessage(null);
    try {
      await deleteCategory({ id: category._id });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Suppression impossible");
    }
  };

  return (
    <section className="editor">
      <article className="editor__card">
        <div className="editor__head">
          <div>
            <div className="editor__crumb">
              <span>{getCategoryIconGlyph(state.iconKey)}</span>
              <span className="sep">·</span>
              <span>{state.slug || "sans-slug"}</span>
            </div>
            <input
              className="editor__title-input"
              onChange={onTextChange("label")}
              placeholder="Sans titre"
              value={state.label}
            />
          </div>

          <div className="editor__status-row">
            <button className="btn btn--surface btn--sm" onClick={() => void onDelete()} type="button">
              Supprimer
            </button>
            <button className="btn btn--primary btn--sm" onClick={() => void onSave()} type="button">
              {saveLabel}
            </button>
          </div>
        </div>

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <div className="fields-grid">
          <Field label="Slug">
            <input
              className="input input--mono"
              onChange={onTextChange("slug")}
              placeholder="analyses"
              value={state.slug}
            />
          </Field>

          <Field label="Ordre">
            <input
              className="input input--mono"
              inputMode="numeric"
              onChange={onTextChange("sortOrder")}
              value={state.sortOrder}
            />
          </Field>

          <Field label="Icône" wide>
            <div className="icon-picker">
              {CATEGORY_ICON_CATALOG.map((entry) => {
                const active = state.iconKey === entry.key;
                return (
                  <button
                    aria-pressed={active}
                    className={`icon-picker__btn ${active ? "on" : ""}`}
                    key={entry.key}
                    onClick={() => {
                      setState((current) => ({ ...current, iconKey: entry.key }));
                      setSaveLabel("Enregistrer");
                    }}
                    title={entry.label}
                    type="button"
                  >
                    <span className="icon-picker__glyph">{entry.glyph}</span>
                    <span className="icon-picker__label">{entry.label}</span>
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
      </article>
    </section>
  );
}
