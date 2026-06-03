import { z } from "zod";

const envSchema = z.object({
  convexUrl: z.string().url(),
  clerkPublishableKey: z.string().min(1),
});

export const env = envSchema.parse({
  convexUrl:
    process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.EXPO_PUBLIC_CONVEX_URL,
  clerkPublishableKey:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
});
