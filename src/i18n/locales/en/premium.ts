export default {
  title: "Premium",
  subtitle:
    "Coming soon: offline downloads, synced bookmarks and personalization for members.",
  // Paywall shown on premium content for non-members.
  paywallEyebrow: "Member access",
  paywallBenefits: [
    "Every premium article and episode",
    "Hosted videos in full",
    "Coming soon: offline downloads",
  ],
  // Guest (not signed in): tapping the CTA opens sign-in.
  paywallGuestHint: "Sign in to activate your member access.",
  // Signed in but not yet a member: no self-serve purchase yet, the team grants it.
  paywallMemberPendingTitle: "Member access not active yet",
  paywallMemberPendingBody:
    "Your account is signed in but does not have member access yet. It is granted by the team.",
} as const;
