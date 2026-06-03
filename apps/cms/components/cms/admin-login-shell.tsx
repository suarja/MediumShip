"use client";

import type { ReactNode } from "react";

export function AdminLoginShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-login-root">
      <div aria-hidden="true" className="admin-login-aurora" />

      <div className="admin-login-inner">
        <div className="admin-login-brand">
          <div aria-hidden="true" className="admin-brand-mark">
            <svg width={14} height={14} viewBox="0 0 20 20" fill="none">
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

        <div className="admin-login-card">
          <div className="admin-login-copy">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
        </div>

        <p className="admin-login-footnote">Acces interne · Mono-tenant CMS</p>
      </div>
    </div>
  );
}
