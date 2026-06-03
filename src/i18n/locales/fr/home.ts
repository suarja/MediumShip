export default {
  eyebrow: "Slice Convex",
  title: "Connectivité backend MediumShip",
  description:
    "Cet écran valide le premier chemin Convex de bout en bout dans l'app : lire le tenant par défaut puis le créer s'il n'existe pas encore.",
  loadingTenant: "Chargement du tenant depuis Convex...",
  seedFailedTitle: "Échec du seed Convex",
  unknownError: "Erreur inconnue",
  emptyState: {
    title: "Aucun tenant trouvé pour le moment",
    expectedSeedSlug: "Slug attendu pour le seed : {{slug}}",
    ctaIdle: "Seed le tenant de démo",
    ctaBusy: "Seed en cours...",
  },
  loadedState: {
    title: "Tenant chargé depuis Convex",
    name: "Nom : {{value}}",
    slug: "Slug : {{value}}",
    modules: "Modules : {{value}}",
  },
  openProfile: "Ouvrir le profil (slice auth) →",
} as const;
