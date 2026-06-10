import { notificationsModule } from "./bootstrap";
import { ANALYSIS_READY_KIND } from "./constants";

export type AnalysisReadyNotificationData = {
  kind: typeof ANALYSIS_READY_KIND;
  analysisId: string;
};

export function isAnalysisReadyNotification(
  data: unknown,
): data is AnalysisReadyNotificationData {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as Record<string, unknown>).kind === ANALYSIS_READY_KIND &&
    typeof (data as Record<string, unknown>).analysisId === "string"
  );
}

export async function scheduleAnalysisReadyNotification(args: {
  analysisId: string;
  title: string;
  body: string;
  triggerAt?: Date;
}): Promise<void> {
  if (!notificationsModule) {
    return;
  }

  const triggerAt = args.triggerAt ?? new Date(Date.now() + 1_000);

  await notificationsModule.scheduleNotificationAsync({
    content: {
      title: args.title,
      body: args.body,
      sound: false,
      data: {
        kind: ANALYSIS_READY_KIND,
        analysisId: args.analysisId,
      } satisfies AnalysisReadyNotificationData,
    },
    trigger: {
      type: notificationsModule.SchedulableTriggerInputTypes.DATE,
      date: triggerAt,
    },
  });
}
