"use client";

import { PreviewPane } from "./preview-pane";

type PreviewTabProps = {
  selectedId: string | null;
};

export function PreviewTab({ selectedId }: PreviewTabProps) {
  return (
    <main className="page">
      <PreviewPane key={selectedId ?? "none"} selectedId={selectedId} />
    </main>
  );
}
