"use node";

import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { tasteInsightsAgent, TASTE_INSIGHTS_MODEL } from "./agent";
import { formatDayKey } from "./dayKey";
import { buildInsightsPrompt, toCandidatePicks, type InsightsLocale } from "./prompt";
import {
  buildFallbackReport,
  composePreviewText,
  parseInsightsReport,
  type ParsedInsightsReport,
} from "./reportFormat";
import { mockReportValidator } from "./mockReport";
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

function mapReportToPicks(
  report: ParsedInsightsReport,
  candidateIds: readonly Id<"contents">[],
): Array<{ contentId: Id<"contents">; rationale: string }> {
  const bySlot = new Map(
    report.picks.map((pick) => [pick.slot, pick.rationale] as const),
  );

  return candidateIds.map((contentId, index) => ({
    contentId,
    rationale:
      bySlot.get(index + 1) ??
      (report.overview.slice(0, 160) ||
        "Selected to match your recent reading patterns."),
  }));
}

export const generateForMember = internalAction({
  args: {
    tokenIdentifier: v.string(),
    tenantSlug: v.optional(v.string()),
    locale: v.optional(v.union(v.literal("fr"), v.literal("en"))),
    now: v.optional(v.number()),
    /** Legacy test hook — overview only. */
    mockProse: v.optional(v.string()),
    /** Structured test hook — full editorial report. */
    mockReport: v.optional(mockReportValidator),
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

    const candidates = await ctx.runQuery(
      internal.insights.generateInternal.loadRelatedCandidates,
      { tokenIdentifier: args.tokenIdentifier, tenantSlug, now },
    );

    const candidateIds = candidates.map((row) => row._id);

    const previous = await ctx.runQuery(
      internal.insights.generateInternal.loadPreviousAnalysis,
      { tokenIdentifier: args.tokenIdentifier, beforeCreatedAt: now },
    );

    const { system, user } = buildInsightsPrompt(
      summary,
      locale,
      toCandidatePicks(candidates),
      previous,
    );

    let report: ParsedInsightsReport;

    try {
      if (args.mockReport !== undefined) {
        report = {
          overview: args.mockReport.overview,
          reflection: args.mockReport.reflection,
          trends: args.mockReport.trends,
          picks: args.mockReport.picks,
        };
      } else if (args.mockProse !== undefined) {
        report = {
          overview: args.mockProse,
          reflection: undefined,
          trends: undefined,
          picks: candidateIds.map((_, index) => ({
            slot: index + 1,
            rationale:
              locale === "fr"
                ? "Ce contenu prolonge vos lectures récentes."
                : "This pick extends your recent reading.",
          })),
        };
      } else {
        let threadId: string | null = await ctx.runQuery(
          internal.insights.generateInternal.getTasteThreadId,
          { tokenIdentifier: args.tokenIdentifier },
        );

        if (!threadId) {
          const created = await tasteInsightsAgent.createThread(ctx, {
            userId: args.tokenIdentifier,
            title: "Taste insights",
          });
          threadId = created.threadId;
          await ctx.runMutation(internal.insights.generateInternal.saveTasteThreadId, {
            tokenIdentifier: args.tokenIdentifier,
            threadId,
          });
        }

        const { thread } = await tasteInsightsAgent.continueThread(ctx, {
          threadId,
          userId: args.tokenIdentifier,
        });

        const result = await withTimeout(
          thread.generateText({ system, prompt: user }),
          GENERATION_TIMEOUT_MS,
          "taste_insights_report",
        );

        const parsed = parseInsightsReport(result.text, candidateIds.length);
        report =
          parsed ??
          buildFallbackReport(locale, Math.max(candidateIds.length, 1));
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

    const overview = report.overview.trim() || composePreviewText(report);
    const relatedPicks = mapReportToPicks(report, candidateIds);
    const relatedContentIds = relatedPicks.map((pick) => pick.contentId);

    const analysisId: Id<"tasteAnalysis"> = await ctx.runMutation(
      internal.insights.generateInternal.insertTasteAnalysis,
      {
        tokenIdentifier: args.tokenIdentifier,
        tenantSlug,
        dayKey,
        tasteText: overview,
        reflection: report.reflection,
        trends: report.trends,
        relatedPicks,
        relatedContentIds,
        model:
          args.mockReport !== undefined || args.mockProse !== undefined
            ? "mock"
            : TASTE_INSIGHTS_MODEL,
        createdAt: now,
      },
    );

    return analysisId;
  },
});
