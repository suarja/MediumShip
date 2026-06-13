# Knowly — App Store delivery

Exported App Store screenshots, produced by `../app-store-generator`.

```
app-store/
  iphone-6.9/fr/01-home.png … 05-premium.png   ← 1320×2868 (Apple 6.9")
```

This is a delivered snapshot. To regenerate or add sizes/locales, run the
generator (`bun run dev` → Export) or the headless full-size mode:

```bash
# per slide, full 6.9" size, no UI chrome:
http://localhost:3001/?full=<home|article|episode|video|premium>&loc=fr
```

Apple accepts the 6.9" set and downsamples for smaller devices; export the other
sizes (6.5/6.3/6.1) from the generator's "Export current → ZIP" when needed.
