#!/usr/bin/env bash
#
# ios.sh — Boot one or more iOS simulators and open the running Expo dev
#          server on each of them.
#
# Why this exists:
#   `expo start` + pressing `i` shells out to AppleScript ("tell app System
#   Events to count processes…") to find the Simulator. Some terminals (Warp)
#   never get the macOS Automation permission for that, so `i` crashes with
#   exit code 1 / error -1743. This script never touches System Events: it
#   drives the simulators directly with `xcrun simctl`, so it works from any
#   terminal — and it can launch several devices at once, which `i` cannot.
#
# Usage:
#   scripts/ios.sh <target>
#     target = iphone | ipad | both   (default: iphone)
#
# Environment overrides (all optional):
#   IPHONE_NAME   simulator name for the iPhone   (default below)
#   IPAD_NAME     simulator name for the iPad     (default below)
#   EXPO_HOST     LAN host for the exp:// URL      (default: auto / en0)
#   EXPO_PORT     dev-server port                  (default: auto-detected)
#
# Requires: a running `expo start` in another tab (just start / npm start).

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

IPHONE_NAME="${IPHONE_NAME:-iPhone 17 Pro}"
IPAD_NAME="${IPAD_NAME:-iPad Air 13-inch (M3)}"

# --- helpers ----------------------------------------------------------------

# Resolve a simulator UDID from its exact display name. The trailing " (" in
# the match keeps "iPhone 17 Pro" from also matching "iPhone 17 Pro Max".
resolve_udid() {
  local name="$1" udid
  udid=$(xcrun simctl list devices available \
    | grep -F "$name (" | head -1 \
    | grep -oE '[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}' || true)
  if [[ -z "$udid" ]]; then
    echo "✗ No available simulator named \"$name\"." >&2
    echo "  See installed devices with:  xcrun simctl list devices available" >&2
    return 1
  fi
  printf '%s' "$udid"
}

# Find the LAN IP the simulator should reach Metro on.
detect_host() {
  if [[ -n "${EXPO_HOST:-}" ]]; then printf '%s' "$EXPO_HOST"; return; fi
  ipconfig getifaddr en0 2>/dev/null \
    || ipconfig getifaddr en1 2>/dev/null \
    || echo 127.0.0.1
}

# Major SDK version of this project (e.g. 56), used to pick a matching Expo Go.
sdk_major() {
  node -e "console.log((require('$REPO/package.json').dependencies.expo||'').replace(/[^0-9.]/g,'').split('.')[0]||'')" 2>/dev/null
}

# Ensure Expo Go is installed on a device, else `openurl exp://` fails with
# LSApplicationWorkspace error 115. We install from Expo's local simulator
# cache (populated the first time Expo downloads Expo Go for this SDK).
ensure_expo_go() {
  local udid="$1"
  if xcrun simctl listapps "$udid" 2>/dev/null | grep -q "host.exp.Exponent"; then
    return 0
  fi
  local major app
  major="$(sdk_major)"
  app=$(ls -dt "$HOME/.expo/ios-simulator-app-cache/Expo-Go-${major}"*.tar.app 2>/dev/null | head -1 || true)
  if [[ -z "$app" ]]; then
    echo "✗ Expo Go (SDK ${major}) isn't installed on this device and isn't cached." >&2
    echo "  Install it once: open the app via Expo's \`i\` from a terminal that has" >&2
    echo "  Automation permission (e.g. Ghostty), then re-run this command." >&2
    return 1
  fi
  echo "→ Installing Expo Go (${app##*/}) on ${udid}"
  xcrun simctl install "$udid" "$app"
}

# Find the port a running Expo dev server is listening on. Expo answers
# "packager-status:running" on GET /status; we probe the usual ports.
detect_port() {
  if [[ -n "${EXPO_PORT:-}" ]]; then printf '%s' "$EXPO_PORT"; return; fi
  local p
  for p in 8081 8082 8083 8084; do
    if curl -fsS "http://127.0.0.1:${p}/status" 2>/dev/null \
        | grep -q "packager-status:running"; then
      printf '%s' "$p"; return
    fi
  done
  echo "✗ No running Expo dev server found on ports 8081-8084." >&2
  echo "  Start it first in another tab:  just start" >&2
  return 1
}

# --- resolve target ---------------------------------------------------------

target="${1:-iphone}"
declare -a wanted
case "$target" in
  iphone) wanted=("$IPHONE_NAME") ;;
  ipad)   wanted=("$IPAD_NAME") ;;
  both)   wanted=("$IPHONE_NAME" "$IPAD_NAME") ;;
  *) echo "✗ Unknown target \"$target\" (use: iphone | ipad | both)" >&2; exit 2 ;;
esac

host="$(detect_host)"
port="$(detect_port)"
url="exp://${host}:${port}"
echo "→ Expo dev server: ${url}"

# --- boot, then open each device --------------------------------------------

declare -a udids
for name in "${wanted[@]}"; do
  udid="$(resolve_udid "$name")"
  udids+=("$udid")
  echo "→ Booting ${name} (${udid})"
  # `boot` errors if the device is already booted — that's fine.
  xcrun simctl boot "$udid" 2>/dev/null || true
done

# Bring the Simulator UI forward (shows every booted device side by side).
open -a Simulator

for i in "${!udids[@]}"; do
  udid="${udids[$i]}"
  name="${wanted[$i]}"
  echo "→ Waiting for ${name} to finish booting…"
  xcrun simctl bootstatus "$udid" >/dev/null 2>&1 || true
  ensure_expo_go "$udid"
  echo "→ Opening ${url} on ${name}"
  xcrun simctl openurl "$udid" "$url"
done

echo "✓ Done. If a device shows nothing, make sure Expo Go (or your dev"
echo "  client) is installed on it, then re-run this command."
