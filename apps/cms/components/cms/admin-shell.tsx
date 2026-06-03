"use client";

import { UserButton } from "@clerk/nextjs";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "#content", label: "Contenus" },
  { href: "#settings", label: "Tenant" },
  { href: "#preview", label: "Preview" },
] as const;

export function AdminShell({
  email,
  name,
  children,
}: {
  email: string | null;
  name: string | null;
  children: ReactNode;
}) {
  return (
    <div className="admin-root">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <div aria-hidden="true" className="admin-brand-mark">
              <svg width={12} height={12} viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 3l1.3 3.7L15 8l-3.7 1.3L10 13l-1.3-3.7L5 8l3.7-1.3L10 3z"
                  fill="white"
                />
              </svg>
            </div>
            <div className="admin-brand-copy">
              <span>MediumShip</span>
              <span>CMS</span>
            </div>
          </div>

          <div className="admin-badge">Interne</div>
        </div>

        <div className="admin-header-inner admin-nav-row">
          <nav aria-label="CMS">
            <div className="admin-nav">
              {NAV_ITEMS.map((item) => (
                <a key={item.href} className="admin-nav-link" href={item.href}>
                  {item.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="admin-user">
            <div>
              <strong>{name ?? "Admin"}</strong>
              <p>{email ?? "Signed in"}</p>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="admin-main">{children}</main>
    </div>
  );
}
