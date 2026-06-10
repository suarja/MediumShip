import { httpRouter } from "convex/server";

import { clerkWebhookPost } from "./httpHandlers/clerkWebhook";
import { revenuecatWebhookPost } from "./httpHandlers/revenuecatWebhook";

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

// RevenueCat mobile IAP webhooks (via `convex-revenuecat` component).
// Endpoint: /webhooks/revenuecat
// Configure in RC dashboard: Integrations → Webhooks → Authorization header =
// Convex env `REVENUECAT_WEBHOOK_AUTH`.
http.route({
  path: "/webhooks/revenuecat",
  method: "POST",
  handler: revenuecatWebhookPost,
});

export default http;
