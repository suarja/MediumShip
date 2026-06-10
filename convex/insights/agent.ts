import { Agent } from "@convex-dev/agent";
import { anthropic } from "@ai-sdk/anthropic";

import { components } from "../_generated/api";

export type AgentComponent = ConstructorParameters<typeof Agent>[0];

export const TASTE_INSIGHTS_AGENT_NAME = "TasteInsightsAgent";
export const TASTE_INSIGHTS_MODEL = "claude-sonnet-4-20250514";

/**
 * Singleton agent for premium taste-analysis prose. Content selection stays
 * deterministic in `relatedSelection.ts` — the model only writes journalist copy.
 */
export const tasteInsightsAgent = new Agent(
  (components as unknown as { agent: AgentComponent }).agent,
  {
    name: TASTE_INSIGHTS_AGENT_NAME,
    languageModel: anthropic(TASTE_INSIGHTS_MODEL),
    instructions:
      "You write short, warm editorial copy describing a reader's content tastes. " +
      "Never recommend specific article titles or IDs — selection is handled elsewhere.",
  },
);
