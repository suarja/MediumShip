# UI visual testing protocol (Expo web + headless Chrome)

How to visually smoke-test a mobile UI change in this repo without a device or
simulator. Used to verify Slice 2.5 (tab bar + profile). Unit tests + `tsc`
prove logic and wiring; this protocol proves the **pixels** — layout, spacing,
overflow, centering, icon sizing, responsive scaling on phone vs iPad.

This is a complement to, not a replacement for, the test suite. Always run
`npm test` / `npx tsc --noEmit` first; only then do the visual pass.

## 1. Start the Expo web server (background, dedicated port, logged)

The dev may already have servers running — always pick a fresh port and write
the log to a file so you can poll readiness.

```bash
CI=1 EXPO_OFFLINE=1 npx expo start --web --port 8095 > /tmp/expo-web-8095.log 2>&1 &
```

- `CI=1` disables watch/reload (deterministic, no interactive prompts).
- `EXPO_OFFLINE=1` skips network calls to Expo services.
- Run it with `run_in_background: true` (the Bash tool) so it survives across turns.

## 2. Wait for readiness, then confirm it actually serves

```bash
# Poll the log until the server announces itself
grep -qiE "Waiting on http://localhost:8095" /tmp/expo-web-8095.log

# Confirm the port is listening and the shell HTML responds
lsof -nP -iTCP:8095 -sTCP:LISTEN
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8095   # expect 200
```

## 3. (Optional but recommended) Force-compile the JS bundle

A `200` on `/` is only the HTML shell. To catch import/resolve/runtime errors
across the whole app, compile the real bundle. This is an **Expo Router** app,
so the entry is `expo-router/entry`, NOT `./index` — grab the real URL from the
served HTML rather than guessing:

```bash
curl -s http://localhost:8095 | grep -oE '/[^"]*\.bundle[^"]*' | head -1
# then GET that URL; a healthy build logs e.g. "Web Bundled … (NNNN modules)"
# and returns a multi-MB JS payload with no "UnableToResolveError".
```

## 4. Screenshot routes with headless Chrome (no extra deps)

No Playwright/Puppeteer is installed, but Chrome is. Its single-shot
`--screenshot` mode is enough. Expo Router serves routes by path, so screenshot
`/home`, `/library`, `/profile`, `/explore`, etc. directly.

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Phone (390×844) and iPad (834×1112) widths
for route in home library profile explore; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --virtual-time-budget=9000 --window-size=390,844 \
    --screenshot="/tmp/shot-$route.png" "http://localhost:8095/$route" >/dev/null 2>&1
done
```

- `--headless=new` is required (old headless mis-renders RN-web).
- `--virtual-time-budget=9000` gives the bundle time to hydrate and paint
  (RN-web is not painted at DOM `load`; too small a budget yields a blank frame).
- Then **Read** each PNG to inspect it.

## 5. What this protocol can and cannot reach

Verify on **every** changed surface across phone **and** iPad widths:
single-line labels, no horizontal overflow, centered elements, icon/glyph
sizing, responsive scaling, and content cap/centering on tablet.

Cannot be driven by single-shot headless Chrome (no interaction):

- **Authenticated states** — Clerk sign-in is an interactive email-code/OAuth
  flow. Signed-in screens (e.g. the full member profile, the library search
  loupe that only renders when signed in) must be covered by unit tests and a
  manual pass with the test account.
- **Palette switching (incl. `midnight`)** — lives behind Settings and persists
  via storage that does not carry across separate single-shot Chrome launches.
  Verify token/contrast compliance by code review + a manual pass.

So: leave the server running and hand those two cases to the human, who has the
running server and credentials.

## 6. Clean up

The server keeps running across turns. Note its PID (`lsof` output) and tell the
human how to stop it (`kill <pid>`), or stop it yourself when the visual pass is
done.
