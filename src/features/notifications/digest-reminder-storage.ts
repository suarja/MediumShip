import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_DIGEST_HOUR,
  DIGEST_REMINDER_ENABLED_KEY,
  DIGEST_REMINDER_HOUR_KEY,
} from "./constants";

export type DigestReminderSettings = {
  enabled: boolean;
  hour: number;
};

function parseHour(raw: string | null): number {
  if (!raw) {
    return DEFAULT_DIGEST_HOUR;
  }

  const hour = Number.parseInt(raw, 10);
  if (Number.isNaN(hour) || hour < 0 || hour > 23) {
    return DEFAULT_DIGEST_HOUR;
  }

  return hour;
}

export async function loadDigestReminderSettings(): Promise<DigestReminderSettings> {
  try {
    const [enabledRaw, hourRaw] = await Promise.all([
      AsyncStorage.getItem(DIGEST_REMINDER_ENABLED_KEY),
      AsyncStorage.getItem(DIGEST_REMINDER_HOUR_KEY),
    ]);

    return {
      enabled: enabledRaw === "true",
      hour: parseHour(hourRaw),
    };
  } catch {
    return { enabled: false, hour: DEFAULT_DIGEST_HOUR };
  }
}

export async function saveDigestReminderEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(DIGEST_REMINDER_ENABLED_KEY, enabled ? "true" : "false");
}

export async function saveDigestReminderHour(hour: number): Promise<void> {
  await AsyncStorage.setItem(DIGEST_REMINDER_HOUR_KEY, String(hour));
}
