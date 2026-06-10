import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "discovery ingestion",
  "0 4 * * *",
  internal.discovery.ingest.runDiscoveryIngestion,
  {},
);

// "premium taste analysis" runs at 07:00 UTC, after "discovery ingestion" (04:00 UTC).
// The mobile digest notification fires at DEFAULT_DIGEST_HOUR (09:00 local) so that,
// for FR users (UTC+1/+2), the reading companion is already generated when they open
// the digest. The nav layer auto-navigates to the fresh reading on tap — no timing
// changes needed as long as the digest local hour stays later than 07:00 UTC.
crons.cron(
  "premium taste analysis",
  "0 7 * * *",
  internal.insights.cron.generateDailyAnalyses,
  {},
);

export default crons;
