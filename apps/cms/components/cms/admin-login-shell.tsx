"use client";

import type { ReactNode } from "react";

export function AdminLoginShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-login-root">
      <div aria-hidden="true" className="admin-login-aurora" />

      <div className="admin-login-inner">
        <div className="admin-login-brand">
          <span aria-hidden="true" className="admin-brand-mark">
            M
          </span>
          <div className="admin-brand-copy">
            <span>MediumShip</span>
            <span>CMS</span>
          </div>
        </div>

        <div className="admin-login-card">
          <div className="admin-login-copy">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
        </div>

        <p className="admin-login-footnote">Administration éditoriale sécurisée</p>
      </div>
    </div>
  );
}
