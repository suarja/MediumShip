import { defineApp } from "convex/server";
import youtubeCache from "convex-youtube-cache/convex.config";

const app = defineApp();
app.use(youtubeCache);

export default app;
