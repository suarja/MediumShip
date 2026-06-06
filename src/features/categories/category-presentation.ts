import {
  getCategoryIconGlyph,
  type CategoryIconKey,
} from "./category-icon-catalog";

const PRESENTATION_RULES: ReadonlyArray<{
  normalizedKey: CategoryIconKey;
  matches: readonly string[];
}> = [
  { normalizedKey: "analyses", matches: ["analyse", "analysis"] },
  { normalizedKey: "podcasts", matches: ["podcast", "episode", "audio"] },
  { normalizedKey: "videos", matches: ["video", "debat", "debate"] },
  { normalizedKey: "agenda", matches: ["agenda", "event"] },
  { normalizedKey: "collections", matches: ["collection", "serie", "series"] },
  { normalizedKey: "community", matches: ["community", "communaute", "discord"] },
  { normalizedKey: "news", matches: ["actualite", "news"] },
  { normalizedKey: "economy", matches: ["economie", "economy"] },
  { normalizedKey: "culture", matches: ["culture"] },
  { normalizedKey: "library", matches: ["bibliotheque", "library"] },
  { normalizedKey: "debate", matches: ["debat", "debate"] },
  { normalizedKey: "film", matches: ["film", "cinema"] },
  { normalizedKey: "interview", matches: ["entretien", "interview"] },
  { normalizedKey: "education", matches: ["education", "ecole", "school"] },
  { normalizedKey: "politics", matches: ["politique", "politics"] },
  { normalizedKey: "society", matches: ["societe", "society"] },
  { normalizedKey: "science", matches: ["science", "recherche", "research"] },
];

export function normalizeCategoryKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryPresentation(label: string): {
  normalizedKey: string;
  icon: string;
} {
  const normalized = normalizeCategoryKey(label);
  const rule = PRESENTATION_RULES.find((entry) =>
    entry.matches.some((match) => normalized.includes(match)),
  );

  return {
    normalizedKey: rule?.normalizedKey ?? normalized,
    icon: getCategoryIconGlyph(rule?.normalizedKey ?? "default"),
  };
}
