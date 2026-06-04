"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import { AdminLoginShell } from "./admin-login-shell";
import { AdminShell } from "./admin-shell";
import { ContentForm } from "./content-form";
import { EditorialList } from "./editorial-list";
import { PreviewPane } from "./preview-pane";
import { TenantSettingsForm } from "./tenant-settings-form";

export function Dashboard() {
  const viewer = useQuery(api.cms.queries.getViewer, {});
  const bootstrapAdmin = useMutation(api.cms.mutations.bootstrapAdmin);
  const createContent = useMutation(api.cms.mutations.createContent);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isAdmin = viewer?.isAdmin ?? false;
  const contents = useQuery(api.cms.queries.listContents, isAdmin ? {} : "skip");
  const tenant = useQuery(api.cms.queries.getTenantSettings, isAdmin ? {} : "skip");

  useEffect(() => {
    if (!selectedId && contents && contents.length > 0) {
      setSelectedId(contents[0]._id);
    }
  }, [contents, selectedId]);

  if (!viewer) {
    return <main className="admin-login-root">Loading CMS…</main>;
  }

  return (
    <>
      <SignedOut>
        <AdminLoginShell
          title="Operable editorial cockpit"
          subtitle="Connecte-toi avec Clerk. Convex garde l'autorisation reelle du CMS."
        >
          <SignInButton mode="modal">
            <button className="primary-button" type="button">
              Sign in
            </button>
          </SignInButton>
        </AdminLoginShell>
      </SignedOut>

      <SignedIn>
        {viewer.isAdmin ? (
          <AdminShell email={viewer.email} name={viewer.name}>
            <section className="hero-strip">
              <p className="eyebrow">Milestone 2</p>
              <h1>Operable CMS</h1>
              <p className="topbar-copy">
                Premier socle mono-tenant: auth admin, CRUD editorial, config mobile et preview relies au modele public.
              </p>
            </section>
            {contents && tenant ? (
              <div className="cms-grid">
                <div id="content">
                  <EditorialList
                    items={contents}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onCreate={async (kind) => {
                      const id = await createContent({ kind });
                      setSelectedId(id);
                    }}
                  />
                </div>
                <div id="editor">
                  <ContentForm key={selectedId ?? "none"} selectedId={selectedId} />
                </div>
                <div className="side-column">
                  <div id="settings">
                    <TenantSettingsForm tenant={tenant} />
                  </div>
                  <div id="preview">
                    <PreviewPane key={selectedId ?? "none"} selectedId={selectedId} />
                  </div>
                </div>
              </div>
            ) : (
              <section className="panel">
                <p className="empty-copy">Loading protected CMS data…</p>
              </section>
            )}
          </AdminShell>
        ) : viewer.canBootstrapAdmin ? (
          <AdminLoginShell
            title="Claim the first admin seat"
            subtitle="Aucun admin CMS n'existe encore sur ce deployment Convex. Cette session peut devenir le premier admin."
          >
            <button className="primary-button" onClick={() => void bootstrapAdmin({})} type="button">
              Become first admin
            </button>
          </AdminLoginShell>
        ) : (
          <AdminLoginShell
            title="Access denied"
            subtitle="La session Clerk est valide, mais l'utilisateur n'a pas le role admin cote Convex."
          >
            <p className="empty-copy">
              Promeut l'utilisateur via `users.cmsRole` ou repars d'un deployment local neuf pour le bootstrap initial.
            </p>
          </AdminLoginShell>
        )}
      </SignedIn>
    </>
  );
}
