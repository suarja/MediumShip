"use client";

import { SignedIn, SignedOut, SignInButton, SignOutButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

import { api } from "../../../../convex/_generated/api";
import { AdminLoginShell } from "./admin-login-shell";
import { AdminShell, isCmsTab, type CmsTab } from "./admin-shell";
import { CategoriesTab } from "./categories-tab";
import { CollectionsTab } from "./collections-tab";
import { ContentsTab } from "./contents-tab";
import { DeveloperTab } from "./developer-tab";
import { EventsTab } from "./events-tab";
import { ModulesTab } from "./modules-tab";
import { TenantTab } from "./tenant-tab";
import { UsersTab } from "./users-tab";

export function Dashboard({ initialTab }: { initialTab: CmsTab }) {
  const viewer = useQuery(api.cms.queries.getViewer, {});
  const bootstrapAdmin = useMutation(api.cms.mutations.bootstrapAdmin);
  const createContent = useMutation(api.cms.mutations.createContent);
  const createCategory = useMutation(api.cms.categories.createCategory);
  const createCollection = useMutation(api.cms.collections.createCollection);
  const createEvent = useMutation(api.cms.events.createEvent);
  const [activeTab, setActiveTabState] = useState<CmsTab>(initialTab);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    null,
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const isAdmin = viewer?.isAdmin ?? false;
  const contents = useQuery(api.cms.queries.listContents, isAdmin ? {} : "skip");
  const categories = useQuery(
    api.cms.categories.listCmsCategories,
    isAdmin ? {} : "skip",
  );
  const collections = useQuery(
    api.cms.collections.listCmsCollections,
    isAdmin ? {} : "skip",
  );
  const events = useQuery(api.cms.events.listCmsEvents, isAdmin ? {} : "skip");
  const tenant = useQuery(api.cms.queries.getTenantSettings, isAdmin ? {} : "skip");

  // Content selection is owned by ContentsTab, which is filter-aware: it
  // selects the first *filtered* item and clears the selection when the search
  // matches nothing. A dashboard-level "select the first global content" effect
  // fought it — on a search with no matching first item, one cleared the
  // selection and the other re-selected the global first, ping-ponging forever
  // (infinite loop). Do NOT reintroduce a content auto-select here.

  // Category selection is owned by CategoriesTab (filter-aware, alphabetical default).
  // Do NOT reintroduce a dashboard-level category auto-select here.

  useEffect(() => {
    if (!selectedCollectionId && collections && collections.length > 0) {
      setSelectedCollectionId(collections[0]._id);
    }
  }, [collections, selectedCollectionId]);

  useEffect(() => {
    if (!selectedEventId && events && events.length > 0) {
      setSelectedEventId(events[0]._id);
    }
  }, [events, selectedEventId]);

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
    return (
      <main className="admin-login-root">
        <div className="admin-login-inner">
          <p className="admin-login-footnote">Chargement…</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <SignedOut>
        <AdminLoginShell
          eyebrow="Connexion"
          subtitle="Accédez à l'espace d'administration pour gérer vos contenus, votre identité de marque et votre équipe."
          title="Connectez-vous au CMS"
        >
          <SignInButton mode="modal">
            <button className="primary-button" type="button">
              Se connecter
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
            {activeTab === "developer" ? (
              <DeveloperTab ready={isAdmin} />
            ) : contents && categories && collections && events && tenant ? (
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
              ) : activeTab === "categories" ? (
                <CategoriesTab
                  items={categories}
                  ready={isAdmin}
                  onCreate={() =>
                    createCategory({
                      label: "Sans titre",
                      slug: "",
                      iconKey: "default",
                    })
                  }
                />
              ) : activeTab === "collections" ? (
                <CollectionsTab
                  items={collections}
                  onCreate={async () => {
                    const id = await createCollection({
                      title: "Nouvelle collection",
                      slug: "",
                      summary: "Décris la série et ses contenus.",
                    });
                    setSelectedCollectionId(id);
                  }}
                  onSelect={setSelectedCollectionId}
                  selectedId={selectedCollectionId}
                />
              ) : activeTab === "events" ? (
                <EventsTab
                  items={events}
                  onCreate={async () => {
                    const id = await createEvent({
                      title: "Nouvel événement",
                      slug: "",
                      summary: "Décris l’événement pour l’agenda public.",
                      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                      locationLabel: "À définir",
                      mode: "online",
                      access: "free",
                    });
                    setSelectedEventId(id);
                  }}
                  onSelect={setSelectedEventId}
                  selectedId={selectedEventId}
                />
              ) : activeTab === "modules" ? (
                <ModulesTab tenant={tenant} />
              ) : activeTab === "tenant" ? (
                <TenantTab tenant={tenant} />
              ) : activeTab === "users" ? (
                <UsersTab />
              ) : null
            ) : (
              <main className="page">
                <section className="panel">
                  <p className="empty-copy">Chargement des données…</p>
                </section>
              </main>
            )}
          </AdminShell>
        ) : viewer.canBootstrapAdmin ? (
          <AdminLoginShell
            eyebrow="Mise en place"
            subtitle="Aucun administrateur n'est encore configuré pour cet espace. Vous pouvez en revendiquer l'accès pour terminer la configuration initiale."
            title="Premier accès administrateur"
          >
            <button className="primary-button" onClick={() => void bootstrapAdmin({})} type="button">
              Devenir administrateur
            </button>
            <SignOutButton>
              <button className="ghost-button" type="button">
                Se déconnecter
              </button>
            </SignOutButton>
          </AdminLoginShell>
        ) : (
          <AdminLoginShell
            eyebrow="Accès refusé"
            subtitle="Votre compte est connecté, mais il ne dispose pas des droits d'administration de ce CMS."
            title="Accès non autorisé"
          >
            <p className="empty-copy">
              Demandez à un administrateur existant de vous accorder les droits, ou connectez-vous avec un autre compte.
            </p>
            <SignOutButton>
              <button className="primary-button" type="button">
                Se déconnecter
              </button>
            </SignOutButton>
          </AdminLoginShell>
        )}
      </SignedIn>
    </>
  );
}
