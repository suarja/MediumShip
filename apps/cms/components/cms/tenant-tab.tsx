"use client";

import { TenantSettingsForm } from "./tenant-settings-form";

type TenantTabProps = {
  tenant: Parameters<typeof TenantSettingsForm>[0]["tenant"] | null;
};

export function TenantTab({ tenant }: TenantTabProps) {
  return (
    <main className="page">
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
