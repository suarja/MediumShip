import type { NetworkState } from "../../features/network/use-network-status";
import { useIncidentStatus } from "../../features/incident/use-incident-status";
import { DegradedBanner } from "./degraded-banner";
import { IncidentBanner } from "./incident-banner";

export function StatusBannerStack({ networkState }: { networkState: NetworkState }) {
  const { incident, dismiss } = useIncidentStatus();

  return (
    <>
      {incident ? <IncidentBanner message={incident.message} onDismiss={() => void dismiss()} /> : null}
      <DegradedBanner state={networkState} />
    </>
  );
}
