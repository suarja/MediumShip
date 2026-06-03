import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_CONVEX_URL: z.string().url(),
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
});

export const env = envSchema.parse({
  EXPO_PUBLIC_CONVEX_URL: process.env.EXPO_PUBLIC_CONVEX_URL,
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
});
