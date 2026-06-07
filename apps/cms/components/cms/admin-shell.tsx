"use client";

import { UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";
import { startTransition } from "react";

import { type CmsTab } from "../../lib/cms-tabs";

export { CMS_TABS, type CmsTab, isCmsTab } from "../../lib/cms-tabs";

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
  { icon: "⬡", label: "Développeur", value: "developer" },
];

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
            <div className="nm">{name ?? "Administrateur"}</div>
            <div className="em">{email ?? "—"}</div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {children}
    </div>
  );
}
