import { usePathname, useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { BriefingInviteModal } from "../../components/insights/briefing-invite-modal";
import type { Id } from "../../../convex/_generated/dataModel";
import { briefingPreviewText } from "./briefing-preview";
import {
  getBriefingInviteDismissedId,
  setBriefingInviteDismissedId,
} from "./briefing-invite-storage";
import { useUnseenAnalysis } from "./use-unseen-analysis";

type BriefingInviteContextValue = {
  visible: boolean;
};

const BriefingInviteContext = createContext<BriefingInviteContextValue | null>(
  null,
);

function isOnBriefingScreen(pathname: string, analysisId: string): boolean {
  return pathname.includes(`/analysis/${analysisId}`);
}

export function BriefingInviteProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { analysis, isLoading, canAccess } = useUnseenAnalysis();
  const [visible, setVisible] = useState(false);
  const [pendingId, setPendingId] = useState<Id<"tasteAnalysis"> | null>(null);

  useEffect(() => {
    if (!enabled || isLoading || !canAccess || !analysis?._id) {
      setVisible(false);
      return;
    }

    if (analysis.seenAt !== undefined) {
      setVisible(false);
      setPendingId(null);
      return;
    }

    if (isOnBriefingScreen(pathname, analysis._id)) {
      setVisible(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const dismissedId = await getBriefingInviteDismissedId();
      if (cancelled || dismissedId === analysis._id) {
        return;
      }

      setPendingId(analysis._id);
      setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [analysis, canAccess, enabled, isLoading, pathname]);

  const handleOpen = useCallback(() => {
    if (!pendingId) {
      return;
    }

    setVisible(false);
    router.push(`/analysis/${pendingId}`);
  }, [pendingId, router]);

  const handleDismiss = useCallback(() => {
    if (pendingId) {
      void setBriefingInviteDismissedId(pendingId);
    }
    setVisible(false);
  }, [pendingId]);

  const previewText = analysis ? briefingPreviewText(analysis) : undefined;

  return (
    <BriefingInviteContext.Provider value={{ visible }}>
      {children}
      <BriefingInviteModal
        visible={visible}
        previewText={previewText}
        onOpen={handleOpen}
        onDismiss={handleDismiss}
      />
    </BriefingInviteContext.Provider>
  );
}

export function useBriefingInvite(): BriefingInviteContextValue {
  const ctx = useContext(BriefingInviteContext);
  if (!ctx) {
    throw new Error("useBriefingInvite must be used inside BriefingInviteProvider");
  }
  return ctx;
}
