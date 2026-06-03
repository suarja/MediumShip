export default {
  eyebrow: "Membership",
  guestTitle: "Reading is open. Membership unlocks the rest.",
  guestCardTitle: "Member benefits",
  guestCardDescription:
    "Sign in to save stories, sync progress, download supported content, and access premium features.",
  createAccount: "Create an account",
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
