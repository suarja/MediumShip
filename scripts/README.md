# scripts/

Helper scripts behind the root [`Justfile`](../Justfile). You normally don't
call these directly — run `just` from the repo root to see every command.

| Script | Invoked by | What it does |
| --- | --- | --- |
| `ios.sh` | `just ios` · `just ipad` · `just ios-both` | Boots one or more iOS simulators with `xcrun simctl`, brings the Simulator UI forward, auto-detects the running Expo dev-server URL/port, and opens the app on each device. Bypasses the AppleScript/System-Events path that crashes Expo's `i` shortcut in some terminals (e.g. Warp). |

## `ios.sh` details

```
scripts/ios.sh <iphone|ipad|both>
```

- Requires a running dev server (`just start`) in another tab.
- Detects the LAN host from `en0`/`en1` and the port by probing Expo's
  `/status` endpoint on `8081`–`8084`.
- Installs **Expo Go** on a device automatically if it's missing (from Expo's
  local simulator cache for the project's SDK), avoiding the
  `LSApplicationWorkspace error 115` you get when `exp://` has no handler. If
  Expo Go isn't cached yet, it tells you to install it once via Expo's `i`.
- Resolves simulators **by name**, so UDIDs are never hard-coded. Override the
  names with the `iphone` / `ipad` variables in the `Justfile`, or per-run:

  ```sh
  IPHONE_NAME="iPhone 16 Pro" scripts/ios.sh iphone
  ```

- Other overrides: `EXPO_HOST`, `EXPO_PORT`.
