"use client";

import { useState } from "react";

type CatalogNode = {
  _id: string;
  label: string;
  displayLabel: string;
  depth: number;
  externalId: string;
  slug: string;
  labelFr?: string;
  retired: boolean;
  canAdd: boolean;
};

type AddResult = { created: number; skipped: number };

type CatalogSearchResultsProps = {
  nodes: CatalogNode[];
  tenantSlugs: Set<string>;
  onAdd: (catalogNodeId: string, includeDescendants: boolean) => Promise<AddResult>;
};

export function CatalogSearchResults({
  nodes,
  tenantSlugs,
  onAdd,
}: CatalogSearchResultsProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Map<string, string>>(new Map());

  const handleAdd = async (nodeId: string, includeDescendants: boolean) => {
    const key = `${nodeId}:${includeDescendants ? "d" : "n"}`;
    setPending(key);
    try {
      const result = await onAdd(nodeId, includeDescendants);
      const msg =
        result.created > 0
          ? `✓ ${result.created} ajouté${result.created > 1 ? "s" : ""}${result.skipped > 0 ? `, ${result.skipped} ignoré${result.skipped > 1 ? "s" : ""}` : ""}`
          : `Déjà présent (${result.skipped} ignoré${result.skipped > 1 ? "s" : ""})`;
      setFeedback((prev) => new Map(prev).set(nodeId, msg));
      setTimeout(() => {
        setFeedback((prev) => {
          const next = new Map(prev);
          next.delete(nodeId);
          return next;
        });
      }, 3500);
    } catch (err) {
      const msg = `Erreur : ${err instanceof Error ? err.message : "inconnue"}`;
      setFeedback((prev) => new Map(prev).set(nodeId, msg));
    } finally {
      setPending(null);
    }
  };

  if (nodes.length === 0) return null;

  return (
    <ul className="catalog-results">
      {nodes.map((node) => {
        const inTenant = tenantSlugs.has(node.slug);
        const indentPx = Math.max(0, node.depth - 1) * 20;
        const fb = feedback.get(node._id);

        return (
          <li
            className="catalog-result-row"
            key={node._id}
            style={{ paddingLeft: `${indentPx + 14}px` }}
          >
            <div className="catalog-result-info">
              <span className="catalog-result-label">{node.displayLabel}</span>
              {node.labelFr &&
                node.labelFr !== node.label &&
                node.displayLabel !== node.label && (
                  <span className="catalog-result-fr">{node.label}</span>
                )}
              {node.labelFr &&
                node.labelFr !== node.label &&
                node.displayLabel !== node.labelFr && (
                  <span className="catalog-result-fr">{node.labelFr}</span>
                )}
              <span className="catalog-result-ext">{node.externalId}</span>
              {inTenant && (
                <span className="catalog-badge-tenant">Déjà dans le tenant</span>
              )}
            </div>

            {fb ? (
              <span className="catalog-result-fb">{fb}</span>
            ) : node.canAdd ? (
              <div className="catalog-result-actions">
                <button
                  className="ghost-button catalog-add-btn"
                  disabled={pending !== null}
                  onClick={() => void handleAdd(node._id, false)}
                  type="button"
                >
                  Ajouter
                </button>
                <button
                  className="ghost-button catalog-add-btn"
                  disabled={pending !== null}
                  onClick={() => void handleAdd(node._id, true)}
                  title="Inclut tous les descendants (sans les racines IPTC)"
                  type="button"
                >
                  + dérivés
                </button>
              </div>
            ) : (
              <span className="catalog-result-ext">Racine — non ajoutable</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
