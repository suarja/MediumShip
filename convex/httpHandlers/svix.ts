// Verifies a Svix (Clerk) webhook signature with WebCrypto, so the Convex
// runtime needs no extra npm dependency. Mirrors the Svix signing scheme:
// HMAC-SHA256 over `${svix-id}.${svix-timestamp}.${body}` keyed by the base64
// secret (the part after the `whsec_` prefix), compared against the v1 sigs.
declare const process: { env: Record<string, string | undefined> };

export async function verifyWebhookSignature(
  req: Request,
  body: string,
): Promise<boolean> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) return false;

  const secretBase64 = webhookSecret.startsWith("whsec_")
    ? webhookSecret.slice(6)
    : webhookSecret;
  const secretBytes = Uint8Array.from(atob(secretBase64), (c) =>
    c.charCodeAt(0),
  );

  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedContent),
  );

  const bytes = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const computedSig = btoa(binary);

  const signatures = svixSignature
    .split(" ")
    .map((s) => s.split(",")[1])
    .filter(Boolean);

  return signatures.some((sig) => sig === computedSig);
}
