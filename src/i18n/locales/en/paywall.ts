export default {
  reasons: {
    offline: {
      eyebrow: "◉ Offline download · Premium",
      title: "Listen everywhere,",
      titleItalic: "even without signal.",
      description:
        "Offline downloads are reserved for Premium members. Online playback stays free.",
    },
    lists: {
      eyebrow: "◉ Unlimited lists · Premium",
      title: "Organise",
      titleItalic: "without limits.",
      description:
        "Unlimited personal lists and multi-device sync are Premium-only.",
    },
    members: {
      eyebrow: "◉ Members room · Premium",
      title: "Go behind",
      titleItalic: "the scenes.",
      description:
        "The members room (AMAs, votes, backstage) is reserved for Premium subscribers.",
    },
    content: {
      eyebrow: "◉ Premium content",
      title: "Support. ",
      titleItalic: "Access everything.",
      description:
        "This content is reserved for Premium members. Your subscription funds editorial work.",
    },
    support: {
      eyebrow: "◉ Premium access",
      title: "Support. ",
      titleItalic: "Receive more.",
      description:
        "All content, offline mode, personal lists and the members room.",
    },
  },
  benefits: [
    "Unlimited offline downloads",
    "Playback progress synced across devices",
    "Unlimited personal lists + members room",
  ],
  signInCta: "Sign in to continue",
  becomeMemberCta: "Become a member",
  purchaseCta: "Start Premium — {{price}}/month",
  purchaseCtaFallback: "Start Premium — €2/month",
  trialNote: "2-week free trial, then billed monthly. Cancel anytime.",
  restoreCta: "Restore purchases",
  purchasing: "Processing…",
  purchaseSuccess: "Welcome to Premium! Your access will unlock in a moment.",
  purchaseCancelled: "Purchase cancelled.",
  purchaseError: "Purchase failed. Please try again.",
  alreadySubscribed: "You already have an active Premium subscription.",
  restoreSuccess: "Purchases restored. Your access will unlock in a moment.",
  restoreError: "No active subscription found.",
  webPurchaseHint:
    "In-app purchases are available in the iOS and Android app. Open the app on your phone to subscribe.",
  dismissCta: "LATER — CONTINUE FREE",
  pendingTitle: "Membership not yet active",
  pendingBody:
    "Your account is connected but membership hasn’t been activated yet. It is enabled by the team.",
  crestFallback: "M",
} as const;
