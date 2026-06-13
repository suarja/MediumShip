# Knowly — Marketing HyperFrames Design

Brand identity for marketing carousels and vertical video. Aligned with the app
theme tokens in `src/features/theme/palette-catalog.ts` (default palette `brick`)
and `src/features/theme/fonts.ts`.

Knowly's marketing look is **warm editorial** — cream paper, terracotta accent,
serif display. This is the opposite of the dark/neon norm in app-store feeds, and
that contrast is the point: it reads as a premium reading/listening product, not
another social app.

## Palette (from the `brick` app palette)

Light, warm base. The dark `midnight` palette is reserved for in-app UI; marketing
uses the warm light look so the brand reads as editorial.

| Role | Value | Notes |
|---|---|---|
| Background base | `#F5EFE8` | `canvas` — cream paper |
| Surface raised | `#FFFDFC` | `surface` — phone screen, cards |
| Panel warm | `#ECE1D4` | `canvasAccent` |
| Foreground heading | `#2B211D` | `heading` — display serif, near-black warm |
| Foreground body | `#43332B` | `text` |
| Foreground muted | `#7A665C` | `textMuted` — brand mark, meta, footnote |
| Accent (terracotta) | `#B14F2E` | `accent` — eyebrow, italic payoff, CTA, mark |
| Accent soft | `#F2DED3` | `accentSoft` — pill fill |
| Premium (gold) | `#C8964A` | `premium` — secondary halo, cover gradient |
| Border | `rgba(87,56,36,0.10)` | hairlines |

Halos are soft warm radials (terracotta `0.12` / gold `0.16` alpha), never neon.
On a cream base, keep them subtle — they're texture, not glow.

## Typography (from the app `fontFamilies`)

- **Serif display:** Newsreader — hooks, stat numbers, taglines, mock titles. Italic
  for payoff lines and the **Knowly** wordmark.
- **Sans (default):** Hanken Grotesk — captions, body lines, CTA microcopy. Weights 400–800.
- **Mono:** JetBrains Mono — eyebrows/kickers, brand mark, handles, raw labels.

Loaded via Google Fonts in the generated `index.html` (see `scripts/build.mjs`).
Numbers use `font-variant-numeric: tabular-nums` + `font-feature-settings: 'tnum' 1`.

## Layout

- 1080×1920 vertical default.
- Eyebrow upper-third (top ~320px). Hook centered in the upper 60%.
- Brand mark anchored bottom-left, ~100px from edges.
- 100px horizontal padding; 200px+ top/bottom breathing.

## Motion

- Subtle entrance only (`gsap.from`): fade + 30–80px y-translate, 0.4–0.7s,
  `power3.out` / `expo.out` / `power2.out`. Vary eases per scene.
- Halos: scale 0.85 → 1, ~0.8s, `power2.out` from t=0.
- **No exit animations.** Slides cut hard between sub-comps; the parent timeline
  owns transitions for video output.

## Copy rules

### Char-count limits per slot

Sub-comps are absolutely positioned with hardcoded `top:` offsets. A line that wraps
overlaps the next element. These limits keep every line single-line in FR (EN/ES may
need a touch more headroom — render and eyeball before shipping).

| Slide type | Slot | Font / size | Max chars |
|---|---|---|---|
| `slide-hook` | `eyebrow` | Hanken 60px | ~28 |
| `slide-hook` | `hook` | Newsreader 240px | **~14** (≤ 2 short lines) |
| `slide-hook` | `subline` | Newsreader 96px italic | ~22 |
| `slide-stat` | `captionTop` | Hanken 60px | ~28 |
| `slide-stat` | `number` | Newsreader 300px | **~4** ("100%", "10M") |
| `slide-stat` | `unit` | Newsreader 84px italic | ~8 |
| `slide-stat` | `captionBottom` | Hanken 64px | ~30 (wraps OK on 2 lines) |
| `slide-stat` | `subline` | Newsreader 58px italic | ~35 |
| `slide-body` | `eyebrow` | JetBrains Mono 32px caps | ~20 |
| `slide-body` | `line1` / `line2` (italic) / `line3` | Newsreader 140px | **~16 each** |
| `slide-screenshot` | `caption` | Newsreader 96px | ~24 (≤ 2 lines) |
| `slide-screenshot` | `mockTitle` | Newsreader 52px | ~40 |
| `slide-screenshot` | `kpiLabel` | Hanken 24px | ~12 |
| `slide-screenshot` | `kpiValue` | Hanken 32px | ~12 |
| `slide-cta` | `tagline1` | Newsreader 150px (nowrap) | **~11** |
| `slide-cta` | `tagline2` | Newsreader 110px italic (nowrap) | ~16 |
| `slide-cta` | `cta` | Hanken 44px | ~22 |
| `slide-cta` | `handle` | JetBrains Mono 44px | ~26 |
| `slide-cta` | `footnote` | Hanken 28px | ~48 |

If a line must exceed the limit, change the layout (size, position, `max-width`) —
don't ship with overlap. `slide-cta` taglines use `white-space: nowrap` so they never
silently wrap; shrink the copy or the font instead.

### Reading-time rule (per-slide duration)

```
chars = sum(len(slot) for slot in slide text slots)
formula = entrance + max(1.5s, chars / 22) + 0.4s breathing
duration = max(template_floor, formula)
```

22 chars/sec = eyes-on feed-scroll speed.

| Template | Floor | Ceiling |
|---|---|---|
| `slide-hook` | 3.5s | 4.0s |
| `slide-stat` | 5.0s | 6.0s |
| `slide-body` | 3.5s | 4.0s |
| `slide-screenshot` | 4.0s | 4.5s |
| `slide-cta` | 3.0s | 3.5s |

Target total: **18–22s**. `render.sh` reads durations from the manifest (jq) and
`build.mjs` stretches each slide's no-op GSAP tween to match — otherwise HF renders
black frames between timeline end and slide end.

## What NOT to do

- No literal hex outside these components — pull from the table above (mirrors the app
  palette tokens). If a new color is needed, add it to the app `brick` palette first.
- No emojis / icons inside hook or tagline text.
- No all-caps body lines (only the mono eyebrow + CTA microcopy).
- No drop shadows on text — rely on contrast against the cream base.
- No serif for captions/body — Hanken drives the sans layer; Newsreader is display only.
- No screen recording without the phone frame (depth marker).
- No copy past the per-slot char limits — absolute positioning means wraps break layout.
