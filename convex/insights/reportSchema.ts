import { z } from "zod";

/** Zod schema for agent `generateObject` — root must be an object (OpenAI constraint). */
export const insightsReportZodSchema = z.object({
  overview: z
    .string()
    .describe("2–3 warm editorial sentences opening the taste report."),
  reflection: z
    .string()
    .describe(
      "What changed since the previous analysis: liked reads, avoided topics, pace.",
    ),
  trends: z
    .string()
    .describe("Current reading trends: formats, themes, intensity."),
  picks: z
    .array(
      z.object({
        slot: z.number().int().min(1).describe("Candidate slot number from the prompt."),
        rationale: z
          .string()
          .describe("2–3 sentences explaining why this specific pick fits now."),
      }),
    )
    .describe("One rationale per pre-selected candidate slot."),
});

export type InsightsReportObject = z.infer<typeof insightsReportZodSchema>;
