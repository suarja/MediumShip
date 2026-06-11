import { useConvexAuth, useMutation } from "convex/react";
import { useCallback, useState } from "react";

import { api } from "../../../convex/_generated/api";
import { requestReview } from "../review/review-service";

export type StartFreePremiumStatus = "idle" | "pending" | "success" | "error";

type UseStartFreePremiumOptions = {
  onSuccess?: () => void;
};

export function useStartFreePremium(options: UseStartFreePremiumOptions = {}) {
  const { isAuthenticated } = useConvexAuth();
  const startFreePremiumMutation = useMutation(
    api.entitlements.mutations.startFreePremium,
  );
  const [status, setStatus] = useState<StartFreePremiumStatus>("idle");

  const activate = useCallback(async () => {
    if (!isAuthenticated) {
      return false;
    }

    setStatus("pending");
    try {
      await startFreePremiumMutation({});
      setStatus("success");
      options.onSuccess?.();
      // Delay so the celebration modal lands first; the review prompt should
      // feel like a calm follow-up, not interrupt the success moment.
      setTimeout(() => {
        void requestReview("premium_activated");
      }, 2500);
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }, [isAuthenticated, options, startFreePremiumMutation]);

  const resetStatus = useCallback(() => {
    setStatus("idle");
  }, []);

  return {
    activate,
    status,
    isPending: status === "pending",
    resetStatus,
  };
}
