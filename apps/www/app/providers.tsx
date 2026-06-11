"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { PropsWithChildren } from "react";

import { env } from "../lib/env";

// The landing only performs public (guest-first) reads, so a plain
// ConvexProvider is enough — no Clerk / ConvexProviderWithClerk needed.
const convex = new ConvexReactClient(env.convexUrl);

export function Providers({ children }: PropsWithChildren) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
