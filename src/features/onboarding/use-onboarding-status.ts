import { useEffect, useState } from "react";

import { getOnboardingSeen } from "./onboarding-storage";

export type OnboardingStatus = "loading" | "seen" | "unseen";

/** Reads the persisted first-run flag once on mount. */
export function useOnboardingStatus(): OnboardingStatus {
  const [status, setStatus] = useState<OnboardingStatus>("loading");

  useEffect(() => {
    let active = true;
    void getOnboardingSeen().then((seen) => {
      if (active) {
        setStatus(seen ? "seen" : "unseen");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return status;
}
