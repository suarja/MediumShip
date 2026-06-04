"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import { api } from "../../../../convex/_generated/api";

// CMS Users tab: the manual write adapter for the modular entitlement. Lists
// every known user joined with their member ("premium") status and offers a
// grant/revoke toggle that calls the admin-guarded Convex mutations. Mirrors
// the design language of the Contenus / Tenant tabs (.page / .panel / .toggle).
//
// When a payment-provider webhook is wired later, those events upsert the same
// `entitlements` row — this tab keeps reflecting the truth without change.
export function UsersTab() {
  const users = useQuery(api.cms.queries.listUsers, {});
  const grantMembership = useMutation(api.entitlements.mutations.grantMembership);
  const revokeMembership = useMutation(
    api.entitlements.mutations.revokeMembership,
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  const toggleMembership = async (userId: string, nextIsPro: boolean) => {
    setPendingId(userId);
    try {
      if (nextIsPro) {
        await grantMembership({ userId: userId as never });
      } else {
        await revokeMembership({ userId: userId as never });
      }
    } finally {
      setPendingId(null);
    }
  };

  return (
    <main className="page">
      <div className="page__head">
        <div>
          <span className="page__crumb">Membres</span>
          <h1 className="page__title">
            Accès <i>membre.</i>
          </h1>
          <p className="page__sub">
            Source de vérité unique des entitlements. Accorde ou retire l’accès
            premium manuellement — un webhook RevenueCat/Stripe écrira plus tard
            la même table sans changer cet écran.
          </p>
        </div>
      </div>

      <section className="panel" style={{ padding: "1.4rem" }}>
        {users === undefined ? (
          <p className="empty-copy">Chargement des utilisateurs…</p>
        ) : users.length === 0 ? (
          <p className="empty-copy">
            Aucun utilisateur enregistré pour l’instant. Les comptes apparaissent
            ici après leur première connexion Clerk.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {users.map((user) => (
              <div
                key={user._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "12px 14px",
                  border: "1px solid var(--rule)",
                  borderRadius: 12,
                  opacity: user.isDeleted ? 0.55 : 1,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 15,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {user.name ?? user.email ?? "Utilisateur sans nom"}
                    {user.isAdmin ? (
                      <span className="pill pill--internal">Admin</span>
                    ) : null}
                    {user.isPro ? (
                      <span className="pill pill--premium">Premium</span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 12,
                      color: "var(--ink-soft)",
                      marginTop: 2,
                    }}
                  >
                    {user.email ?? user.clerkId}
                    {user.entitlementSource
                      ? ` · source: ${user.entitlementSource}`
                      : null}
                  </div>
                </div>

                <label
                  className="toggle"
                  aria-label={
                    user.isPro ? "Retirer l’accès membre" : "Accorder l’accès membre"
                  }
                  style={{
                    opacity: pendingId === user._id ? 0.5 : 1,
                    pointerEvents: pendingId === user._id ? "none" : "auto",
                  }}
                >
                  <input
                    checked={user.isPro}
                    disabled={pendingId === user._id || user.isDeleted}
                    onChange={(event) =>
                      void toggleMembership(user._id, event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span className="toggle__sw" />
                </label>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
