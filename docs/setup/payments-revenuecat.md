# Payments & RevenueCat Setup

Mobile in-app purchases (IAP) run through **RevenueCat**. The premium *read*
path (`getMyEntitlement` / `useIsMember`) is decoupled from billing — payment
providers only ever **write** the `entitlements` table; nothing changes the read
path. This doc covers how payments are gated, how the client picks its API key,
and the exact checklist to go live.

## 1. The two kill-switches

Both live in [`src/features/tenant/feature-access.ts`](../../src/features/tenant/feature-access.ts).

| Flag | `false` (current) | `true` |
| --- | --- | --- |
| `PAYMENTS_ENABLED` | RevenueCat tunnel hidden. The premium CTA grants permanent Premium via `startFreePremium`. The SDK is **never configured**. | Real IAP flow: paywall loads offerings, `purchasePackage`, restore, manage-subscription. |
| `PREMIUM_PAYMENT_DEFERRED` | Real entitlement gating active (`isPro` required for premium features). | Premium open to everyone (demo / pre-provider mode). |

`PurchasesBootstrap` ([`purchases-bootstrap.tsx`](../../src/features/billing/purchases-bootstrap.tsx))
is **gated on `PAYMENTS_ENABLED`**: while payments are off, `Purchases.configure()`
is never called. This is deliberate — it guarantees a Test Store key can never
reach a release build (see §3).

## 2. Client API keys (Expo public env)

These are bundled into the app (public values only). Set them in `.env.local`
for dev and as EAS build env vars for production.

| Var | Purpose |
| --- | --- |
| `EXPO_PUBLIC_REVENUECAT_TEST_STORE_KEY` | RevenueCat **Test Store** key (`test_…`). Used **only in `__DEV__`** when set. |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | **Production** iOS SDK key (`appl_…`). Used in release builds on iOS. |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | **Production** Android SDK key (`goog_…`). Used in release builds on Android. |
| `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID` | Entitlement identifier (default in code: `Knowly Pro`). |

Key resolution lives in `resolveApiKey()`
([`purchases.ts`](../../src/features/billing/purchases.ts)):

```
__DEV__ + TEST_STORE_KEY set   → test_store key  (RC Test Store backend)
release build, iOS             → EXPO_PUBLIC_REVENUECAT_IOS_KEY
release build, Android         → EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
no key / web                   → none → configure() is skipped (no crash)
```

- Test Store keys require `react-native-purchases@9.5.4+`.
- Dashboard locations: Test Store key → RevenueCat → Apps and providers → Test
  Store → API key. Production keys → Project Settings → API keys (platform-specific).

## 3. ⚠️ Never ship a Test Store key in a release build

RevenueCat: *"Never submit an app to the App Store or Google Play that is
configured with a Test Store API key."* A `test_…` key in a release build does
**not crash** — `Purchases.configure()` validates lazily — but it talks to the
Test Store backend, so real purchases will not work, and it is a store-compliance
violation.

The `PAYMENTS_ENABLED` gate on `PurchasesBootstrap` keeps us safe while payments
are off. The trap to watch: `EXPO_PUBLIC_REVENUECAT_IOS_KEY` must hold a real
`appl_…` key — **not** a copy of the `test_…` Test Store key — before flipping
the switch.

## 4. Convex deployment env (server-side)

These are Convex **deployment** env vars, not Expo public vars. Set them with
`npx convex env set …` on the target deployment.

| Var | Required when | Purpose |
| --- | --- | --- |
| `REVENUECAT_WEBHOOK_AUTH` | live IAP | Shared secret the webhook handler checks against the `Authorization` header. |
| `REVENUECAT_ENTITLEMENT_ID` | live IAP | Entitlement id used server-side (mirror of the Expo var). |
| `REVENUECAT_API_KEY` | optional | RevenueCat **secret** key — only for REST `syncSubscriber` backfill after a purchase. |

```sh
npx convex env set REVENUECAT_WEBHOOK_AUTH "<secret>"
npx convex env set REVENUECAT_ENTITLEMENT_ID "Knowly Pro"
# optional:
npx convex env set REVENUECAT_API_KEY "<secret-key>"
```

**Webhook** (RevenueCat → Project Settings → Integrations → Webhooks):
- URL: `https://<deployment>.convex.site/webhooks/revenuecat`
  (the `.convex.site` URL, not `.convex.cloud`).
- Authorization header: the value of `REVENUECAT_WEBHOOK_AUTH`.

Handler: [`convex/httpHandlers/revenuecatWebhook.ts`](../../convex/httpHandlers/revenuecatWebhook.ts),
routed in [`convex/http.ts`](../../convex/http.ts). The webhook is the source of
truth for premium state — the client purchase result is treated as a hint only.

## 5. Go-live checklist

1. App Store Connect / Play Console: create the subscription products.
2. RevenueCat: attach products to an **Offering** and define the `Knowly Pro`
   entitlement.
3. Set production keys as **EAS build env vars**:
   - `EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_…`
   - `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_…`
   - `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=Knowly Pro`
4. Set the Convex deployment vars (§4) and configure the webhook.
5. Flip `PAYMENTS_ENABLED = true` in `feature-access.ts`.
6. Verify on a real device with a sandbox account: offering loads, purchase,
   restore, manage-subscription, and that the webhook flips `entitlements`.

> Premium access derives from `hasEntitlement()`, never from a raw purchase
> event/status — access lasts until expiration even after cancellation. See
> `docs/agents/domain.md` and the entitlements model in `convex/entitlements/`.
