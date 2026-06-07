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
  tenantCatalogNodeIds: Set<string>;
  onAdd: (catalogNodeId: string, includeDescendants: boolean) => Promise<AddResult>;
};

export function CatalogSearchResults({
  nodes,
  tenantSlugs,
  tenantCatalogNodeIds,
  onAdd,
}: CatalogSearchResultsProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<Map<string, string>>(new Map());

  const handleAdd = async (nodeId: string, includeDescendants: boolean) => {
    const key = `${nodeId}:${includeDescendants ? "d" : "n"}`;
    setPending(key);
    try {
      await onAdd(nodeId, includeDescendants);
      setErrorFeedback((prev) => {
        const next = new Map(prev);
        next.delete(nodeId);
        return next;
      });
    } catch (err) {
      const msg = `Erreur : ${err instanceof Error ? err.message : "inconnue"}`;
      setErrorFeedback((prev) => new Map(prev).set(nodeId, msg));
    } finally {
      setPending(null);
    }
  };

  if (nodes.length === 0) return null;

  return (
    <ul className="catalog-results">
      {nodes.map((node) => {
        const inTenant =
          tenantCatalogNodeIds.has(node._id) || tenantSlugs.has(node.slug);
        const indentPx = Math.max(0, node.depth) * 20;
        const fb = errorFeedback.get(node._id);
        const isPending = pending?.startsWith(`${node._id}:`) ?? false;

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
                <span className="catalog-badge-tenant catalog-badge-tenant--added">
                  Ajouté au tenant
                </span>
              )}
            </div>

            {fb ? (
              <span className="catalog-result-fb catalog-result-fb--error">{fb}</span>
            ) : node.canAdd ? (
              <div className="catalog-result-actions">
                <button
                  aria-disabled={inTenant}
                  className={`ghost-button catalog-add-btn${inTenant ? " catalog-add-btn--added" : ""}`}
                  disabled={inTenant || pending !== null}
                  onClick={() => void handleAdd(node._id, false)}
                  type="button"
                >
                  {inTenant ? "Ajouté" : isPending && pending?.endsWith(":n") ? "…" : "Ajouter"}
                </button>
                <button
                  aria-disabled={inTenant}
                  className={`ghost-button catalog-add-btn${inTenant ? " catalog-add-btn--added" : ""}`}
                  disabled={inTenant || pending !== null}
                  onClick={() => void handleAdd(node._id, true)}
                  title="Inclut tous les descendants (sans les familles IPTC trop larges)"
                  type="button"
                >
                  {inTenant
                    ? "Ajouté"
                    : isPending && pending?.endsWith(":d")
                      ? "…"
                      : "+ dérivés"}
                </button>
              </div>
            ) : (
              <span className="catalog-result-ext">Famille IPTC trop large</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
