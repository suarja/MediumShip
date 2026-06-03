/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as content_queries from "../content/queries.js";
import type * as http from "../http.js";
import type * as httpHandlers_clerkWebhook from "../httpHandlers/clerkWebhook.js";
import type * as httpHandlers_svix from "../httpHandlers/svix.js";
import type * as tenants_queries from "../tenants/queries.js";
import type * as tenants_seed from "../tenants/seed.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "content/queries": typeof content_queries;
  http: typeof http;
  "httpHandlers/clerkWebhook": typeof httpHandlers_clerkWebhook;
  "httpHandlers/svix": typeof httpHandlers_svix;
  "tenants/queries": typeof tenants_queries;
  "tenants/seed": typeof tenants_seed;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
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

export declare const components: {};
