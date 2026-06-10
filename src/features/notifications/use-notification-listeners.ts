import { useEffect } from "react";
import { useRouter } from "expo-router";

import { notificationsModule } from "./bootstrap";
import { isAnalysisReadyNotification } from "./schedule-analysis-ready";
import { isDailyDigestNotification } from "./schedule-daily-digest";

const HOME_ROUTE = "/home" as const;

export function useNotificationListeners(): void {
  const router = useRouter();

  useEffect(() => {
    if (!notificationsModule) {
      return;
    }

    const responseSub = notificationsModule.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (isAnalysisReadyNotification(data)) {
          router.push(`/analysis/${data.analysisId}`);
          return;
        }

        if (isDailyDigestNotification(data)) {
          router.replace(HOME_ROUTE);
        }
      },
    );

    return () => {
      responseSub.remove();
    };
  }, [router]);
}
