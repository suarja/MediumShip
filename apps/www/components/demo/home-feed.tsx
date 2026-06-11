"use client";

import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { env } from "../../lib/env";
import { Phone, StatusBar } from "./phone";

type FeedItem = {
  cat: string;
  title: string;
  detail: string;
  variant: "" | "alt" | "alt2";
};

type Hero = {
  label: string;
  title: string;
  meta: string;
};

// Static fallback mirrors the maquette so the screen looks right before the
// Convex query resolves (and in the rare case the demo tenant has no content).
const FALLBACK_HERO: Hero = {
  label: "◉ Épisode du jour",
  title: "La fin de l'économie d'attention.",
  meta: "42 MIN · S04E11",
};

const FALLBACK_ITEMS: FeedItem[] = [
  {
    cat: "Long format",
    title: "Bâtir une audience qui paie",
    detail: "18 min de lecture",
    variant: "",
  },
  {
    cat: "Podcast · S04",
    title: "Les nouveaux médias propriétaires",
    detail: "52 min · Hier",
    variant: "alt",
  },
  {
    cat: "Vidéo · Premium",
    title: "Masterclass : la fidélisation",
    detail: "1 h 04 · Réservé membres",
    variant: "alt2",
  },
];

const KIND_LABEL: Record<Doc<"contents">["kind"], string> = {
  article: "Long format",
  episode: "Podcast",
  video: "Vidéo",
};

function formatDuration(seconds: number | undefined): string | null {
  if (!seconds) return null;
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} h ${minutes.toString().padStart(2, "0")}`;
}

function itemDetail(content: Doc<"contents">): string {
  const parts: string[] = [];
  if (content.kind === "article" && content.readingTimeMinutes) {
    parts.push(`${content.readingTimeMinutes} min de lecture`);
  } else {
    const dur = formatDuration(content.durationSeconds);
    if (dur) parts.push(dur);
  }
  if (content.isPremium) parts.push("Réservé membres");
  return parts.join(" · ") || "À découvrir";
}

function categoryLabel(content: Doc<"contents">): string {
  const base = content.category || KIND_LABEL[content.kind];
  return content.isPremium ? `${base} · Premium` : base;
}

function toHero(content: Doc<"contents">): Hero {
  const meta =
    content.kind === "article"
      ? `${content.readingTimeMinutes ?? 0} MIN DE LECTURE`
      : (formatDuration(content.durationSeconds)?.toUpperCase() ?? "À LA UNE");
  return {
    label: `◉ ${content.kind === "episode" ? "Épisode du jour" : "À la une"}`,
    title: content.title,
    meta,
  };
}

function buildFeed(contents: Doc<"contents">[] | undefined): {
  hero: Hero;
  items: FeedItem[];
} {
  if (!contents || contents.length === 0) {
    return { hero: FALLBACK_HERO, items: FALLBACK_ITEMS };
  }

  // Prefer an episode as the hero (matches the maquette's "épisode du jour").
  const heroSource =
    contents.find((c) => c.kind === "episode") ?? contents[0];
  const rest = contents.filter((c) => c._id !== heroSource._id).slice(0, 3);
  const variants: FeedItem["variant"][] = ["", "alt", "alt2"];

  const items: FeedItem[] =
    rest.length > 0
      ? rest.map((content, index) => ({
          cat: categoryLabel(content),
          title: content.title,
          detail: itemDetail(content),
          variant: variants[index] ?? "",
        }))
      : FALLBACK_ITEMS;

  return { hero: toHero(heroSource), items };
}

export function HomeFeed({ large = false }: { large?: boolean }) {
  const contents = useQuery(api.content.queries.listPublishedFeed, {
    tenantSlug: env.demoTenantSlug,
  });
  const { hero, items } = buildFeed(contents);

  return (
    <Phone large={large} label="Home feed">
      <StatusBar />
      <div className="app-content">
        <div className="feed">
          <div className="feed__hdr">
            <div className="logo">
              Mediumship<span className="d">.</span>
            </div>
            <div className="av" />
          </div>
          <div className="feed__tabs">
            <span className="on">À la une</span>
            <span>Écouter</span>
            <span>Lire</span>
            <span>Premium</span>
          </div>
          <div className="feed__hero">
            <div className="label">{hero.label}</div>
            <div className="t">{hero.title}</div>
            <div className="m">
              <span className="play">▶</span>
              <span>{hero.meta}</span>
            </div>
          </div>
          <div className="feed__list">
            {items.map((item, index) => (
              <div
                className={`feed__item ${item.variant}`.trim()}
                key={`${item.title}-${index}`}
              >
                <div className="ph" />
                <div className="meta">
                  <span className="cat">{item.cat}</span>
                  <span className="t">{item.title}</span>
                  <span className="d">{item.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Phone>
  );
}
