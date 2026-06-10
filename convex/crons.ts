import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "discovery ingestion",
  "0 4 * * *",
  internal.discovery.ingest.runDiscoveryIngestion,
  {},
);

crons.cron(
  "premium taste analysis",
  "0 7 * * *",
  internal.insights.cron.generateDailyAnalyses,
  {},
);

export default crons;
