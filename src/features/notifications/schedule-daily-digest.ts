import { notificationsModule } from "./bootstrap";
import {
  DAILY_DIGEST_KIND,
  SLIDING_WINDOW_DAYS,
} from "./constants";

export type DigestReminderTrigger = {
  date: Date;
  title: string;
  body: string;
};

const DIGEST_MESSAGES = {
  fr: {
    title: "Knowly",
    body: "Ton feed du jour est prêt",
  },
  en: {
    title: "Knowly",
    body: "Your feed for today is ready",
  },
} as const;

export function resolveDigestMessages(locale: string): { title: string; body: string } {
  if (locale.startsWith("fr")) {
    return DIGEST_MESSAGES.fr;
  }
  return DIGEST_MESSAGES.en;
}

/**
 * Pure scheduling plan: N consecutive local mornings at `hour` starting tomorrow.
 */
export function computeReminderTriggers(
  now: Date,
  hour: number,
  days: number,
  locale: string,
): DigestReminderTrigger[] {
  const messages = resolveDigestMessages(locale);
  const triggers: DigestReminderTrigger[] = [];

  for (let day = 1; day <= days; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    date.setHours(hour, 0, 0, 0);
    triggers.push({
      date,
      title: messages.title,
      body: messages.body,
    });
  }

  return triggers;
}

export function isDailyDigestNotification(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as Record<string, unknown>).kind === DAILY_DIGEST_KIND
  );
}

export async function cancelDailyDigestReminders(): Promise<void> {
  if (!notificationsModule) {
    return;
  }

  const scheduled = await notificationsModule.getAllScheduledNotificationsAsync();
  const digestIds = scheduled
    .filter((entry) => isDailyDigestNotification(entry.content.data))
    .map((entry) => entry.identifier);

  await Promise.all(
    digestIds.map((identifier) =>
      notificationsModule!.cancelScheduledNotificationAsync(identifier),
    ),
  );
}

export async function scheduleDailyDigest(args: {
  now?: Date;
  hour?: number;
  days?: number;
  locale?: string;
}): Promise<void> {
  if (!notificationsModule) {
    return;
  }

  const now = args.now ?? new Date();
  const hour = args.hour ?? 9;
  const days = args.days ?? SLIDING_WINDOW_DAYS;
  const locale = args.locale ?? "fr";

  await cancelDailyDigestReminders();

  const triggers = computeReminderTriggers(now, hour, days, locale);

  for (const trigger of triggers) {
    await notificationsModule.scheduleNotificationAsync({
      content: {
        title: trigger.title,
        body: trigger.body,
        sound: false,
        data: { kind: DAILY_DIGEST_KIND },
      },
      trigger: {
        type: notificationsModule.SchedulableTriggerInputTypes.DATE,
        date: trigger.date,
      },
    });
  }
}

export async function getLatestDailyDigestTriggerMs(): Promise<number> {
  if (!notificationsModule) {
    return 0;
  }

  const scheduled = await notificationsModule.getAllScheduledNotificationsAsync();
  return scheduled
    .filter((entry) => isDailyDigestNotification(entry.content.data))
    .reduce<number>((max, entry) => {
      const trigger = entry.trigger as { date?: number | Date };
      const at =
        typeof trigger?.date === "number"
          ? trigger.date
          : trigger?.date instanceof Date
            ? trigger.date.getTime()
            : 0;
      return at > max ? at : max;
    }, 0);
}
