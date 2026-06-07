"use client";

import { useMemo, useState } from "react";

import { buildCatalogResultTreeIndex } from "./catalog-result-tree";

type CatalogNode = {
  _id: string;
  label: string;
  displayLabel: string;
  depth: number;
  externalId: string;
  slug: string;
  labelFr?: string;
  parentId?: string;
  retired: boolean;
  canAdd: boolean;
  inTenant?: boolean;
  descendantsFullyInTenant?: boolean;
};

type ToggleMode = "self" | "descendants";

type CatalogSearchResultsProps = {
  nodes: CatalogNode[];
  onToggle: (
    catalogNodeId: string,
    mode: ToggleMode,
    remove: boolean,
  ) => Promise<void>;
};

export function CatalogSearchResults({
  nodes,
  onToggle,
}: CatalogSearchResultsProps) {
  const [pending, setPending] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<Map<string, string>>(new Map());
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  const tree = useMemo(() => buildCatalogResultTreeIndex(nodes), [nodes]);

  const handleToggle = async (
    nodeId: string,
    mode: ToggleMode,
    remove: boolean,
  ) => {
    const key = `${nodeId}:${mode}`;
    setPending(key);
    try {
      await onToggle(nodeId, mode, remove);
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

  const toggleCollapsed = (nodeId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  if (nodes.length === 0) return null;

  return (
    <ul className="catalog-results">
      {nodes.map((node) => {
        if (!tree.isVisible(node, collapsedIds)) {
          return null;
        }

        const inTenant = node.inTenant ?? false;
        const descendantsFullyInTenant = node.descendantsFullyInTenant ?? false;
        const hasChildren = tree.hasChildren(node._id);
        const isCollapsed = collapsedIds.has(node._id);
        const indentPx = Math.max(0, node.depth) * 20;
        const fb = errorFeedback.get(node._id);
        const selfPending = pending === `${node._id}:self`;
        const descendantsPending = pending === `${node._id}:descendants`;

        return (
          <li
            className={`catalog-result-row${inTenant ? " catalog-result-row--added" : ""}`}
            key={node._id}
            style={{ paddingLeft: `${indentPx + 14}px` }}
          >
            <div className="catalog-result-leading">
              {hasChildren ? (
                <button
                  aria-expanded={!isCollapsed}
                  aria-label={
                    isCollapsed
                      ? `Déplier ${node.displayLabel}`
                      : `Replier ${node.displayLabel}`
                  }
                  className="catalog-collapse-btn"
                  onClick={() => toggleCollapsed(node._id)}
                  type="button"
                >
                  {isCollapsed ? "▸" : "▾"}
                </button>
              ) : (
                <span aria-hidden="true" className="catalog-collapse-spacer" />
              )}
            </div>

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
                  Ajouté
                </span>
              )}
            </div>

            {fb ? (
              <span className="catalog-result-fb catalog-result-fb--error">{fb}</span>
            ) : node.canAdd ? (
              <div className="catalog-result-actions">
                <button
                  className={`ghost-button catalog-add-btn catalog-add-btn--self${
                    inTenant ? " is-active" : ""
                  }`}
                  disabled={pending !== null}
                  onClick={() => void handleToggle(node._id, "self", inTenant)}
                  type="button"
                >
                  {selfPending ? "…" : inTenant ? "Retirer" : "Ajouter"}
                </button>
                <button
                  className={`ghost-button catalog-add-btn catalog-add-btn--desc${
                    descendantsFullyInTenant ? " is-active" : ""
                  }`}
                  disabled={pending !== null}
                  onClick={() =>
                    void handleToggle(
                      node._id,
                      "descendants",
                      descendantsFullyInTenant,
                    )
                  }
                  title={
                    descendantsFullyInTenant
                      ? "Retire tous les descendants du tenant"
                      : "Inclut tous les descendants (sans les familles IPTC trop larges)"
                  }
                  type="button"
                >
                  {descendantsPending
                    ? "…"
                    : descendantsFullyInTenant
                      ? "Retirer dérivés"
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
