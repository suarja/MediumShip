# Componentes Convex con Descripción (99)

## AI Agents (10)
1. **AI Agent** - Agents organize your AI workflows into units, with message history and vector search built in.  
2. **Neutral Cost** - Organizes all of your costs into one place. Seamlessly track your AI usage and Tool costs and charge accordingly.  
3. **Browserbase Stagehand** - Extract data, perform actions, and automate workflows using natural language - no Playwright knowledge required.  
4. **Firecrawl Scrape** - Scrape any URL and get clean markdown, HTML, screenshots, or structured JSON - with durable caching and reactive...  
5. **Durable Agents** - Build AI agents that can run indefinitely and survive failures and restarts.  
6. **Browser Use** - A Convex component that wraps the Browser Use Cloud API, enabling AI-powered browser automation with persistent t...  
7. **DatabaseChat** - DatabaseChat lets users ask questions about your data in plain English. The LLM calls tools you define to query y...  
8. **convex-elevenlabs** - A Convex component for async speech-to-text transcription using ElevenLabs.  
9. **convex-orchestrator** - A convex orchestrator component for Convex.  
10. **convex-jina** - Convex component wrapping Jina AI Reader and Search APIs with durable caching and reactive queries.

## Authentication (11)
11. **Better Auth** - Provides an integration layer for using Better Auth with Convex.  
12. **WorkOS AuthKit** - Integrate with AuthKit events and actions, and keep auth data synced in your Convex database.  
13. **convex-authz** - A Zanzibar-inspired authorization component that supports role-based, attribute-based, and relationship-based acc...  
14. **API Tokens** - API token management for Convex — create, validate, rotate, and revoke tokens with expiration, namespaces, and audit logs.  
15. **Convex Api Keys** - A Convex component for API key management with rotation, expiry, idle timeouts, typed permissions, and audit logs...  
16. **convex-tenants** - A multi-tenant organization and team management component for Convex with built-in authorization via @djpanda/con...  
17. **Kinde Sync** - Sync Kinde auth events into Convex in real time via webhooks. No polling, no boilerplate JWT verification.  
18. **oauth-provider** - OAuth 2.1 / OpenID Connect Provider for Convex Auth (Beta).  
19. **Convex Passkey-auth** - Passwordless WebAuthn passkey authentication — self-minted JWTs, multi-device support, session management, and Re...  
20. **convex-api-keys** - A convex api keys component for Convex.  
21. **Convex Invite-links** - Membership and invite management for Convex — shareable invite links with expiration, email locking, and group ac...  

## Backend (10)
22. **Rate Limiter** - Define and use application-layer rate limits. Type-safe, transactional, fair, safe, and configurable sharding to...  
23. **Action Cache** - Cache action results, like expensive AI calls, with optional expiration times.  
24. **Timeline** - Undo/redo state management with named checkpoints.  
25. **Webhook Receiver** - Drop-in Convex component that receives, verifies, deduplicates, and retries inbound webhooks from any provider.  
26. **Convex Checkpoints** - Define user checkpoints and trigger actions when activity thresholds are met 
27. **Webhook Sender** - Managed webhook delivery with Ed25519 signing, automatic retries, exponential backoff, rate limiting, and full de...  
28. **Convex Debouncer** - Debounce expensive operations like LLM calls, metrics computation, or any heavy processing that should only run a...  
29. **convex-tracer** - A Tracer component for Convex. Powerful Observability and tracing for Convex applications. Track function calls a...  
30. **Link-Shortener** - A self-hosted link shortener Convex component for custom domains. Create, update, and revoke short codes with bui...  
31. **convex-mq** - A typed message queue component for Convex with reactive consumers, visibility timeouts, and automatic retries.

## AI Infrastructure (7)
32. **Persistent Text Streaming** - Stream text like AI chat to the browser in real-time while also efficiently storing it to the database.  
33. **RAG** - Retrieval-Augmented Generation (RAG) for use with your AI products and Agents  
34. **Agent Ready** - A Convex component that generates, caches, and serves llms.txt,agents.md, and llms-full.txt from your Convex back...  
35. **Nano Banana** - Generate stunning AI images directly in your Convex backend with persistent storage, real-time status tracking, a...  
36. **Convex MCP Gateway** - Auth-aware MCP server for Convex: expose Convex functions as MCP tools with per-tool scopes, OAuth 2.1 discovery,...  
37. **Agentmail** - AgentMail in Convex: a real, queryable email inbox for AI agents, threads, labels, and full messages live in your...  
38. **LLM Cache** - LLM request/response caching with tiered TTL, time travel, and request normalization for Convex.

## Collaboration (4)
39. **Presence** - A Convex component for managing presence functionality, i.e., a live-updating list of users in a "room" including...  
40. **Collaborative Text Editor Sync** - Add a collaborative editor sync engine for the popular ProseMirror-based Tiptap and BlockNote rich text editors.  
41. **Unread Tracking** - Real-time unread message counter and read receipt tracker with watermark-based read positions, bulk subsc...  
42. **Convex Comments** - A full-featured comments component for Convex with threads, mentions, reactions, and real-time typing indicators.

## Database (9)
43. **Migrations** - Framework for long running data migrations of live data.  
44. **Aggregate** - Keep track of sums and counts in a denormalized and scalable way.  
45. **Sharded Counter** - Scalable counter that can increment and decrement with high throughput.  
46. **Geospatial** - Efficiently query points on a map within a selected region of the globe.  
47. **convex-kv** - Hierarchical Key-Value store for Convex  
48. **Cascading Deletes** - Delete a record and all its dependents in one call. Configure relationships via existing indexes — cascades are a...  
49. **Cascading Delete** - A Convex component for managing cascading deletes across related documents with atomic and batched deletion modes...  
50. **Convex Audit Log** - A comprehensive audit logging component for Convex that helps you track user actions, API calls, and system event...  
51. **smart-tags** - A Convex component for smart tagging and categorization with hierarchy and analytics 

## Durable Functions (6)
52. **Workpool** - Workpools give critical tasks priority by organizing async operations into separate, customizable queues.  
53. **Workflow** - Simplify programming long running code flows. Workflows execute durably with configurable retries and delays.  
54. **Action Retrier** - Add reliability to an unreliable external service. Retry idempotent calls a set number of times.  
55. **Crons** - This Convex component provides functionality for registering and managing cron jobs at runtime.   
56. **Batch Processor** - Batch processing component for Convex - batch accumulator and table iterator  
57. **QuiCK** - Implementation of Apple's QuiCK paper as a Convex component  

## Integrations (17)
58. **PostHog** - PostHog analytics and feature flags for your Convex backend.  
59. **LaunchDarkly Feature Flags** - Sync your LaunchDarkly feature flags with your Convex backend for use in your Convex functions.  
60. **Basic Blog** - Headless blog & CMS as a Convex component: npm package (basic-blog-convex-blog-cms), bundled TipTap admin + CLI,...  
61. **Convex Analytics** - First-party analytics for Convex. Track events, identify users, and monitor real-time data with a drop-in dashboa...  
62. **Convalytics** - Web analytics and product event tracking built for Convex apps.  
63. **Wearables** - Wearable device integrations. Sync health data from Garmin, Strava, Whoop, Polar, Suunto, Apple HealthKit, Samsun...  
64. **Loops** - Integrate with Loops.so email marketing platform. Send transactional emails, manage contacts, trigger loops, and...  
65. **Static-Hosting** - A Convex component that enables hosting static React/Vite apps using Convex HTTP actions and file storage.  
66. **convex-inbound** - A drop-in Convex Component that adds full-stack email capabilities to your Convex app, powered by inbound.new.  
67. **Steel Browser** - Cloud browser sessions, scraping, captchas, files, and persistent multi-tenant browser state for Convex.  
68. **Affiliate Tracking** - Affiliate tracking, attribution, commissions, payouts, and analytics for Convex apps.  
69. **OSS Stats** - Keep GitHub and npm data for your open source projects synced to your Convex database.

## Messaging (6)
70. **Resend** - This component is the official way to integrate the Resend email service with your Convex project.  
71. **Expo Push Notifications** - Send push notifications with Expo. Manage retries and batching.  
72. **Twilio SMS** - Easily send and receive SMS via Twilio. Easily query message status from your query function.  
73. **AutoSend** - Send emails from your Convex project using AutoSend's official Convex component.  
74. **Brevo** - This component integrates Brevo transactional email and SMS with Convex.  
75. **ClawdBot Message Hub** - Message hub backend for AI chatbots — webhook processing, session management, conversation history, multi-gateway...

## Storage (10)
76. **Cloudflare R2** - Store and serve files from Cloudflare R2.  
77. **ConvexFS** - A powerful, globally distributed file storage and serving component for Convex.  
78. **Files Control** - Secure file uploads, access control, download grants, and lifecycle cleanup.  
79. **Mux** - The @mux/convex component wires up database tables, webhook handling and reactive queries so your app always know...  
80. **Convex S3** - Amazon S3 storage component for Convex with direct upload/download URLs, cache control, and stable public URLs.  
81. **Convex Bunny Storage** - Component to upload file in Bunny Storage  
82. **UploadThing** - UploadThing file tracking, access control, and cleanup for Convex.  
83. **Convex Secret Store** - Encrypted, namespace-scoped secret storage for Convex with key rotation, expiry, and audit logs.  
84. **Transloadit** - Create Transloadit Assemblies, sign Uppy uploads, and persist status/results in Convex.  
85. **Cloudinary** - Cloudinary integration that provides image upload, transformation, and management capabilities using direct Cloud...

## Payments (9)
86. **Stripe** - Integrates Stripe payments, subscriptions, and billing into your Convex application.  
87. **Autumn** - Autumn is your application's pricing and billing database.  
88. **Dodo Payments** - Dodo Payments is your complete solution for billing and payments, purpose-built for AI and SaaS applications.  
89. **Polar** - Add subscriptions and billing to your Convex app with Polar.  
90. **RevenueCat** - Convex component for RevenueCat subscription management  
91. **OxaPay** - Crypto payments for Convex. Invoices, wallets, and payouts in your Convex backend.  
92. **Stancer** - Convex component for Stancer payment  
93. **Kinde Billing** - Add Kinde billing to your Convex app. Reactive subscriptions, checkout, self-serve portal, and feature gating.  
94. **Creem** - Drop-in billing for Convex apps with Creem: subscriptions, one-time purchases, seat-based pricing, customer portal...