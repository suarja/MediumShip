/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bookmarks_model from "../bookmarks/model.js";
import type * as bookmarks_mutations from "../bookmarks/mutations.js";
import type * as bookmarks_queries from "../bookmarks/queries.js";
import type * as categories_aggregate from "../categories/aggregate.js";
import type * as categories_backfillCounts from "../categories/backfillCounts.js";
import type * as categories_catalog from "../categories/catalog.js";
import type * as categories_catalogConstants from "../categories/catalogConstants.js";
import type * as categories_catalogImport from "../categories/catalogImport.js";
import type * as categories_catalogImportParse from "../categories/catalogImportParse.js";
import type * as categories_catalogLabelPolicy from "../categories/catalogLabelPolicy.js";
import type * as categories_catalogLocale from "../categories/catalogLocale.js";
import type * as categories_catalogRead from "../categories/catalogRead.js";
import type * as categories_catalogTenantStatus from "../categories/catalogTenantStatus.js";
import type * as categories_interests from "../categories/interests.js";
import type * as categories_model from "../categories/model.js";
import type * as categories_queries from "../categories/queries.js";
import type * as categories_tree from "../categories/tree.js";
import type * as cms_authz from "../cms/authz.js";
import type * as cms_catalog from "../cms/catalog.js";
import type * as cms_categories from "../cms/categories.js";
import type * as cms_collections from "../cms/collections.js";
import type * as cms_events from "../cms/events.js";
import type * as cms_mutations from "../cms/mutations.js";
import type * as cms_queries from "../cms/queries.js";
import type * as cms_youtubeWhitelist from "../cms/youtubeWhitelist.js";
import type * as collections_model from "../collections/model.js";
import type * as collections_queries from "../collections/queries.js";
import type * as content_queries from "../content/queries.js";
import type * as content_source from "../content/source.js";
import type * as crons from "../crons.js";
import type * as discovery_engagement from "../discovery/engagement.js";
import type * as discovery_feed from "../discovery/feed.js";
import type * as discovery_fetchDemand from "../discovery/fetchDemand.js";
import type * as discovery_immersion from "../discovery/immersion.js";
import type * as discovery_ingest from "../discovery/ingest.js";
import type * as discovery_interactions from "../discovery/interactions.js";
import type * as discovery_provider from "../discovery/provider.js";
import type * as discovery_providerConfig from "../discovery/providerConfig.js";
import type * as discovery_providers_rss from "../discovery/providers/rss.js";
import type * as discovery_providers_wikipedia from "../discovery/providers/wikipedia.js";
import type * as discovery_providers_youtube from "../discovery/providers/youtube.js";
import type * as discovery_providers_youtubeWhitelist from "../discovery/providers/youtubeWhitelist.js";
import type * as discovery_refill from "../discovery/refill.js";
import type * as discovery_scoring from "../discovery/scoring.js";
import type * as discovery_visibility from "../discovery/visibility.js";
import type * as discovery_youtubeChannelResolve from "../discovery/youtubeChannelResolve.js";
import type * as discovery_youtubeWhitelistChannels from "../discovery/youtubeWhitelistChannels.js";
import type * as entitlements_authz from "../entitlements/authz.js";
import type * as entitlements_model from "../entitlements/model.js";
import type * as entitlements_mutations from "../entitlements/mutations.js";
import type * as entitlements_premiumEntitlementId from "../entitlements/premiumEntitlementId.js";
import type * as entitlements_queries from "../entitlements/queries.js";
import type * as entitlements_revenuecatSync from "../entitlements/revenuecatSync.js";
import type * as events_model from "../events/model.js";
import type * as events_queries from "../events/queries.js";
import type * as featureCatalog from "../featureCatalog.js";
import type * as http from "../http.js";
import type * as httpHandlers_clerkWebhook from "../httpHandlers/clerkWebhook.js";
import type * as httpHandlers_revenuecatWebhook from "../httpHandlers/revenuecatWebhook.js";
import type * as httpHandlers_svix from "../httpHandlers/svix.js";
import type * as insights_agent from "../insights/agent.js";
import type * as insights_cron from "../insights/cron.js";
import type * as insights_dayKey from "../insights/dayKey.js";
import type * as insights_generate from "../insights/generate.js";
import type * as insights_generateInternal from "../insights/generateInternal.js";
import type * as insights_instructions from "../insights/instructions.js";
import type * as insights_mockReport from "../insights/mockReport.js";
import type * as insights_mutations from "../insights/mutations.js";
import type * as insights_prompt from "../insights/prompt.js";
import type * as insights_queries from "../insights/queries.js";
import type * as insights_recordSecurityEvent from "../insights/recordSecurityEvent.js";
import type * as insights_relatedSelection from "../insights/relatedSelection.js";
import type * as insights_reportFormat from "../insights/reportFormat.js";
import type * as insights_reportSchema from "../insights/reportSchema.js";
import type * as insights_sanitizeUserInput from "../insights/sanitizeUserInput.js";
import type * as insights_seededRng from "../insights/seededRng.js";
import type * as insights_signals from "../insights/signals.js";
import type * as insights_testHelpers from "../insights/testHelpers.js";
import type * as media_r2 from "../media/r2.js";
import type * as personalLists_covers from "../personalLists/covers.js";
import type * as personalLists_model from "../personalLists/model.js";
import type * as personalLists_mutations from "../personalLists/mutations.js";
import type * as personalLists_queries from "../personalLists/queries.js";
import type * as playbackProgress_mutations from "../playbackProgress/mutations.js";
import type * as playbackProgress_queries from "../playbackProgress/queries.js";
import type * as playbackProgress_resume from "../playbackProgress/resume.js";
import type * as readingHistory_mutations from "../readingHistory/mutations.js";
import type * as readingHistory_queries from "../readingHistory/queries.js";
import type * as revenuecat from "../revenuecat.js";
import type * as tenants_mutations from "../tenants/mutations.js";
import type * as tenants_queries from "../tenants/queries.js";
import type * as tenants_seed from "../tenants/seed.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as youtube_enrich from "../youtube/enrich.js";
import type * as youtube_helpers from "../youtube/helpers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "bookmarks/model": typeof bookmarks_model;
  "bookmarks/mutations": typeof bookmarks_mutations;
  "bookmarks/queries": typeof bookmarks_queries;
  "categories/aggregate": typeof categories_aggregate;
  "categories/backfillCounts": typeof categories_backfillCounts;
  "categories/catalog": typeof categories_catalog;
  "categories/catalogConstants": typeof categories_catalogConstants;
  "categories/catalogImport": typeof categories_catalogImport;
  "categories/catalogImportParse": typeof categories_catalogImportParse;
  "categories/catalogLabelPolicy": typeof categories_catalogLabelPolicy;
  "categories/catalogLocale": typeof categories_catalogLocale;
  "categories/catalogRead": typeof categories_catalogRead;
  "categories/catalogTenantStatus": typeof categories_catalogTenantStatus;
  "categories/interests": typeof categories_interests;
  "categories/model": typeof categories_model;
  "categories/queries": typeof categories_queries;
  "categories/tree": typeof categories_tree;
  "cms/authz": typeof cms_authz;
  "cms/catalog": typeof cms_catalog;
  "cms/categories": typeof cms_categories;
  "cms/collections": typeof cms_collections;
  "cms/events": typeof cms_events;
  "cms/mutations": typeof cms_mutations;
  "cms/queries": typeof cms_queries;
  "cms/youtubeWhitelist": typeof cms_youtubeWhitelist;
  "collections/model": typeof collections_model;
  "collections/queries": typeof collections_queries;
  "content/queries": typeof content_queries;
  "content/source": typeof content_source;
  crons: typeof crons;
  "discovery/engagement": typeof discovery_engagement;
  "discovery/feed": typeof discovery_feed;
  "discovery/fetchDemand": typeof discovery_fetchDemand;
  "discovery/immersion": typeof discovery_immersion;
  "discovery/ingest": typeof discovery_ingest;
  "discovery/interactions": typeof discovery_interactions;
  "discovery/provider": typeof discovery_provider;
  "discovery/providerConfig": typeof discovery_providerConfig;
  "discovery/providers/rss": typeof discovery_providers_rss;
  "discovery/providers/wikipedia": typeof discovery_providers_wikipedia;
  "discovery/providers/youtube": typeof discovery_providers_youtube;
  "discovery/providers/youtubeWhitelist": typeof discovery_providers_youtubeWhitelist;
  "discovery/refill": typeof discovery_refill;
  "discovery/scoring": typeof discovery_scoring;
  "discovery/visibility": typeof discovery_visibility;
  "discovery/youtubeChannelResolve": typeof discovery_youtubeChannelResolve;
  "discovery/youtubeWhitelistChannels": typeof discovery_youtubeWhitelistChannels;
  "entitlements/authz": typeof entitlements_authz;
  "entitlements/model": typeof entitlements_model;
  "entitlements/mutations": typeof entitlements_mutations;
  "entitlements/premiumEntitlementId": typeof entitlements_premiumEntitlementId;
  "entitlements/queries": typeof entitlements_queries;
  "entitlements/revenuecatSync": typeof entitlements_revenuecatSync;
  "events/model": typeof events_model;
  "events/queries": typeof events_queries;
  featureCatalog: typeof featureCatalog;
  http: typeof http;
  "httpHandlers/clerkWebhook": typeof httpHandlers_clerkWebhook;
  "httpHandlers/revenuecatWebhook": typeof httpHandlers_revenuecatWebhook;
  "httpHandlers/svix": typeof httpHandlers_svix;
  "insights/agent": typeof insights_agent;
  "insights/cron": typeof insights_cron;
  "insights/dayKey": typeof insights_dayKey;
  "insights/generate": typeof insights_generate;
  "insights/generateInternal": typeof insights_generateInternal;
  "insights/instructions": typeof insights_instructions;
  "insights/mockReport": typeof insights_mockReport;
  "insights/mutations": typeof insights_mutations;
  "insights/prompt": typeof insights_prompt;
  "insights/queries": typeof insights_queries;
  "insights/recordSecurityEvent": typeof insights_recordSecurityEvent;
  "insights/relatedSelection": typeof insights_relatedSelection;
  "insights/reportFormat": typeof insights_reportFormat;
  "insights/reportSchema": typeof insights_reportSchema;
  "insights/sanitizeUserInput": typeof insights_sanitizeUserInput;
  "insights/seededRng": typeof insights_seededRng;
  "insights/signals": typeof insights_signals;
  "insights/testHelpers": typeof insights_testHelpers;
  "media/r2": typeof media_r2;
  "personalLists/covers": typeof personalLists_covers;
  "personalLists/model": typeof personalLists_model;
  "personalLists/mutations": typeof personalLists_mutations;
  "personalLists/queries": typeof personalLists_queries;
  "playbackProgress/mutations": typeof playbackProgress_mutations;
  "playbackProgress/queries": typeof playbackProgress_queries;
  "playbackProgress/resume": typeof playbackProgress_resume;
  "readingHistory/mutations": typeof readingHistory_mutations;
  "readingHistory/queries": typeof readingHistory_queries;
  revenuecat: typeof revenuecat;
  "tenants/mutations": typeof tenants_mutations;
  "tenants/queries": typeof tenants_queries;
  "tenants/seed": typeof tenants_seed;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "youtube/enrich": typeof youtube_enrich;
  "youtube/helpers": typeof youtube_helpers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agent: import("@convex-dev/agent/_generated/component.js").ComponentApi<"agent">;
  revenuecat: import("convex-revenuecat/_generated/component.js").ComponentApi<"revenuecat">;
  youtubeMetadata: import("convex-youtube-cache/_generated/component.js").ComponentApi<"youtubeMetadata">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
  contentCategoryCounts: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"contentCategoryCounts">;
};
