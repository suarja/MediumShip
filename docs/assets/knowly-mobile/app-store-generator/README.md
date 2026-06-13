# Knowly — App Store screenshot generator

Next.js app that renders Knowly's App Store screenshots as **advertisements** (brand
background + headline + phone bezel holding a real capture) and exports them via
`html-to-image` at Apple's four required iPhone resolutions.

Adapted from the Editia `be-viral-mobile/app-store-generator`, re-skinned to the
Knowly warm-editorial brand and trimmed to the Screenshots surface (the Be Viral
Studio / Marketing / ASO tabs are not ported yet — see Roadmap).

## Quick start

```bash
cd docs/assets/knowly-mobile/app-store-generator
bun install
bun run dev          # http://localhost:3001
```

## What it does

- **5 slides** in App Store order: `home · article · episode · video · premium`
  (copy in `src/app/_data/copy.ts`, FR + EN).
- **4 Apple sizes**: 6.9" (1320×2868) · 6.5" · 6.3" · 6.1". The canvas renders at
  6.9" and re-rasterises to each size at export time.
- **Exports**:
  - per-slide PNG (hover a card → **PNG**)
  - **Export current → ZIP** — the 5 slides for the active locale + size
  - **Export all → ZIP** — every locale × size × slide, foldered as
    `iphone-<size>/<locale>/NN-<id>.png` (mirrors App Store Connect's upload flow)
- **Grid / Focus** preview modes; locale + size switchers.

## Screens inside the bezel

Each slide pulls its in-phone capture from:

```
public/screenshots/<mockupLocale>/<id>.png      e.g. public/screenshots/fr/home.png
```

`MOCKUP_LOCALE_FOR` (in `copy.ts`) maps each UI locale to a capture language — FR
everywhere for the first pass (Apple accepts non-localized screenshot content).

**Until a real capture exists**, the slide falls back to an editorial `ScreenMock`
rendered in HTML, so the generator is presentable from the first run. Drop a PNG at
the path above and it overrides the mock automatically — no code change.

Capture real Knowly screens with the Expo-web + headless-Chrome protocol in
`docs/agents/ui-visual-testing.md`. Recommended portrait captures (status bar visible):
home feed, article detail, episode/audio player, video detail, premium screen.

## Brand

Warm editorial, mirrors the app `brick` palette (`src/features/theme/palette-catalog.ts`):
cream `#F5EFE8`, terracotta `#B14F2E`, gold `#C8964A`, Newsreader + Hanken Grotesk +
JetBrains Mono. The `video` and `premium` slides use a dark espresso variant for contrast.

## Conventions

- Headline markup in `copy.ts`: `\n` = line break, `*word*` = terracotta italic accent.
- Edit copy only in `copy.ts`. Slide layout (`bottom` / `right` / `left`) and the
  light/dark flag live in `SLIDE_LAYOUT` / `SLIDE_DARK` next to it.
- `mockup.png` is the shared iPhone bezel; the screen window is pre-measured (`SC_*`
  in `page.tsx`). Swap the bezel only if you re-measure the window.

## Apple delivery

| Asset | How |
|---|---|
| 5 screenshots × locale × size | **Export current → ZIP** → drop the folder into App Store Connect (one device tab, one locale) |
| Full bundle (all locales × sizes) | **Export all → ZIP** → `iphone-<size>/<locale>/…` matches App Store Connect's device→locale flow |
| Single PNG | hover a grid card → **PNG** |

## Roadmap

- [ ] Wire real Knowly captures into `public/screenshots/fr/`
- [ ] iPad screenshots (universal app — `supportsTablet: true`)
- [ ] ASO listing editor (name/subtitle/description/keywords) — Be Viral "Brief" tab parity
- [ ] App Preview video slot (consume `marketing/hyperframes` renders)
