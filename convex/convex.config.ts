import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";
import revenuecat from "convex-revenuecat/convex.config";
import youtubeCache from "convex-youtube-cache/convex.config";
import r2 from "@convex-dev/r2/convex.config";
import aggregate from "@convex-dev/aggregate/convex.config";

const app = defineApp();
app.use(agent);
app.use(revenuecat);
app.use(youtubeCache);
app.use(r2);
app.use(aggregate, { name: "contentCategoryCounts" });

export default app;
