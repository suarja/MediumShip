#!/usr/bin/env node
// scripts/manifest.mjs
//
// Scans carousels/*.json and produces manifest.json at the project root.
// Consumed by integrator apps (e.g. app-store-generator Marketing tab) that
// need a single read-only index of every carousel: source, render artefacts,
// freshness status.
//
// Usage:
//   node scripts/manifest.mjs        # writes ./manifest.json
//   bun run manifest                 # same, via package.json script
//
// Status semantics:
//   - "draft"    → no mp4 rendered yet
//   - "rendered" → mp4 exists and is newer than the source JSON
//   - "stale"    → source JSON modified after the last render

import { readFileSync, writeFileSync, statSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const CAROUSELS_DIR = join(ROOT, "carousels");
const OUTPUT_DIR = join(ROOT, "output");
const PUBLISHING_DIR = join(ROOT, "publishing");
const PREVIEWS_DIR = join(ROOT, "previews");

function readPublishing(slug) {
  const p = join(PUBLISHING_DIR, `${slug}.json`);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function moduleFromSlug(slug) {
  if (slug.startsWith("mobile-")) return "mobile";
  if (slug.startsWith("web-")) return "web";
  return "cross";
}

function safeStatMtime(path) {
  try {
    return statSync(path).mtime.toISOString();
  } catch {
    return null;
  }
}

function computeStatus(jsonMtime, mp4Mtime) {
  if (!mp4Mtime) return "draft";
  return new Date(jsonMtime) > new Date(mp4Mtime) ? "stale" : "rendered";
}

const slugs = readdirSync(CAROUSELS_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();

const entries = slugs.map((slug) => {
  const jsonRel = `carousels/${slug}.json`;
  const jsonAbs = join(CAROUSELS_DIR, `${slug}.json`);
  const mp4Rel = `output/${slug}/video.mp4`;
  const mp4Abs = join(OUTPUT_DIR, slug, "video.mp4");
  const slidesRel = `output/${slug}/slides`;
  const slidesAbs = join(OUTPUT_DIR, slug, "slides");

  const manifest = JSON.parse(readFileSync(jsonAbs, "utf8"));
  const slides = Array.isArray(manifest.slides) ? manifest.slides : [];
  const totalDurationSec = slides.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

  const jsonMtime = safeStatMtime(jsonAbs);
  const mp4Mtime = safeStatMtime(mp4Abs);

  return {
    slug,
    title: manifest.title ?? null,
    pillar: manifest.pillar ?? null,
    language: manifest.language ?? "fr",
    module: moduleFromSlug(slug),
    template: manifest.template ?? "classic",
    width: manifest.width ?? 1080,
    height: manifest.height ?? 1920,
    slideCount: slides.length,
    totalDurationSec: Number(totalDurationSec.toFixed(2)),
    jsonPath: jsonRel,
    jsonMtime,
    mp4Path: mp4Rel,
    mp4Mtime,
    mp4Exists: existsSync(mp4Abs),
    slidesDir: slidesRel,
    slidesExist: existsSync(slidesAbs),
    status: computeStatus(jsonMtime, mp4Mtime),
    publishing: readPublishing(slug),
  };
});

// ── Previews — each is a self-contained composition (HTML + preview.json) ──
const previewSlugs = existsSync(PREVIEWS_DIR)
  ? readdirSync(PREVIEWS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
  : [];

const previews = previewSlugs.flatMap((slug) => {
  const previewDir = join(PREVIEWS_DIR, slug);
  const configPath = join(previewDir, "preview.json");
  const htmlPath = join(previewDir, "index.html");
  if (!existsSync(configPath) || !existsSync(htmlPath)) return [];

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  const htmlMtime = safeStatMtime(htmlPath);
  const locales = Array.isArray(config.locales) && config.locales.length > 0
    ? config.locales
    : ["fr"];

  // Per-locale render artefacts: <previewDir>/BeViral-AppPreview-<locale>-886x1920.mp4
  const renderPattern = config.render?.outputPattern || `${slug}-{locale}.mp4`;
  const localeRenders = {};
  let earliestMp4Mtime = null;
  let allRendered = true;
  let anyRendered = false;
  for (const loc of locales) {
    const fname = renderPattern.replace("{locale}", loc);
    const mp4Abs = join(previewDir, fname);
    const mtime = safeStatMtime(mp4Abs);
    const exists = existsSync(mp4Abs);
    localeRenders[loc] = {
      mp4Path: `previews/${slug}/${fname}`,
      mp4Mtime: mtime,
      mp4Exists: exists,
    };
    if (exists) {
      anyRendered = true;
      if (!earliestMp4Mtime || new Date(mtime) < new Date(earliestMp4Mtime)) {
        earliestMp4Mtime = mtime;
      }
    } else {
      allRendered = false;
    }
  }

  // Aggregate status for previews — per-locale rendering is partial by
  // design (5 locales × ~3 min each), so we treat "at least one fresh
  // render" as the UI-meaningful "rendered". The detail view shows
  // per-locale progress separately.
  //   draft    → no locale rendered yet
  //   stale    → at least one rendered locale, but HTML is newer than
  //              the OLDEST rendered MP4 (some renders are out of date)
  //   rendered → at least one rendered locale AND HTML is older than
  //              the oldest rendered MP4 (all existing renders are fresh)
  let status;
  if (!anyRendered) status = "draft";
  else if (earliestMp4Mtime && new Date(htmlMtime) > new Date(earliestMp4Mtime))
    status = "stale";
  else status = "rendered";

  return [{
    kind: "preview",
    slug,
    title: config.title ?? slug,
    pillar: config.pillar ?? null,
    language: config.language ?? "fr",
    locales,
    module: config.module ?? "cross",
    template: "preview",
    width: config.width ?? 1080,
    height: config.height ?? 1920,
    slideCount: Array.isArray(config.scenes) ? config.scenes.length : null,
    totalDurationSec: Number((config.durationSec ?? 0).toFixed(2)),
    htmlPath: `previews/${slug}/index.html`,
    htmlMtime,
    localeRenders,
    deliveryDimensions: config.render?.deliveryDimensions ?? null,
    status,
    publishing: readPublishing(slug),
  }];
});

const manifest = {
  generatedAt: new Date().toISOString(),
  root: "marketing/hyperframes",
  carouselCount: entries.length,
  previewCount: previews.length,
  carousels: entries,
  previews,
};

const outPath = join(ROOT, "manifest.json");
writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");

const counts = entries.reduce(
  (acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  },
  { draft: 0, rendered: 0, stale: 0 },
);

const previewCounts = previews.reduce(
  (acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  },
  { draft: 0, rendered: 0, stale: 0 },
);

console.log(`✓ Wrote manifest.json (${entries.length} carousels · ${previews.length} previews)`);
console.log(`  carousels — rendered: ${counts.rendered}   stale: ${counts.stale}   draft: ${counts.draft}`);
console.log(`  previews  — rendered: ${previewCounts.rendered}   stale: ${previewCounts.stale}   draft: ${previewCounts.draft}`);
