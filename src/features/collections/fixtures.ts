import type { Collection, CollectionDetail } from "./types";

export const FIXTURE_COLLECTIONS: Collection[] = [
  {
    _id: "coll-1",
    slug: "le-grand-entretien",
    title: "Le grand entretien",
    summary: "La série phare d'entretiens longs avec des personnalités marquantes.",
    itemCount: 14,
  },
  {
    _id: "coll-2",
    slug: "programme-2027",
    title: "Programme 2027",
    summary: "32 contenus qui préparent le cycle électoral. Mis à jour hebdomadairement.",
    itemCount: 32,
  },
  {
    _id: "coll-3",
    slug: "economie-autrement",
    title: "L'économie autrement",
    summary: "Une série de 8 vidéos qui déconstruisent les idées reçues sur l'économie.",
    itemCount: 8,
  },
];

export const FIXTURE_COLLECTION_DETAILS: Record<string, CollectionDetail> = {
  "coll-1": {
    ...FIXTURE_COLLECTIONS[0],
    items: [
      {
        contentId: "c1",
        title: "Avec Léa Bardin",
        kind: "episode",
        category: "Podcasts",
        isPremium: false,
      },
      {
        contentId: "c2",
        title: "L'économie du soin",
        kind: "article",
        category: "Analyses",
        isPremium: true,
      },
      {
        contentId: "c3",
        title: "Démocratie locale — trois propositions",
        kind: "video",
        category: "Vidéos",
        isPremium: false,
      },
    ],
  },
  "coll-2": {
    ...FIXTURE_COLLECTIONS[1],
    items: [
      {
        contentId: "c4",
        title: "Pouvoir d'achat : les vrais chiffres",
        kind: "article",
        category: "Analyses",
        isPremium: false,
      },
      {
        contentId: "c5",
        title: "La réforme des retraites expliquée",
        kind: "episode",
        category: "Podcasts",
        isPremium: true,
      },
    ],
  },
  "coll-3": {
    ...FIXTURE_COLLECTIONS[2],
    items: [
      {
        contentId: "c6",
        title: "Comprendre l'inflation",
        kind: "video",
        category: "Vidéos",
        isPremium: true,
      },
      {
        contentId: "c7",
        title: "Le revenu universel en débat",
        kind: "video",
        category: "Vidéos",
        isPremium: true,
      },
    ],
  },
};
