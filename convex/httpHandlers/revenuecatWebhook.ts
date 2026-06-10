import { ConvexError } from "convex/values";

import { httpAction } from "../_generated/server";
import { components, internal } from "../_generated/api";
import type { Environment, Store } from "convex-revenuecat";
import { revenuecat } from "../revenuecat";

/**
 * RevenueCat webhook: verify auth, delegate to `convex-revenuecat`, then sync
 * into `entitlements` for the clerkId on every processed event.
 *
 * Setup (RevenueCat dashboard → Integrations → Webhooks):
 * - URL: `https://<deployment>.convex.site/webhooks/revenuecat`
 * - Authorization header: value of Convex env `REVENUECAT_WEBHOOK_AUTH`
 *
 * RC event reference: https://www.revenuecat.com/docs/integrations/webhooks/event-types
 */

function extractAuthToken(header: string): string {
  const bearerPrefix = "Bearer ";
  if (header.startsWith(bearerPrefix)) {
    return header.slice(bearerPrefix.length);
  }
  return header;
}

function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function transformPayload(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(transformPayload);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value === null) continue;
    const safeKey = key.startsWith("$") ? `__dollar__${key.slice(1)}` : key;
    result[safeKey] = transformPayload(value);
  }
  return result;
}

export const revenuecatWebhookPost = httpAction(async (ctx, request) => {
  const expectedAuth = revenuecat.options.REVENUECAT_WEBHOOK_AUTH;
  if (expectedAuth) {
    const authHeader = request.headers.get("Authorization") ?? "";
    const providedToken = extractAuthToken(authHeader);
    const expectedToken = extractAuthToken(expectedAuth);

    if (!secureCompare(providedToken, expectedToken)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = body as { api_version?: string; event?: Record<string, unknown> };
  const event = payload.event;

  if (!event || typeof event.id !== "string" || typeof event.type !== "string") {
    return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sanitizedEvent = transformPayload(event) as Record<string, unknown>;
  const clerkId =
    typeof event.app_user_id === "string" ? event.app_user_id : undefined;

  try {
    const result = await ctx.runMutation(components.revenuecat.webhooks.process, {
      event: {
        id: event.id as string,
        type: event.type as string,
        app_id: event.app_id as string | undefined,
        app_user_id: clerkId,
        environment: (event.environment as Environment) ?? "PRODUCTION",
        store: event.store as Store | undefined,
      },
      payload: sanitizedEvent,
    });

    if (clerkId) {
      await ctx.runMutation(internal.entitlements.revenuecatSync.syncForClerkId, {
        clerkId,
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ConvexError) {
      const data = error.data as { code?: string; data?: { resetAt?: number } } | undefined;
      if (data?.code === "RATE_LIMITED") {
        const resetAt = data.data?.resetAt;
        return new Response(JSON.stringify({ error: "Rate limit exceeded", resetAt }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...(resetAt
              ? { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) }
              : {}),
          },
        });
      }
      if (data?.code === "INVALID_ARGUMENT") {
        return new Response(JSON.stringify({ error: "Invalid webhook payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    throw error;
  }
});
