import { notificationsModule } from "./bootstrap";
import {
  getLastNotifiedAnalysisId,
  setLastNotifiedAnalysisId,
} from "./analysis-ready-storage";
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

export async function cancelAnalysisReadyNotifications(): Promise<void> {
  if (!notificationsModule) {
    return;
  }

  const scheduled = await notificationsModule.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter((entry) => isAnalysisReadyNotification(entry.content.data))
    .map((entry) => entry.identifier);

  await Promise.all(
    ids.map((identifier) =>
      notificationsModule!.cancelScheduledNotificationAsync(identifier),
    ),
  );
}

/**
 * Schedules at most one local notification per analysis document.
 * Re-opening the app with the same unseen analysis does not enqueue duplicates.
 */
export async function scheduleAnalysisReadyNotification(args: {
  analysisId: string;
  title: string;
  body: string;
  triggerAt?: Date;
}): Promise<boolean> {
  if (!notificationsModule) {
    return false;
  }

  const lastNotified = await getLastNotifiedAnalysisId();
  if (lastNotified === args.analysisId) {
    return false;
  }

  const scheduled = await notificationsModule.getAllScheduledNotificationsAsync();
  const alreadyQueued = scheduled.some(
    (entry) =>
      isAnalysisReadyNotification(entry.content.data) &&
      entry.content.data.analysisId === args.analysisId,
  );
  if (alreadyQueued) {
    await setLastNotifiedAnalysisId(args.analysisId);
    return false;
  }

  await cancelAnalysisReadyNotifications();

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

  await setLastNotifiedAnalysisId(args.analysisId);
  return true;
}
