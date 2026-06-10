import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";

import { notificationsModule } from "./bootstrap";
import { WINDOW_REFRESH_THRESHOLD_DAYS } from "./constants";
import { usePermissionStatus } from "./permission";
import {
  getLatestDailyDigestTriggerMs,
  scheduleDailyDigest,
} from "./schedule-daily-digest";
import { useDigestReminderSettings } from "./use-digest-reminder-settings";
import { useAppTheme } from "../theme/theme-provider";

/**
 * Mount once in the app tab shell. Passive permission read only — never auto-prompts.
 * Replans the sliding digest window when permission is granted, the user opted in,
 * language changes, or the scheduled window is running short.
 */
export function useNotificationSetup(): void {
  const { i18n } = useTranslation();
  const { status } = usePermissionStatus();
  const { enabled, hour, isLoading } = useDigestReminderSettings();
  const { tenantName } = useAppTheme();

  useEffect(() => {
    if (!notificationsModule || Platform.OS === "web") {
      return;
    }
    if (isLoading || !enabled || status !== "granted") {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const now = Date.now();
        const refreshThresholdMs = WINDOW_REFRESH_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
        const latestTriggerMs = await getLatestDailyDigestTriggerMs();

        if (latestTriggerMs > 0 && latestTriggerMs - now > refreshThresholdMs) {
          return;
        }

        if (cancelled) {
          return;
        }

        await scheduleDailyDigest({
          hour,
          locale: i18n.language,
          tenantName,
        });
      } catch {
        // Notifications are non-critical — never block the app shell.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, hour, i18n.language, isLoading, status, tenantName]);
}
