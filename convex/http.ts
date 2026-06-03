import { httpRouter } from "convex/server";

import { clerkWebhookPost } from "./httpHandlers/clerkWebhook";

const http = httpRouter();

// Clerk identity sync. Configure in Clerk dashboard → Webhooks with endpoint
// URL `<deployment>.convex.site/clerk-webhook` and events user.created,
// user.updated, user.deleted. Copy the signing secret into the Convex env var
// CLERK_WEBHOOK_SECRET.
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: clerkWebhookPost,
});

export default http;
