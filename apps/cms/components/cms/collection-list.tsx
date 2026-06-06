"use client";

import type { Doc } from "../../../../convex/_generated/dataModel";

export type EditorialStatusFilter =
  | "all"
  | "published"
  | "draft"
  | "archived";

const STATUS_LABEL: Record<EditorialStatusFilter, string> = {
  all: "Tous",
  published: "Published",
  draft: "Draft",
  archived: "Archived",
};

const STATUS_PILL: Record<Doc<"collections">["status"], string> = {
  draft: "pill--draft",
  published: "pill--published",
  archived: "pill--archived",
};

function formatMeta(item: Doc<"collections">) {
  const date = new Date(item.updatedAt);
  const formattedDate = Number.isNaN(date.getTime())
    ? "date inconnue"
    : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);

  return `Collection · ${formattedDate}`;
}

export function CollectionList({
  counts,
  items,
  onCreate,
  onQueryChange,
  onSelect,
  onStatusFilterChange,
  query,
  selectedId,
  statusFilter,
}: {
  counts: Record<EditorialStatusFilter, number>;
  items: Doc<"collections">[];
  onCreate: () => void;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
  onStatusFilterChange: (status: EditorialStatusFilter) => void;
  query: string;
  selectedId: string | null;
  statusFilter: EditorialStatusFilter;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar__card">
        <div className="sidebar__h">— Collections desk</div>
        <h2 className="sidebar__t">Collections</h2>

        <div className="newrow">
          <button className="btn btn--ghost" onClick={onCreate} type="button">
            Collection
          </button>
        </div>

        <label className="search">
          <span className="ic">⌕</span>
          <input
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder="Chercher par titre, slug…"
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
                  <span className="pill pill--article">COLLECTION</span>
                </span>
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
                Ajuste la recherche ou crée une nouvelle collection.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
