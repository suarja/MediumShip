import type { QueryCtx } from "../_generated/server";
import type { YouTubeWhitelistLocale } from "./providers/youtubeWhitelist";

export async function countWhitelistChannelsByLocale(
  ctx: Pick<QueryCtx, "db">,
): Promise<Record<YouTubeWhitelistLocale, number>> {
  const counts: Record<YouTubeWhitelistLocale, number> = { fr: 0, en: 0 };

  for (const locale of ["fr", "en"] as const) {
    const rows = await ctx.db
      .query("youtubeWhitelistChannels")
      .withIndex("by_locale", (q) => q.eq("locale", locale))
      .collect();
    counts[locale] = rows.filter((row) => row.enabled).length;
  }

  return counts;
}
