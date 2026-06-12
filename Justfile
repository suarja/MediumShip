# MediumShip — task runner.
#
# `just` is the single, documented entry point for day-to-day commands.
# Run `just` (no args) to list everything. Heavy logic lives in scripts/
# (see scripts/README.md); recipes here stay thin and self-explanatory.

set shell := ["bash", "-uc"]

# Default simulator targets — override here if your installed devices differ.
# (List yours with: xcrun simctl list devices available)
iphone := "iPhone 17 Pro"
ipad   := "iPad Air 13-inch (M3)"

# Show all available commands (default).
default:
    @just --list --unsorted

# ─── Dev server ─────────────────────────────────────────────────────────────

# Start the Expo dev server (Metro). Keep this running in its own tab.
[group('dev')]
start:
    npx expo start

# Start Expo with the cache cleared — use after weird bundling errors.
[group('dev')]
start-clean:
    npx expo start --clear

# ─── iOS simulators ──────────────────────────────────────────────────────────
# `just ios` / `just ipad` expect an already-installed app (Expo Go or dev
# client) and a running `just start`. Use the rebuild recipes below whenever
# native modules, Expo plugins, or simulator app state drift make Metro reloads
# insufficient.

# Open the app on the iPhone simulator.
[group('ios')]
ios:
    IPHONE_NAME="{{iphone}}" IPAD_NAME="{{ipad}}" scripts/ios.sh iphone

# Open the app on the iPad simulator.
[group('ios')]
ipad:
    IPHONE_NAME="{{iphone}}" IPAD_NAME="{{ipad}}" scripts/ios.sh ipad

# Open the app on the iPhone AND iPad at the same time.
[group('ios')]
ios-both:
    IPHONE_NAME="{{iphone}}" IPAD_NAME="{{ipad}}" scripts/ios.sh both

# Rebuild and install the iPhone app binary, then launch it.
[group('ios')]
ios-rebuild:
    npx expo run:ios --device "{{iphone}}"

# Same as `ios-rebuild`, but clears Xcode derived data first.
[group('ios')]
ios-rebuild-clean:
    npx expo run:ios --device "{{iphone}}" --no-build-cache

# Rebuild and install the iPad app binary, then launch it.
[group('ios')]
ipad-rebuild:
    npx expo run:ios --device "{{ipad}}"

# Same as `ipad-rebuild`, but clears Xcode derived data first.
[group('ios')]
ipad-rebuild-clean:
    npx expo run:ios --device "{{ipad}}" --no-build-cache

# Run on Android / web via Expo's own launchers.
[group('ios')]
android:
    npx expo start --android

[group('ios')]
web:
    npx expo start --web

# ─── Convex backend ──────────────────────────────────────────────────────────

# Start the Convex dev backend (codegen + live functions). Own tab.
[group('backend')]
convex:
    npx convex dev

# Seed the demo tenant content into Convex.
[group('backend')]
seed:
    npx convex run tenants/seed:seedDemoContent

# ─── CMS web ─────────────────────────────────────────────────────────────────

# Start the milestone 2 internal CMS in dev mode.
[group('cms')]
cms:
    npm run dev --prefix apps/cms

# Build the CMS production bundle.
[group('cms')]
cms-build:
    npm run build --prefix apps/cms

# Regenerate Convex functions/types once for the CMS + mobile shared backend.
[group('cms')]
cms-convex:
    npx convex dev --once

# ─── Landing web (apps/www) ──────────────────────────────────────────────────

# Start the white-label landing + Knowly demo site in dev mode. Own tab.
[group('www')]
www:
    npm run dev --prefix apps/www

# Build the landing production bundle.
[group('www')]
www-build:
    npm run build --prefix apps/www

# ─── Quality ─────────────────────────────────────────────────────────────────

# Run the Jest test suite.
[group('quality')]
test:
    npm test

# Type-check the project without emitting output.
[group('quality')]
typecheck:
    npx tsc -p tsconfig.json --noEmit

# ─── Troubleshooting ─────────────────────────────────────────────────────────

# Resets Warp's Automation permission so macOS re-prompts (fixes Expo `i` crash).
#
# After running this, fully QUIT Warp (Cmd+Q) and reopen it, then retry.
# Note: `just ios` never needs this permission, so you can skip it entirely.
[group('troubleshoot')]
fix-warp:
    tccutil reset AppleEvents dev.warp.Warp-Stable
    @echo "✓ Reset done. Now Cmd+Q Warp completely and reopen it."

# List installed iOS simulators and their boot state.
[group('troubleshoot')]
sims:
    xcrun simctl list devices available
