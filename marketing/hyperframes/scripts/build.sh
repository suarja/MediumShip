#!/usr/bin/env bash
# Build carousels from their JSON manifests.
#
# Usage:
#   bash scripts/build.sh                # gallery mode — 5 carousels stacked in index.html
#   bash scripts/build.sh <slug>         # single mode — only <slug> in index.html (12.5s, render-ready)
#   bash scripts/build.sh --gallery      # explicit gallery mode (same as no arg)
#
# Always rebuilds .build/<slug>/ + compositions/<slug>.html for ALL carousels
# in carousels/*.json, so HF Studio stays in sync regardless of which mode
# index.html is in.
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "node required (>= 22). Install: brew install node"
  exit 1
fi

if [ ! -d carousels ] || [ -z "$(ls carousels/*.json 2>/dev/null)" ]; then
  echo "No carousels found in carousels/*.json"
  echo ""
  echo "Create one: cp carousels/<existing>.json carousels/<new-slug>.json"
  exit 1
fi

node scripts/build.mjs "$@"
