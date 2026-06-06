import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "discovery ingestion",
  "0 4 * * *",
  internal.discovery.ingest.runDiscoveryIngestion,
  {},
);

export default crons;
