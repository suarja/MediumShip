import { z } from "zod";

import { BRIEFING_PROMPT_TARGETS, BRIEFING_SCHEMA_MAX } from "./reportFormat";

/** Zod schema for agent `generateObject` — root must be an object (OpenAI constraint). */
export const insightsReportZodSchema = z.object({
  overview: z
    .string()
    .max(BRIEFING_SCHEMA_MAX.overview)
    .describe(
      `Single second-person block (tu/you), ~${BRIEFING_PROMPT_TARGETS.overviewChars} chars / 3–4 complete sentences: recent habits + what shifted + format trend — always end on a finished sentence, never cut off mid-word.`,
    ),
  picks: z
    .array(
      z.object({
        slot: z.number().int().min(1).describe("Candidate slot number from the prompt."),
        rationale: z
          .string()
          .max(BRIEFING_SCHEMA_MAX.pickRationale)
          .describe(
            `Max 1 sentence in second person (~${BRIEFING_PROMPT_TARGETS.pickRationaleChars} chars) — why this pick fits them; mention format or title.`,
          ),
      }),
    )
    .describe("One rationale per pre-selected candidate slot."),
});

export type InsightsReportObject = z.infer<typeof insightsReportZodSchema>;
