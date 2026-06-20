# ReleasePulse

A browser extension that notifies you when GitHub repositories publish releases or tags, or when subscribed issues change status.

**Version 1.0.0** · [Privacy Policy](./PRIVACY.md)

## Browser compatibility

Manifest V3. Tested on current stable releases of each browser below.

| Browser | Minimum version | Install |
|---------|-----------------|--------|
| **Google Chrome** | 121+ | Load unpacked `dist/` |
| **Microsoft Edge** | 121+ | Load unpacked `dist/` (Chromium) |
| **Mozilla Firefox** | 136+ | Temporary add-on: `dist/manifest.json` or [`release-pulse-1.0.0-firefox.zip`](./web-ext-artifacts/release-pulse-1.0.0-firefox.zip) |

Notes:

- **Chrome / Edge 121+** — MV3 with module background service worker; `background.scripts` in the manifest is ignored by Chromium.
- **Firefox 136+** — Required for `background.type: "module"`; Firefox uses `background.scripts` instead of `service_worker` (see [`doc/firefox.md`](./doc/firefox.md)).
- Older browsers are not supported.

Build a Firefox test package:

```bash
npm run firefox:zip
```

Output: `web-ext-artifacts/release-pulse-1.0.0-firefox.zip` (zip root contains `manifest.json`, not a nested folder).

## Features

- **Repo watches** — Subscribe to **Releases** and/or **Tags** per repository (one watch, configurable events)
- **Issue subscriptions** — Track individual issues for closed, reopened, labeled, or unlabeled events
- **One-click subscribe** — “Watch with ReleasePulse” button on GitHub repo pages
- **Notification feed** — Popup with Feed / Watching / Add tabs, filtered and grouped by time (Today / Yesterday / Earlier)
- **Desktop notifications** — Optional system alerts when updates are detected
- **Background polling** — Configurable check interval (default: 15 minutes)
- **Sync status** — Last sync time, API quota, and visible error hints (rate limit, auth, not found)
- **i18n** — English and 简体中文 UI

## Quick start

### Install from source

```bash
npm install
npm run build
```

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` directory

### Install on Firefox

Requires **Firefox 136+** (see [Browser compatibility](#browser-compatibility)).

```bash
npm run build
# or packaged zip for import testing:
npm run firefox:zip
```

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Select `dist/manifest.json` **or** `web-ext-artifacts/release-pulse-1.0.0-firefox.zip`

For lint and temporary reload during development:

```bash
npm run firefox:verify   # build + web-ext lint
npm run firefox:run      # load dist/ in Firefox with reload
```

See [`doc/firefox.md`](./doc/firefox.md) for the full verification checklist and AMO notes.

### Configure

1. Click the extension icon → complete the onboarding (optional GitHub token recommended)
2. On any GitHub repo page, click **Watch with ReleasePulse** and choose Releases / Tags
3. Or open **Settings** (Options) to add watches manually, manage subscriptions, and set poll interval

### GitHub token (optional)

| | Without token | With token |
|---|---------------|------------|
| API limit | 60 req/hour | 5,000 req/hour |
| Private repos | No | Yes (with `repo` scope) |

Create a token at [GitHub Settings → Tokens](https://github.com/settings/tokens/new?description=ReleasePulse&scopes=repo) and paste it in Settings.

## Development

```bash
npm run dev          # watch build
npm run build        # production build
npm run type-check   # TypeScript only
npm run test         # unit tests (vitest)
npm run test:watch   # tests in watch mode
npm run firefox:lint # validate dist/ for Firefox (run build first)
npm run firefox:run  # temporary install in Firefox
npm run firefox:zip  # build + zip for Firefox import testing
npm run chrome:zip   # build + zip for Chrome Web Store upload
npm run release:pack # full release: test, build, lint, both store zips
```

## Publishing to Web Stores

**Version 1.0.0** — ready for public submission.

```bash
npm run release:pack
```

| Store | Upload file | Checklist |
|-------|-------------|-----------|
| [Chrome Web Store](https://chrome.google.com/webstore/devconsole) | `web-ext-artifacts/release-pulse-1.0.0-chrome.zip` | [`doc/release-checklist.md`](./doc/release-checklist.md) |
| [Firefox AMO](https://addons.mozilla.org/developers/) | `web-ext-artifacts/release-pulse-1.0.0-firefox.zip` | same |

Listing copy, screenshots, and permission justifications:

- **Release checklist:** [`doc/release-checklist.md`](./doc/release-checklist.md)
- **Store listing text:** [`doc/store-listing.md`](./doc/store-listing.md)
- **Screenshots:** [`doc/store-screenshots/`](./doc/store-screenshots/)
- **Privacy policy:** [`PRIVACY.md`](./PRIVACY.md) · URL for store forms: `https://github.com/chennqqi/ReleasePulse/blob/main/PRIVACY.md`

## Tech stack

- Manifest V3 — Chrome 121+ · Edge 121+ · Firefox 136+
- React + TypeScript + TailwindCSS
- Vite + @crxjs/vite-plugin
- Zustand

## License

Apache License 2.0 — see [LICENSE](./LICENSE)
