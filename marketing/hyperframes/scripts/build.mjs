#!/usr/bin/env node
// scripts/build.mjs [<slug>] [--gallery]
//
// Reads carousels/<slug>.json (the canonical copy manifest) and generates:
//   1. Patched component copies in .build/<slug>/<type>.html — JS `||` defaults
//      replaced with the per-slide `vars` from the manifest, AND the comp-id
//      rewritten to `<type>-<slug>` so multiple carousels can coexist in the
//      same Studio session without timeline collisions.
//      Workaround for HyperFrames per-instance `data-variable-values` not
//      flowing into sub-comps (see docs/AGENT_HANDOFF.md bug #10).
//   2. index.html at the project root:
//      - With <slug> arg: single-carousel mode (5 sub-comps, 12.5s timeline,
//        render-ready).
//      - With no arg (or --gallery): gallery mode — all carousels' slides
//        flattened into a single root composition (25 sub-comps, ~62.5s).
//        Each carousel block plays at its own offset for Studio scrubbing.
//
// Sub-comp paths are always RELATIVE to index.html (`.build/<slug>/<type>.html`)
// because Studio's iframe baseURI is the index.html URL — nested composition
// files in subdirectories break URL resolution.
//
// Multi-instance same-type within a carousel: NOT supported yet.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const isGallery = args.includes("--gallery") || args.length === 0;
const requestedSlug = args.find((a) => !a.startsWith("--")) || null;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);

const carouselsDir = join(ROOT, "carousels");
const allSlugs = readdirSync(carouselsDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();

if (allSlugs.length === 0) {
  console.error("✗ No carousels found in carousels/*.json");
  process.exit(1);
}

if (requestedSlug && !allSlugs.includes(requestedSlug)) {
  console.error(`✗ Not found: carousels/${requestedSlug}.json`);
  console.error(`  Available carousels: ${allSlugs.join(", ")}`);
  process.exit(1);
}

const DEFAULT_CROP_Y = {
  "slide-hook": 420,
  "slide-stat": 600,
  "slide-body": 620,
  "slide-screenshot": 380,
  "slide-cta": 500,
};

function patchComponent({ srcText, slideType, slug, vars, slideDuration }) {
  let patched = srcText;
  const uniqueCompId = `${slideType}-${slug}`;

  // 1. Substitute JS `vars.X || "OLD"` → `vars.X || "NEW"` for each var.
  for (const [varKey, varValue] of Object.entries(vars ?? {})) {
    const escaped = String(varValue)
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
    const re = new RegExp(`(vars\\.${varKey}\\s*\\|\\|\\s*)"[^"]*"`, "g");
    let matches = 0;
    patched = patched.replace(re, (_m, g1) => {
      matches++;
      return `${g1}"${escaped}"`;
    });
    if (matches === 0) {
      console.warn(
        `  ⚠ [${slug}] var "${varKey}" declared in manifest but no \`vars.${varKey} || "…"\` ` +
          `pattern found in components/${slideType}.html`,
      );
    }
  }

  // 2. Rewrite comp-id in HTML attribute, CSS selectors, and template id so
  //    each carousel's slide instances are uniquely addressable.
  patched = patched.replace(
    new RegExp(`(composition-id=)"${slideType}"`, "g"),
    `$1"${uniqueCompId}"`,
  );
  patched = patched.replace(
    new RegExp(`(id=)"${slideType}-template"`, "g"),
    `$1"${uniqueCompId}-template"`,
  );
  patched = patched.replace(
    new RegExp(`\\[data-composition-id="${slideType}"\\]`, "g"),
    `[data-composition-id="${uniqueCompId}"]`,
  );

  // 3. Stretch the no-op tween at the end of the GSAP timeline so it covers
  //    the full slide duration. HF bug #4 : when timeline length < data-duration,
  //    HF renders BLACK frames between timeline end and slide end. Components
  //    encode the no-op as `tl.to({}, { duration: X }, Y);` where Y = end of
  //    last entrance and X = hold time. New duration = slideDuration - Y.
  const noopRe = /(tl\.to\(\{\},\s*\{\s*duration:\s*)([0-9.]+)(\s*\}\s*,\s*)([0-9.]+)(\s*\)\s*;)/;
  const noopMatch = patched.match(noopRe);
  if (noopMatch) {
    const start = parseFloat(noopMatch[4]);
    const newDuration = Math.max(0.1, slideDuration - start - 0.05);
    patched = patched.replace(
      noopRe,
      (_m, p1, _oldDur, p3, p4, p5) => `${p1}${newDuration.toFixed(2)}${p3}${p4}${p5}`,
    );
  } else {
    console.warn(
      `  ⚠ [${slug}] no \`tl.to({}, { duration: X }, Y)\` no-op tween in ${slideType}.html — ` +
        `slide may show BLACK frames if data-duration > timeline length`,
    );
  }

  return { patched, uniqueCompId };
}

const ALLOWED_TEMPLATES = new Set(["classic", "magazine"]);

function buildOneCarousel(slug) {
  const manifest = JSON.parse(readFileSync(join(carouselsDir, `${slug}.json`), "utf-8"));
  const W = manifest.width ?? 1080;
  const H = manifest.height ?? 1920;
  const lang = manifest.language ?? "fr";
  const template = manifest.template ?? "classic";
  const totalDuration = manifest.slides.reduce((acc, s) => acc + s.duration, 0);

  if (!ALLOWED_TEMPLATES.has(template)) {
    console.error(
      `✗ [${slug}] Unknown template "${template}". Allowed: ${[...ALLOWED_TEMPLATES].join(", ")}`,
    );
    process.exit(1);
  }
  const templateDir = join(ROOT, "components", template);
  if (!existsSync(templateDir)) {
    console.error(`✗ [${slug}] Template directory not found: components/${template}/`);
    process.exit(1);
  }

  const buildDir = join(ROOT, ".build", slug);
  rmSync(buildDir, { recursive: true, force: true });
  mkdirSync(buildDir, { recursive: true });

  const seenTypes = new Set();
  const slides = []; // {id, type, uniqueCompId, duration, srcRel}
  for (const slide of manifest.slides) {
    if (seenTypes.has(slide.type)) {
      console.error(
        `✗ [${slug}] Multi-instance same type not supported yet: "${slide.type}" used twice.`,
      );
      process.exit(1);
    }
    seenTypes.add(slide.type);

    const compPath = join(templateDir, `${slide.type}.html`);
    if (!existsSync(compPath)) {
      console.error(
        `✗ [${slug}] Component not found: components/${template}/${slide.type}.html`,
      );
      process.exit(1);
    }

    const { patched, uniqueCompId } = patchComponent({
      srcText: readFileSync(compPath, "utf-8"),
      slideType: slide.type,
      slug,
      vars: slide.vars,
      slideDuration: slide.duration,
    });
    writeFileSync(join(buildDir, `${slide.type}.html`), patched);

    slides.push({
      id: slide.id,
      type: slide.type,
      uniqueCompId,
      duration: slide.duration,
      srcRel: `.build/${slug}/${slide.type}.html`,
    });
  }

  // Sidecar for render.sh --square: per-slide crop Y offsets.
  const cropYs = manifest.slides.map(
    (slide) => slide.squareCropY ?? DEFAULT_CROP_Y[slide.type] ?? 420,
  );
  writeFileSync(join(buildDir, "square-crops.txt"), cropYs.join("\n") + "\n");

  return { slug, manifest, W, H, lang, template, totalDuration, slides };
}

const built = allSlugs.map(buildOneCarousel);

// ── Generate index.html ──────────────────────────────────────────────────
let indexBodyInner;
let indexTotalDuration;
let indexW, indexH, indexLang;
let activeLabel;

function renderSlideHost(slide, startSeconds, W, H) {
  return `      <div
        id="${slide.id}"
        data-composition-id="${slide.uniqueCompId}"
        data-composition-src="${slide.srcRel}"
        data-start="${startSeconds}"
        data-duration="${slide.duration}"
        data-track-index="0"
        data-width="${W}"
        data-height="${H}"
      ></div>`;
}

if (!isGallery) {
  // SINGLE mode — 5 sub-comp hosts for one carousel only (12.5s, render-ready).
  const b = built.find((x) => x.slug === requestedSlug);
  indexW = b.W;
  indexH = b.H;
  indexLang = b.lang;
  indexTotalDuration = b.totalDuration;
  activeLabel = `Active carousel: ${requestedSlug}`;
  let cumulative = 0;
  indexBodyInner = b.slides
    .map((slide) => {
      const html = renderSlideHost(slide, cumulative, b.W, b.H);
      cumulative += slide.duration;
      return html;
    })
    .join("\n\n");
} else {
  // GALLERY mode — flatten all carousels' slides into one root composition,
  // sequentially. 5 carousels × 5 slides = 25 hosts, each unique comp-id.
  // Studio scrubs the root timeline to navigate between carousels.
  indexW = built[0].W;
  indexH = built[0].H;
  indexLang = built[0].lang;
  indexTotalDuration = built.reduce((acc, b) => acc + b.totalDuration, 0);
  activeLabel = `Gallery — ${built.length} carousels, ${indexTotalDuration}s total`;

  const blocks = [];
  let cumulative = 0;
  for (const b of built) {
    blocks.push(`      <!-- Carousel: ${b.slug} (${b.manifest.title ?? b.slug}) — t=${cumulative}..${cumulative + b.totalDuration}s -->`);
    for (const slide of b.slides) {
      blocks.push(renderSlideHost(slide, cumulative, b.W, b.H));
      cumulative += slide.duration;
    }
    blocks.push(""); // blank line between carousels
  }
  indexBodyInner = blocks.join("\n");
}

const indexHtml = `<!doctype html>
<!-- ${activeLabel}
     Generated by scripts/build.mjs.
     Re-run \`bash scripts/build.sh\` (no arg) for gallery, or \`bash scripts/build.sh <slug>\` for single. -->
<html lang="${indexLang}">
  <head>
    <meta charset="utf-8" />
    <title>Knowly — ${requestedSlug ?? "Gallery"}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500;1,6..72,600&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
    />
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        background: #f5efe8;
      }
    </style>
  </head>
  <body>
    <div data-composition-id="root" data-width="${indexW}" data-height="${indexH}" data-start="0" data-duration="${indexTotalDuration}">
${indexBodyInner}
    </div>

    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["root"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;

writeFileSync(join(ROOT, "index.html"), indexHtml);

// Cleanup the deprecated compositions/ dir if present (legacy from earlier
// design that nested compositions through subdirs — broke Studio iframe
// URL resolution).
const legacyCompsDir = join(ROOT, "compositions");
if (existsSync(legacyCompsDir)) {
  rmSync(legacyCompsDir, { recursive: true, force: true });
}

console.log(`✓ Built ${built.length} carousel(s) → .build/`);
for (const b of built) {
  console.log(`    - ${b.slug}  (${b.totalDuration}s · ${b.W}×${b.H} · template=${b.template})`);
}
if (!isGallery) {
  console.log(`✓ index.html → single carousel "${requestedSlug}" (${indexTotalDuration}s)`);
  console.log(`  Run: bash scripts/render.sh ${requestedSlug}`);
} else {
  console.log(`✓ index.html → gallery (${built.length} carousels stacked, ${indexTotalDuration}s)`);
  console.log(`  Open: just hf-studio  (or: npx hyperframes preview --port 3002)`);
}
