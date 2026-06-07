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
import type * as categories_catalog from "../categories/catalog.js";
import type * as categories_catalogImport from "../categories/catalogImport.js";
import type * as categories_interests from "../categories/interests.js";
import type * as categories_model from "../categories/model.js";
import type * as categories_queries from "../categories/queries.js";
import type * as categories_tree from "../categories/tree.js";
import type * as cms_authz from "../cms/authz.js";
import type * as cms_categories from "../cms/categories.js";
import type * as cms_collections from "../cms/collections.js";
import type * as cms_events from "../cms/events.js";
import type * as cms_mutations from "../cms/mutations.js";
import type * as cms_queries from "../cms/queries.js";
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
import type * as discovery_providers_wikipedia from "../discovery/providers/wikipedia.js";
import type * as discovery_refill from "../discovery/refill.js";
import type * as discovery_scoring from "../discovery/scoring.js";
import type * as discovery_visibility from "../discovery/visibility.js";
import type * as entitlements_authz from "../entitlements/authz.js";
import type * as entitlements_model from "../entitlements/model.js";
import type * as entitlements_mutations from "../entitlements/mutations.js";
import type * as entitlements_queries from "../entitlements/queries.js";
import type * as events_model from "../events/model.js";
import type * as events_queries from "../events/queries.js";
import type * as http from "../http.js";
import type * as httpHandlers_clerkWebhook from "../httpHandlers/clerkWebhook.js";
import type * as httpHandlers_svix from "../httpHandlers/svix.js";
import type * as media_r2 from "../media/r2.js";
import type * as personalLists_covers from "../personalLists/covers.js";
import type * as personalLists_model from "../personalLists/model.js";
import type * as personalLists_mutations from "../personalLists/mutations.js";
import type * as personalLists_queries from "../personalLists/queries.js";
import type * as playbackProgress_mutations from "../playbackProgress/mutations.js";
import type * as playbackProgress_queries from "../playbackProgress/queries.js";
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
  "categories/catalog": typeof categories_catalog;
  "categories/catalogImport": typeof categories_catalogImport;
  "categories/interests": typeof categories_interests;
  "categories/model": typeof categories_model;
  "categories/queries": typeof categories_queries;
  "categories/tree": typeof categories_tree;
  "cms/authz": typeof cms_authz;
  "cms/categories": typeof cms_categories;
  "cms/collections": typeof cms_collections;
  "cms/events": typeof cms_events;
  "cms/mutations": typeof cms_mutations;
  "cms/queries": typeof cms_queries;
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
  "discovery/providers/wikipedia": typeof discovery_providers_wikipedia;
  "discovery/refill": typeof discovery_refill;
  "discovery/scoring": typeof discovery_scoring;
  "discovery/visibility": typeof discovery_visibility;
  "entitlements/authz": typeof entitlements_authz;
  "entitlements/model": typeof entitlements_model;
  "entitlements/mutations": typeof entitlements_mutations;
  "entitlements/queries": typeof entitlements_queries;
  "events/model": typeof events_model;
  "events/queries": typeof events_queries;
  http: typeof http;
  "httpHandlers/clerkWebhook": typeof httpHandlers_clerkWebhook;
  "httpHandlers/svix": typeof httpHandlers_svix;
  "media/r2": typeof media_r2;
  "personalLists/covers": typeof personalLists_covers;
  "personalLists/model": typeof personalLists_model;
  "personalLists/mutations": typeof personalLists_mutations;
  "personalLists/queries": typeof personalLists_queries;
  "playbackProgress/mutations": typeof playbackProgress_mutations;
  "playbackProgress/queries": typeof playbackProgress_queries;
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
  youtubeMetadata: import("convex-youtube-cache/_generated/component.js").ComponentApi<"youtubeMetadata">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
};
