"use client";

import type { Doc } from "../../../../convex/_generated/dataModel";
import { getCategoryIconGlyph } from "../../../../src/features/categories/category-icon-catalog";

export function CategoryList({
  items,
  onCreate,
  onQueryChange,
  onSelect,
  query,
  selectedId,
}: {
  items: Doc<"categories">[];
  onCreate: () => void;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
  query: string;
  selectedId: string | null;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar__card">
        <div className="sidebar__title-row">
          <h2 className="sidebar__t">Catégories</h2>
          <button
            aria-label="Ajouter"
            className="btn btn--ghost btn--icon"
            onClick={onCreate}
            type="button"
          >
            +
          </button>
        </div>

        <label className="search">
          <span className="ic">⌕</span>
          <input
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            placeholder="Chercher par libellé, slug…"
            type="search"
            value={query}
          />
        </label>

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
                  <span className="pill pill--kind">{getCategoryIconGlyph(item.iconKey)}</span>
                </span>
                <span className="item__meta">ordre {item.sortOrder}</span>
              </div>
              <h4 className="item__t">{item.label}</h4>
              <span className="item__slug">{item.slug}</span>
            </button>
          ))}

          {items.length === 0 ? (
            <div className="empty">
              <h3 className="empty__t">Aucune entrée</h3>
              <p className="empty__sub">Utilise + pour en créer une.</p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
