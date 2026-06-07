"use client";

import type { ReactNode } from "react";
import { startTransition } from "react";

export const CMS_TABS = [
  "contents",
  "categories",
  "collections",
  "events",
  "tenant",
  "users",
  "preview",
  "developer",
] as const;

export type CmsTab = (typeof CMS_TABS)[number];

const NAV_ITEMS: ReadonlyArray<{
  icon: string;
  label: string;
  value: CmsTab;
}> = [
  { icon: "◇", label: "Contenus", value: "contents" },
  { icon: "◎", label: "Catégories", value: "categories" },
  { icon: "▣", label: "Collections", value: "collections" },
  { icon: "◷", label: "Agenda", value: "events" },
  { icon: "⚙", label: "Tenant", value: "tenant" },
  { icon: "◉", label: "Membres", value: "users" },
  { icon: "▶", label: "Preview", value: "preview" },
  { icon: "⬡", label: "Développeur", value: "developer" },
];

export function isCmsTab(value: string | null | undefined): value is CmsTab {
  return (CMS_TABS as readonly string[]).includes(value ?? "");
}

function getViewerInitial(name: string | null, email: string | null) {
  const seed = name?.trim() || email?.trim() || "M";
  return seed.charAt(0).toUpperCase();
}

export function AdminShell({
  activeTab,
  brandName,
  email,
  name,
  onTabChange,
  children,
}: {
  activeTab: CmsTab;
  brandName: string;
  email: string | null;
  name: string | null;
  onTabChange: (tab: CmsTab) => void;
  children: ReactNode;
}) {
  return (
    <div className="app">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            if (activeTab === "contents") {
              return;
            }

            startTransition(() => onTabChange("contents"));
          }}
          type="button"
        >
          <span className="brand__mark">M</span>
          <div>
            <span className="brand__name">{brandName}</span>
            <span className="brand__kind">CMS</span>
          </div>
          <span className="tag-interne">Interne</span>
        </button>

        <nav aria-label="CMS tabs" className="tabs">
          {NAV_ITEMS.map((item) => (
            <button
              aria-current={activeTab === item.value ? "page" : undefined}
              className={`tab ${activeTab === item.value ? "on" : ""}`}
              key={item.value}
              onClick={() => {
                if (activeTab === item.value) {
                  return;
                }

                startTransition(() => onTabChange(item.value));
              }}
              type="button"
            >
              <span className="ic">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="user">
          <div className="user__info">
            <div className="nm">{name ?? "Admin CMS"}</div>
            <div className="em">{email ?? "Session interne"}</div>
          </div>
          <span className="user__av">{getViewerInitial(name, email)}</span>
        </div>
      </header>

      {children}
    </div>
  );
}
