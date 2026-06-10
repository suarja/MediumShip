import { Agent } from "@convex-dev/agent";
import { gateway } from "ai";

import { components } from "../_generated/api";
import { buildBriefingInstructions } from "./instructions";

export type AgentComponent = ConstructorParameters<typeof Agent>[0];

export const TASTE_INSIGHTS_AGENT_NAME = "TasteInsightsAgent";

/**
 * Same provider/model stack as Editia analysis agents (e.g.
 * `analysisConversationAgent`, `productProposalAgent`).
 * Requires env var `AI_GATEWAY_API_KEY` on the Convex deployment.
 */
export const TASTE_INSIGHTS_MODEL = "openai/gpt-5.4-mini";

/**
 * Singleton agent for premium taste-analysis prose. Content selection stays
 * deterministic in `relatedSelection.ts` — the model only writes journalist copy.
 */
export const tasteInsightsAgent = new Agent(
  (components as unknown as { agent: AgentComponent }).agent,
  {
    name: TASTE_INSIGHTS_AGENT_NAME,
    languageModel: gateway(TASTE_INSIGHTS_MODEL),
    // Baseline only — `buildInsightsPrompt` overrides per call with locale +
    // cold-start context (same pattern as Editia `buildReportPrompt`).
    instructions: buildBriefingInstructions("fr"),
  },
);
