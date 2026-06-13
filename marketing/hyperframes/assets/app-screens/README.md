# App screens

Real Knowly iOS captures used by `slide-screenshot` via the manifest's
`screenshotSrc` (path relative to `marketing/hyperframes/`, e.g.
`assets/app-screens/home-fr.png`).

Capture them with the Expo-web + headless-Chrome protocol in
`docs/agents/ui-visual-testing.md`. Recommended set: home feed, article detail,
episode/audio player, video detail, premium screen — portrait, status bar visible.

When `screenshotSrc` is empty, `slide-screenshot` falls back to the editorial mock.
