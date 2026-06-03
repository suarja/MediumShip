export default {
  eyebrow: "Auth slice",
  fallbackTitle: "Signed in",
  description:
    "This screen proves the Clerk → Convex JWT path: the identity below is resolved server-side via ctx.auth.getUserIdentity().",
  cardTitle: "Convex identity",
  loadingIdentity: "Resolving authenticated query...",
  noIdentity: "No identity returned.",
  email: "Email: {{value}}",
  name: "Name: {{value}}",
  storedInConvex: "Stored in Convex: {{value}}",
  storedYes: "yes",
  storedNo: "not yet",
} as const;
