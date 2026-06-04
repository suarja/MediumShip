export default {
  title: "Premium",
  subtitle:
    "Bientôt : téléchargements hors-ligne, favoris synchronisés et personnalisation pour les membres.",
  // Paywall shown on premium content for non-members.
  paywallEyebrow: "Accès membre",
  paywallBenefits: [
    "Tous les articles et épisodes premium",
    "Vidéos hébergées en intégralité",
    "Bientôt : téléchargements hors-ligne",
  ],
  // Guest (not signed in): tapping the CTA opens sign-in.
  paywallGuestHint: "Connecte-toi pour activer ton accès membre.",
  // Signed in but not yet a member: no self-serve purchase yet, the team grants it.
  paywallMemberPendingTitle: "Accès membre pas encore actif",
  paywallMemberPendingBody:
    "Ton compte est connecté mais n'a pas encore l'accès membre. Il est activé par l'équipe.",
} as const;
