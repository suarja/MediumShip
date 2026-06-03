export default {
  eyebrow: "Slice auth",
  fallbackTitle: "Connecté",
  description:
    "Cet écran valide le chemin Clerk → Convex JWT : l'identité ci-dessous est résolue côté serveur via ctx.auth.getUserIdentity().",
  cardTitle: "Identité Convex",
  loadingIdentity: "Résolution de la query authentifiée...",
  noIdentity: "Aucune identité renvoyée.",
  email: "Email : {{value}}",
  name: "Nom : {{value}}",
  storedInConvex: "Stocké dans Convex : {{value}}",
  storedYes: "oui",
  storedNo: "pas encore",
} as const;
