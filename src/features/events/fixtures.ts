import type { AppEvent } from "./types";

export const FIXTURE_EVENTS: AppEvent[] = [
  {
    _id: "evt-1",
    title: "Assemblée ouverte · Paris",
    summary: "Une soirée de débat ouverte à tous les membres de la communauté.",
    startsAt: "2026-03-24T19:00:00",
    locationLabel: "La Bellevilloise, Paris · 180 inscrits",
    mode: "offline",
    access: "free",
    status: "scheduled",
    ctaLabel: "S'inscrire",
    descriptionLong:
      "Une rencontre mensuelle pour échanger sur les enjeux éditoriaux de la semaine. Ouvert à tous, sans inscription obligatoire.",
  },
  {
    _id: "evt-2",
    title: "Atelier programme 2027",
    summary: "Atelier participatif en visioconférence pour les membres.",
    startsAt: "2026-04-02T20:00:00",
    locationLabel: "En visio · gratuit",
    mode: "online",
    access: "member",
    status: "scheduled",
    ctaLabel: "Rejoindre le call",
    communityUrl: "https://discord.gg/example",
    descriptionLong:
      "Un atelier en ligne réservé aux membres pour travailler collectivement sur les propositions éditoriales autour de 2027.",
  },
  {
    _id: "evt-3",
    title: "Débat live — économie du soin",
    summary: "Débat en direct sur YouTube, ouvert à tous.",
    startsAt: "2026-04-11T21:00:00",
    locationLabel: "YouTube live · ouvert à tous",
    mode: "online",
    access: "free",
    status: "scheduled",
    ctaLabel: "Regarder en direct",
    ctaUrl: "https://youtube.com/watch?v=example",
    descriptionLong:
      "Un grand débat live entre économistes et citoyens autour de la crise du care et des politiques sociales.",
  },
  {
    _id: "evt-4",
    title: "Cercle local · Lyon",
    summary: "Rencontre locale des membres lyonnais au café associatif.",
    startsAt: "2026-04-18T19:30:00",
    locationLabel: "Café associatif, Lyon · 24 inscrits",
    mode: "offline",
    access: "free",
    status: "scheduled",
    descriptionLong:
      "Les membres de Lyon se retrouvent pour échanger autour d'un verre et préparer les prochains événements locaux.",
  },
];
