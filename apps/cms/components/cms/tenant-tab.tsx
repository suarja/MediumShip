"use client";

import { TenantSettingsForm } from "./tenant-settings-form";

type TenantTabProps = {
  tenant: Parameters<typeof TenantSettingsForm>[0]["tenant"] | null;
};

export function TenantTab({ tenant }: TenantTabProps) {
  return (
    <main className="page">
      <section className="hero-strip">
        <p className="eyebrow">Tenant config</p>
        <h1>Tenant</h1>
        <p className="topbar-copy">
          Configuration mono-tenant reliée au backend existant, avant la refonte détaillée de la surface.
        </p>
      </section>

      {tenant ? (
        <TenantSettingsForm tenant={tenant} />
      ) : (
        <section className="panel">
          <p className="empty-copy">Loading tenant settings…</p>
        </section>
      )}
    </main>
  );
}
