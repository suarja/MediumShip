"use client";

import { EditorialList } from "./editorial-list";
import { ContentForm } from "./content-form";

type ContentsTabProps = {
  selectedId: string | null;
  onCreate: (kind: "article" | "episode" | "video") => void;
  onSelect: (id: string) => void;
  items: Parameters<typeof EditorialList>[0]["items"];
};

export function ContentsTab({
  items,
  onCreate,
  onSelect,
  selectedId,
}: ContentsTabProps) {
  return (
    <main className="page">
      <section className="hero-strip">
        <p className="eyebrow">Editorial desk</p>
        <h1>Contenus</h1>
        <p className="topbar-copy">
          Premier wiring réel sur Convex avant la refonte pixel-perfect de la maquette.
        </p>
      </section>

      <div className="cms-grid">
        <EditorialList
          items={items}
          onCreate={onCreate}
          onSelect={onSelect}
          selectedId={selectedId}
        />
        <ContentForm key={selectedId ?? "none"} selectedId={selectedId} />
      </div>
    </main>
  );
}
