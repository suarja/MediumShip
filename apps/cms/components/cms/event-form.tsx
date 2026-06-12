"use client";

import { useMutation, useQuery } from "convex/react";
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { R2UploadField } from "./r2-upload-field";

type EventFormProps = {
  selectedId: string | null;
};

type EditorState = {
  slug: string;
  title: string;
  summary: string;
  startsAt: string;
  locationLabel: string;
  mode: Doc<"events">["mode"];
  access: Doc<"events">["access"];
  coverImageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  communityUrl: string;
  descriptionLong: string;
};

const STATUS_PILL: Record<Doc<"events">["status"], string> = {
  scheduled: "pill--published",
  archived: "pill--archived",
};

const emptyState: EditorState = {
  slug: "",
  title: "",
  summary: "",
  startsAt: "",
  locationLabel: "",
  mode: "online",
  access: "free",
  coverImageUrl: "",
  ctaLabel: "",
  ctaUrl: "",
  communityUrl: "",
  descriptionLong: "",
};

function toEditorState(event: Doc<"events"> | null | undefined): EditorState {
  if (!event) {
    return emptyState;
  }

  return {
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    startsAt: event.startsAt,
    locationLabel: event.locationLabel,
    mode: event.mode,
    access: event.access,
    coverImageUrl: event.coverImageUrl ?? "",
    ctaLabel: event.ctaLabel ?? "",
    ctaUrl: event.ctaUrl ?? "",
    communityUrl: event.communityUrl ?? "",
    descriptionLong: event.descriptionLong ?? "",
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

export function EventForm({ selectedId }: EventFormProps) {
  const event = useQuery(
    api.cms.events.getCmsEvent,
    selectedId ? { id: selectedId as Id<"events"> } : "skip",
  );
  const updateEvent = useMutation(api.cms.events.updateEvent);
  const setEventStatus = useMutation(api.cms.events.setEventStatus);
  const [state, setState] = useState<EditorState>(emptyState);
  const [saveLabel, setSaveLabel] = useState("Enregistrer");

  useEffect(() => {
    if (event) {
      setState(toEditorState(event));
      setSaveLabel("Enregistrer");
    }
  }, [event]);

  if (!selectedId) {
    return (
      <section className="editor">
        <div className="empty">
          <h3 className="empty__t">Sélectionne un événement</h3>
          <p className="empty__sub">
            Choisis un événement à gauche ou crée-en un nouveau.
          </p>
        </div>
      </section>
    );
  }

  if (event === undefined) {
    return (
      <section className="editor">
        <div className="empty">
          <h3 className="empty__t">Chargement de l’éditeur</h3>
          <p className="empty__sub">Convex récupère l’événement sélectionné.</p>
        </div>
      </section>
    );
  }

  if (!event) {
    return (
      <section className="editor">
        <div className="empty">
          <h3 className="empty__t">Événement introuvable</h3>
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
      eventChange: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setState((current) => ({
        ...current,
        [key]: eventChange.currentTarget.value,
      }));
      setSaveLabel("Enregistrer");
    };

  const save = async () => {
    const normalizedSlug =
      state.slug.trim() || slugify(state.title) || `event-${Date.now()}`;

    try {
      await updateEvent({
        id: event._id,
        slug: normalizedSlug,
        title: state.title.trim() || "Sans titre",
        summary: state.summary.trim(),
        startsAt: state.startsAt.trim(),
        locationLabel: state.locationLabel.trim(),
        mode: state.mode,
        access: state.access,
        coverImageUrl: state.coverImageUrl.trim() || null,
        ctaLabel: state.ctaLabel.trim() || null,
        ctaUrl: state.ctaUrl.trim() || null,
        communityUrl: state.communityUrl.trim() || null,
        descriptionLong: state.descriptionLong.trim() || null,
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

  const changeStatus = async (status: Doc<"events">["status"]) => {
    await setEventStatus({ id: event._id, status });
  };

  return (
    <section className="editor">
      <article className="editor__card">
        <div className="editor__head">
          <div>
            <div className="editor__crumb">
              <span>Événement</span>
              <span className="sep">·</span>
              <span>{event.slug}</span>
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
              onClick={() => changeStatus("scheduled")}
              type="button"
            >
              Scheduled
            </button>
            <button
              className="btn btn--surface btn--sm"
              onClick={() => changeStatus("archived")}
              type="button"
            >
              Archived
            </button>
            <span className={`pill ${STATUS_PILL[event.status]}`}>
              {event.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="fields-grid">
          <Field label="Slug">
            <input
              className="input input--mono"
              onChange={onTextChange("slug")}
              placeholder="slug-evenement"
              value={state.slug}
            />
          </Field>

          <Field label="Date de début (ISO)">
            <input
              className="input input--mono"
              onChange={onTextChange("startsAt")}
              placeholder="2026-10-02T20:00:00.000Z"
              value={state.startsAt}
            />
          </Field>

          <Field label="Lieu / accès">
            <input
              className="input"
              onChange={onTextChange("locationLabel")}
              placeholder="Paris · 180 inscrits"
              value={state.locationLabel}
            />
          </Field>

          <Field label="Mode">
            <select
              className="select"
              onChange={onTextChange("mode")}
              value={state.mode}
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>

          <Field label="Accès">
            <select
              className="select"
              onChange={onTextChange("access")}
              value={state.access}
            >
              <option value="free">Free</option>
              <option value="member">Member</option>
              <option value="premium">Premium</option>
            </select>
          </Field>

          <Field label="Résumé" wide>
            <textarea
              className="textarea"
              onChange={onTextChange("summary")}
              placeholder="Résumé court pour l’agenda"
              rows={3}
              value={state.summary}
            />
          </Field>

          <Field label="Description longue" optional wide>
            <textarea
              className="textarea"
              onChange={onTextChange("descriptionLong")}
              placeholder="Détails complets de l’événement"
              rows={5}
              value={state.descriptionLong}
            />
          </Field>

          <R2UploadField
            accept="image/*"
            currentUrl={state.coverImageUrl}
            hint="Visuel pour la carte agenda."
            kind="image"
            label="Couverture"
            onUploaded={(_key, url) => {
              setState((current) => ({ ...current, coverImageUrl: url }));
              setSaveLabel("Enregistrer");
            }}
          />

          <Field label="CTA label" optional>
            <input
              className="input"
              onChange={onTextChange("ctaLabel")}
              placeholder="S'inscrire"
              value={state.ctaLabel}
            />
          </Field>

          <Field label="CTA URL" optional>
            <input
              className="input input--mono"
              onChange={onTextChange("ctaUrl")}
              placeholder="https://…"
              value={state.ctaUrl}
            />
          </Field>

          <Field label="Community URL" optional wide>
            <input
              className="input input--mono"
              onChange={onTextChange("communityUrl")}
              placeholder="https://discord.gg/…"
              value={state.communityUrl}
            />
          </Field>
        </div>

        <div className="editor__foot">
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
