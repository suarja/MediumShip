export const DAILY_DIGEST_KIND = "daily_digest" as const;
export const ANALYSIS_READY_KIND = "analysis_ready" as const;

// DEFAULT_DIGEST_HOUR must be set later in the day than the "premium taste analysis"
// cron (0 7 * * * UTC = 07:00 UTC). For FR users (UTC+1/+2), the cron runs at
// 08:00–09:00 local, so a 09:00 local digest (= 07:00–08:00 UTC) already lands after
// the analysis in winter and just overlaps in summer DST. Set DEFAULT_DIGEST_HOUR to
// 9 (local) and keep the cron at 07:00 UTC so the reading companion is fresh by the
// time users tap the digest notification.
export const DEFAULT_DIGEST_HOUR = 9;
export const DEFAULT_DIGEST_MINUTE = 0;
export const SLIDING_WINDOW_DAYS = 7;
export const WINDOW_REFRESH_THRESHOLD_DAYS = 3;

export const DIGEST_REMINDER_ENABLED_KEY = "mediumship:digestReminder.enabled";
export const DIGEST_REMINDER_HOUR_KEY = "mediumship:digestReminder.hour";
