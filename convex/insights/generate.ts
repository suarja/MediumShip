"use node";

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { tasteInsightsAgent, TASTE_INSIGHTS_MODEL } from "./agent";
import { formatDayKey } from "./dayKey";
import type { InsightsLocale } from "./prompt";
import { buildInsightsPrompt } from "./prompt";
import { PromptInjectionRejected } from "./sanitizeUserInput";

const GENERATION_TIMEOUT_MS = 60_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label}_timeout_${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export const generateForMember = internalAction({
  args: {
    tokenIdentifier: v.string(),
    tenantSlug: v.optional(v.string()),
    locale: v.optional(v.union(v.literal("fr"), v.literal("en"))),
    now: v.optional(v.number()),
    /** Test hook — bypasses the real LLM when provided. */
    mockProse: v.optional(v.string()),
  },
  returns: v.union(v.id("tasteAnalysis"), v.null()),
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    const dayKey = formatDayKey(now);
    const locale: InsightsLocale = args.locale ?? "fr";

    const existingId: Id<"tasteAnalysis"> | null = await ctx.runQuery(
      internal.insights.generateInternal.getExistingAnalysisForDay,
      { tokenIdentifier: args.tokenIdentifier, dayKey },
    );

    if (existingId) {
      return null;
    }

    const tenantSlug: string =
      args.tenantSlug ??
      (await ctx.runQuery(internal.insights.generateInternal.resolveMemberTenant, {
        tokenIdentifier: args.tokenIdentifier,
        fallbackTenantSlug: "demo-media",
      }));

    const summary = await ctx.runQuery(
      internal.insights.generateInternal.loadSignalSummary,
      { tokenIdentifier: args.tokenIdentifier, tenantSlug, now },
    );

    const { system, user } = buildInsightsPrompt(summary, locale);

    let tasteText: string;

    try {
      if (args.mockProse !== undefined) {
        tasteText = args.mockProse;
      } else {
        const { threadId } = await tasteInsightsAgent.createThread(ctx, {
          userId: args.tokenIdentifier,
          title: `Taste insights — ${dayKey}`,
        });

        const result = await withTimeout(
          tasteInsightsAgent.generateText(
            ctx,
            {
              userId: args.tokenIdentifier,
              threadId,
            },
            { system, prompt: user },
          ),
          GENERATION_TIMEOUT_MS,
          "taste_insights_prose",
        );

        tasteText = result.text.trim();
      }
    } catch (error) {
      if (error instanceof PromptInjectionRejected) {
        await ctx.runMutation(
          internal.insights.recordSecurityEvent.recordInsightsSecurityEvent,
          {
            tokenIdentifier: args.tokenIdentifier,
            kind: "injection_high",
            matched: error.matched,
          },
        );
        throw error;
      }
      throw error;
    }

    const relatedContentIds: Id<"contents">[] = await ctx.runQuery(
      internal.insights.generateInternal.loadRelatedContentIds,
      { tokenIdentifier: args.tokenIdentifier, tenantSlug, now },
    );

    const analysisId: Id<"tasteAnalysis"> = await ctx.runMutation(
      internal.insights.generateInternal.insertTasteAnalysis,
      {
        tokenIdentifier: args.tokenIdentifier,
        tenantSlug,
        dayKey,
        tasteText,
        relatedContentIds,
        model: args.mockProse !== undefined ? "mock" : TASTE_INSIGHTS_MODEL,
        createdAt: now,
      },
    );

    return analysisId;
  },
});
