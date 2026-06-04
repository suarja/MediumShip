"use client";

import { PreviewPane } from "./preview-pane";

type PreviewTabProps = {
  selectedId: string | null;
};

export function PreviewTab({ selectedId }: PreviewTabProps) {
  return (
    <main className="page">
      <section className="hero-strip">
        <p className="eyebrow">Public model snapshot</p>
        <h1>Preview</h1>
        <p className="topbar-copy">
          Le futur espace d’écrans device-first, branché dès maintenant sur `getPreview`.
        </p>
      </section>

      <PreviewPane key={selectedId ?? "none"} selectedId={selectedId} />
    </main>
  );
}
