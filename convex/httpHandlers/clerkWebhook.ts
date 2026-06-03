import { internal } from "../_generated/api";
import { httpAction } from "../_generated/server";
import { verifyWebhookSignature } from "./svix";

type ClerkEmailAddress = { id: string; email_address: string };
type ClerkUserData = {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_image_url?: string | null;
  image_url?: string | null;
};

// POST /clerk-webhook — syncs Clerk users into Convex on create/update/delete.
export const clerkWebhookPost = httpAction(async (ctx, req) => {
  const body = await req.text();

  const isValid = await verifyWebhookSignature(req, body);
  if (!isValid) {
    console.warn("[clerk-webhook] invalid signature");
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body) as { type: string; data: ClerkUserData };

  if (event.type === "user.created" || event.type === "user.updated") {
    const data = event.data;
    const emails = data.email_addresses ?? [];
    const email =
      emails.find((e) => e.id === data.primary_email_address_id)
        ?.email_address ?? emails[0]?.email_address;
    const name =
      [data.first_name ?? "", data.last_name ?? ""].filter(Boolean).join(" ") ||
      undefined;
    const avatarUrl = data.profile_image_url || data.image_url || undefined;

    await ctx.runMutation(internal.users.mutations.upsertFromClerk, {
      clerkId: data.id,
      email,
      name,
      avatarUrl,
    });
  }

  if (event.type === "user.deleted") {
    await ctx.runMutation(internal.users.mutations.softDeleteFromClerk, {
      clerkId: event.data.id,
    });
  }

  return new Response(null, { status: 200 });
});
