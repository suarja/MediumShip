#!/usr/bin/env bash
# Build (if needed) + render the active carousel: produces
# output/<slug>/video.mp4 + slides/01..05.png.
#
# Usage:
#   bash scripts/render.sh                          # uses the slug from index.html's "Active carousel:" comment
#   bash scripts/render.sh liberte-algo-1           # explicit slug — also rebuilds from carousels/<slug>.json
#   bash scripts/render.sh liberte-algo-1 --square  # also produces a 1080×1080 IG-feed crop variant
set -euo pipefail

SLUG=""
SQUARE=0
for arg in "$@"; do
  case "$arg" in
    --square) SQUARE=1 ;;
    --*) echo "unknown flag: $arg"; exit 1 ;;
    *) [ -z "$SLUG" ] && SLUG="$arg" ;;
  esac
done

if [ -z "$SLUG" ]; then
  SLUG=$(grep -m1 'Active carousel:' index.html 2>/dev/null \
    | sed -E 's|.*Active carousel: *([^[:space:]-][^[:space:]]*).*|\1|' \
    | tr -d '[:space:]')
fi
SLUG="${SLUG:-untitled}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg required. Install: brew install ffmpeg"
  exit 1
fi

# Always rebuild when an explicit slug is provided so copy edits in
# carousels/<slug>.json land in .build/ before render.
if [ -f "carousels/${SLUG}.json" ]; then
  echo "→ Building carousel ${SLUG}"
  bash scripts/build.sh "$SLUG"
fi

OUT_DIR="output/${SLUG}"
mkdir -p "${OUT_DIR}/slides"

VIDEO="${OUT_DIR}/video.mp4"
echo "→ Rendering composition to ${VIDEO}"
npx hyperframes render --output "${VIDEO}"

# Extract a frame from each slide's hold (≈ slide_start + entrance_time + 0.5s breathing).
# With variable per-slide durations (cf design.md § Reading-time rule), we read durations
# from carousels/<slug>.json and capture at slide_start + min(2.0, duration - 0.4) seconds.
# Fallback to uniform 2.5s flat layout if no manifest.
echo "→ Extracting carousel frames"
MANIFEST="carousels/${SLUG}.json"
if [ -f "$MANIFEST" ] && command -v jq >/dev/null 2>&1; then
  DURATIONS=($(jq -r '.slides[].duration' "$MANIFEST"))
else
  DURATIONS=(2.5 2.5 2.5 2.5 2.5)
fi
START=0
for i in 1 2 3 4 5; do
  D="${DURATIONS[$((i-1))]:-2.5}"
  # Capture at start + min(2.0, D - 0.4) — entrance done, hold breathing, no bleed into next.
  OFFSET=$(awk "BEGIN { o = ${D} - 0.4; if (o > 2.0) o = 2.0; if (o < 0.5) o = 0.5; printf \"%.2f\", o }")
  TS=$(awk "BEGIN { printf \"%.2f\", ${START} + ${OFFSET} }")
  N=$(printf "%02d" "$i")
  ffmpeg -y -loglevel error -ss "${TS}" -i "${VIDEO}" \
    -vframes 1 -q:v 2 "${OUT_DIR}/slides/${N}.png"
  echo "   slides/${N}.png  (t=${TS}s, slide=${D}s)"
  START=$(awk "BEGIN { printf \"%.2f\", ${START} + ${D} }")
done

if [ "$SQUARE" = "1" ]; then
  echo "→ Generating 1080×1080 square variant (IG feed)"

  # Per-slide crop Y from the build sidecar (set in build.mjs from manifest).
  # PNG slides use their own per-slide crop for best quality. The video uses
  # a uniform crop (slide-hook default) since per-time crops would need a
  # complex ffmpeg filter — defer until square video is a real shipping format.
  CROPS_FILE=".build/${SLUG}/square-crops.txt"
  CROP_YS=()
  if [ ! -f "$CROPS_FILE" ]; then
    echo "   ⚠ no per-slide crops sidecar — using uniform y=420"
    CROP_YS=(420 420 420 420 420)
  else
    while IFS= read -r line; do
      CROP_YS+=("$line")
    done < "$CROPS_FILE"
  fi
  VIDEO_CROP_Y="${CROP_YS[0]:-420}"

  VIDEO_SQUARE="${OUT_DIR}/video-square.mp4"
  ffmpeg -y -loglevel error -i "${VIDEO}" \
    -vf "crop=1080:1080:0:${VIDEO_CROP_Y}" -an -movflags +faststart "${VIDEO_SQUARE}"
  echo "   ${VIDEO_SQUARE}  (uniform crop y=${VIDEO_CROP_Y})"

  mkdir -p "${OUT_DIR}/slides-square"
  START=0
  for i in 1 2 3 4 5; do
    D="${DURATIONS[$((i-1))]:-2.5}"
    OFFSET=$(awk "BEGIN { o = ${D} - 0.4; if (o > 2.0) o = 2.0; if (o < 0.5) o = 0.5; printf \"%.2f\", o }")
    TS=$(awk "BEGIN { printf \"%.2f\", ${START} + ${OFFSET} }")
    N=$(printf "%02d" "$i")
    CROP_Y="${CROP_YS[$((i-1))]:-420}"
    ffmpeg -y -loglevel error -ss "${TS}" -i "${VIDEO}" \
      -vf "crop=1080:1080:0:${CROP_Y}" -vframes 1 -q:v 2 "${OUT_DIR}/slides-square/${N}.png"
    echo "   slides-square/${N}.png  (t=${TS}s, crop y=${CROP_Y})"
    START=$(awk "BEGIN { printf \"%.2f\", ${START} + ${D} }")
  done
fi

echo ""
echo "✓ Done"
echo "   Video:   ${VIDEO}"
echo "   Slides:  ${OUT_DIR}/slides/01..05.png"
if [ "$SQUARE" = "1" ]; then
  echo "   Square:  ${OUT_DIR}/video-square.mp4 + slides-square/01..05.png"
fi
echo "   Post:    upload slides/*.png as a TikTok carousel"
