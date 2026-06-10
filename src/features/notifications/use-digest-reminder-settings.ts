import { useCallback, useEffect, useState } from "react";

import {
  loadDigestReminderSettings,
  saveDigestReminderEnabled,
  saveDigestReminderHour,
  type DigestReminderSettings,
} from "./digest-reminder-storage";
import { cancelDailyDigestReminders } from "./schedule-daily-digest";

export function useDigestReminderSettings() {
  const [settings, setSettings] = useState<DigestReminderSettings>({
    enabled: false,
    hour: 9,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setSettings(await loadDigestReminderSettings());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      await saveDigestReminderEnabled(enabled);
      if (!enabled) {
        await cancelDailyDigestReminders();
      }
      setSettings((previous) => ({ ...previous, enabled }));
    },
    [],
  );

  const setHour = useCallback(async (hour: number) => {
    await saveDigestReminderHour(hour);
    setSettings((previous) => ({ ...previous, hour }));
  }, []);

  return {
    ...settings,
    isLoading,
    refresh,
    setEnabled,
    setHour,
  };
}
