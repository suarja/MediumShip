"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import { AdminLoginShell } from "./admin-login-shell";
import { AdminShell, isCmsTab, type CmsTab } from "./admin-shell";
import { ContentsTab } from "./contents-tab";
import { PreviewTab } from "./preview-tab";
import { TenantTab } from "./tenant-tab";
import { UsersTab } from "./users-tab";

export function Dashboard({ initialTab }: { initialTab: CmsTab }) {
  const viewer = useQuery(api.cms.queries.getViewer, {});
  const bootstrapAdmin = useMutation(api.cms.mutations.bootstrapAdmin);
  const createContent = useMutation(api.cms.mutations.createContent);
  const [activeTab, setActiveTabState] = useState<CmsTab>(initialTab);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const isAdmin = viewer?.isAdmin ?? false;
  const contents = useQuery(api.cms.queries.listContents, isAdmin ? {} : "skip");
  const tenant = useQuery(api.cms.queries.getTenantSettings, isAdmin ? {} : "skip");

  useEffect(() => {
    if (!selectedId && contents && contents.length > 0) {
      setSelectedId(contents[0]._id);
    }
  }, [contents, selectedId]);

  useEffect(() => {
    setActiveTabState(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const onPopState = () => {
      const params = new URL(window.location.href).searchParams;
      const candidate = params.get("tab");
      setActiveTabState(isCmsTab(candidate) ? candidate : "contents");
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const setActiveTab = (nextTab: CmsTab) => {
    setActiveTabState(nextTab);

    const url = new URL(window.location.href);
    if (nextTab === "contents") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", nextTab);
    }

    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  };

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
          <AdminShell
            activeTab={activeTab}
            brandName={tenant?.name ?? "MediumShip"}
            email={viewer.email}
            name={viewer.name}
            onTabChange={setActiveTab}
          >
            {contents && tenant ? (
              activeTab === "contents" ? (
                <ContentsTab
                  items={contents}
                  onCreate={async (kind) => {
                    const id = await createContent({ kind });
                    setSelectedId(id);
                  }}
                  onSelect={setSelectedId}
                  selectedId={selectedId}
                />
              ) : activeTab === "tenant" ? (
                <TenantTab tenant={tenant} />
              ) : activeTab === "users" ? (
                <UsersTab />
              ) : (
                <PreviewTab selectedId={selectedId} />
              )
            ) : (
              <main className="page">
                <section className="panel">
                  <p className="empty-copy">Loading protected CMS data…</p>
                </section>
              </main>
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
