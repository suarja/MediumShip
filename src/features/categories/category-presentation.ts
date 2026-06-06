const PRESENTATION_RULES = [
  { normalizedKey: "analyses", matches: ["analyse", "analysis"], icon: "✎" },
  { normalizedKey: "podcasts", matches: ["podcast", "episode", "audio"], icon: "▷" },
  { normalizedKey: "videos", matches: ["video", "debat", "debate"], icon: "▶" },
  { normalizedKey: "agenda", matches: ["agenda", "event"], icon: "☷" },
  { normalizedKey: "collections", matches: ["collection", "serie", "series"], icon: "◆" },
  { normalizedKey: "community", matches: ["community", "communaute", "discord"], icon: "✦" },
] as const;

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
    icon: rule?.icon ?? "◉",
  };
}
