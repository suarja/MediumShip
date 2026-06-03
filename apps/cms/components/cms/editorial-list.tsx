"use client";

import type { Doc } from "../../../../convex/_generated/dataModel";

type EditorialListProps = {
  items: Doc<"contents">[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (kind: "article" | "episode" | "video") => void;
};

const CREATE_ACTIONS: Array<{
  kind: "article" | "episode" | "video";
  label: string;
}> = [
  { kind: "article", label: "New article" },
  { kind: "episode", label: "New episode" },
  { kind: "video", label: "New video" },
];

export function EditorialList({
  items,
  selectedId,
  onSelect,
  onCreate,
}: EditorialListProps) {
  return (
    <section className="panel panel-list">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Editorial desk</p>
          <h2>Contents</h2>
        </div>
        <div className="stack-actions">
          {CREATE_ACTIONS.map((action) => (
            <button
              key={action.kind}
              className="ghost-button"
              onClick={() => onCreate(action.kind)}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="list-column">
        {items.map((item) => (
          <button
            key={item._id}
            className={`list-card ${selectedId === item._id ? "is-selected" : ""}`}
            onClick={() => onSelect(item._id)}
            type="button"
          >
            <div className="list-card-top">
              <span className={`status-pill status-${item.status}`}>
                {item.status}
              </span>
              <span className="kind-pill">{item.kind}</span>
            </div>
            <strong>{item.title}</strong>
            <span className="list-meta">{item.slug}</span>
            <span className="list-summary">{item.summary}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
