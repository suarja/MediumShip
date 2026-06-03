export default {
  eyebrow: "Convex slice",
  title: "MediumShip backend connectivity",
  description:
    "This screen proves the first end-to-end Convex path in the app: query the default tenant and seed it if it does not exist yet.",
  loadingTenant: "Loading tenant from Convex...",
  seedFailedTitle: "Convex seed failed",
  unknownError: "Unknown error",
  emptyState: {
    title: "No tenant found yet",
    expectedSeedSlug: "Expected seed slug: {{slug}}",
    ctaIdle: "Seed demo tenant",
    ctaBusy: "Seeding...",
  },
  loadedState: {
    title: "Tenant loaded from Convex",
    name: "Name: {{value}}",
    slug: "Slug: {{value}}",
    modules: "Modules: {{value}}",
  },
  openProfile: "Open profile (auth slice) →",
} as const;
