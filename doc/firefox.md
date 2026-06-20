# Firefox support

ReleasePulse targets **Firefox 136+** (Manifest V3 with ES module service worker).

Add-on ID: `release-pulse@chennqqi.github` (see `manifest.ts`).

## Install from source

```bash
npm install
npm run build
```

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `dist/manifest.json`

Or run with auto-reload during development:

```bash
npm run build
npm run firefox:run
```

Packaged zip for import testing (manifest at archive root):

```bash
npm run firefox:zip
```

Output: `web-ext-artifacts/release-pulse-1.0.0-firefox.zip` — load via **Load Temporary Add-on…** on `about:debugging`.

## Automated checks

```bash
npm run build
npm run firefox:lint    # web-ext manifest + file validation
npm run test            # includes cross-browser notification helpers
```

CI runs `firefox:lint` after every production build.

## Manual verification checklist

After loading the temporary add-on:

| Area | Steps | Expected |
|------|--------|----------|
| Popup | Click toolbar icon | Feed / Watching / Add tabs render |
| Options | Popup → Settings or right-click extension → Options | Sidebar pages load |
| GitHub inject | Open any `github.com/owner/repo` | “Watch with ReleasePulse” button appears |
| Watch repo | Use popover to enable Releases | Entry appears under Watching |
| Background sync | Settings → Run check now (or wait for alarm) | Last sync updates; no console errors in **Inspect** on service worker |
| Notifications | Enable desktop notifications; trigger an update | System notification with icon; click opens GitHub tab |
| Badge | Unread feed items | Toolbar badge shows count |
| i18n | Firefox UI language 中文 | Popup strings follow zh-CN when language is Auto |
| Storage | Reload extension | Watches and settings persist |

## AMO publishing

1. `npm run build`
2. Zip the `dist/` folder contents (not the folder itself)
3. Submit at [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
4. Include link to [PRIVACY.md](../PRIVACY.md)

## Known differences from Chrome

- Firefox uses `background.scripts` (event page); Chrome uses `background.service_worker` — build adds both via `scripts/patch-firefox-manifest.mjs`
- `priority` on notifications is Chrome-only; omitted on Firefox automatically
- Notification icons must use `chrome.runtime.getURL()` (handled in `src/lib/browser.ts`)
- Minimum Firefox **136** because the background script uses `type: "module"`
