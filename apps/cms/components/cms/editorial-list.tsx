"use client";

import type { Doc } from "../../../../convex/_generated/dataModel";

export type EditorialStatusFilter =
  | "all"
  | "published"
  | "draft"
  | "archived";

type EditorialListProps = {
  counts: Record<EditorialStatusFilter, number>;
  items: Doc<"contents">[];
  onCreate: (kind: "article" | "episode" | "video") => void;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
  onStatusFilterChange: (status: EditorialStatusFilter) => void;
  query: string;
  selectedId: string | null;
  statusFilter: EditorialStatusFilter;
};

const CREATE_ACTIONS: Array<{
  kind: "article" | "episode" | "video";
  label: string;
}> = [
  { kind: "article", label: "Article" },
  { kind: "episode", label: "Épisode" },
  { kind: "video", label: "Vidéo" },
];

const STATUS_LABEL: Record<EditorialStatusFilter, string> = {
  all: "Tous",
  published: "Published",
  draft: "Draft",
  archived: "Archived",
};

const KIND_LABEL: Record<Doc<"contents">["kind"], string> = {
  article: "ARTICLE",
  episode: "ÉPISODE",
  video: "VIDÉO",
};

const KIND_PILL: Record<Doc<"contents">["kind"], string> = {
  article: "pill--article",
  episode: "pill--episode",
  video: "pill--video",
};

const STATUS_PILL: Record<Doc<"contents">["status"], string> = {
  draft: "pill--draft",
  published: "pill--published",
  archived: "pill--archived",
};

function formatMeta(item: Doc<"contents">) {
  const date = new Date(item.publishedAt ?? item._creationTime);
  const formattedDate = Number.isNaN(date.getTime())
    ? "date inconnue"
    : new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
      }).format(date);

  return `${item.category} · ${formattedDate}`;
}

export function EditorialList({
  counts,
  items,
  onCreate,
  onQueryChange,
  onSelect,
  onStatusFilterChange,
  query,
  selectedId,
  statusFilter,
}: EditorialListProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar__card">
        <div className="sidebar__h">— Editorial desk</div>
        <h2 className="sidebar__t">Contenus</h2>

        <div className="newrow">
          {CREATE_ACTIONS.map((action) => (
            <button
              className="btn btn--ghost"
              key={action.kind}
              onClick={() => onCreate(action.kind)}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>

        <label className="search">
          <span className="ic">⌕</span>
          <input
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder="Chercher par titre, slug, tag…"
            type="search"
            value={query}
          />
        </label>

        <div className="filterset">
          <span className="filterset__lbl">— Statut</span>
          <div className="filterset__row">
            {(
              ["all", "published", "draft", "archived"] as EditorialStatusFilter[]
            ).map((filter) => (
              <button
                className={`chip ${statusFilter === filter ? "on" : ""}`}
                key={filter}
                onClick={() => onStatusFilterChange(filter)}
                type="button"
              >
                {STATUS_LABEL[filter]}
                <span className="count">{counts[filter]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="itemlist">
          {items.map((item) => (
            <button
              className={`item ${selectedId === item._id ? "on" : ""}`}
              key={item._id}
              onClick={() => onSelect(item._id)}
              type="button"
            >
              <div className="item__row1">
                <span className="item__pills">
                  <span className={`pill ${STATUS_PILL[item.status]}`}>
                    {item.status.toUpperCase()}
                  </span>
                  <span className={`pill ${KIND_PILL[item.kind]}`}>
                    {KIND_LABEL[item.kind]}
                  </span>
                </span>
                {item.isPremium ? (
                  <span className="pill pill--premium">★ PREMIUM</span>
                ) : null}
              </div>
              <h4 className="item__t">{item.title || "Sans titre"}</h4>
              <span className="item__slug">{item.slug || "sans-slug"}</span>
              <p className="item__sum">{item.summary || "—"}</p>
              <div className="item__meta">{formatMeta(item)}</div>
            </button>
          ))}

          {items.length === 0 ? (
            <div className="empty">
              <h3 className="empty__t">Aucun résultat</h3>
              <p className="empty__sub">
                Ajuste la recherche ou le filtre de statut pour retrouver un contenu.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
