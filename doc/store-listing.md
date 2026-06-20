# Web Store Listing — ReleasePulse

Shared copy for **Chrome Web Store** and **Firefox Add-ons (AMO)**.  
Release steps: [`doc/release-checklist.md`](./release-checklist.md)

## Extension name

ReleasePulse

## Version

**1.0.0** (public release)

## Short description (132 chars max — Chrome summary / AMO summary)

Get notified when GitHub repos publish releases, tags, or when subscribed issues change status.

## Detailed description

**Never miss a software update that matters.**

ReleasePulse is a lightweight browser extension for developers and open-source users who want timely alerts about GitHub activity — without drowning in email notifications.

### What you can do

- **Watch repositories** for new Releases and Tags
- **Subscribe to individual Issues** for closed, reopened, labeled, or unlabeled events
- **One-click subscribe** on any GitHub repo page via “Watch with ReleasePulse”
- **Desktop notifications** plus an in-extension notification feed
- **Configurable check interval** (default: every 15 minutes)
- **English & 简体中文** UI

### Why ReleasePulse?

GitHub’s built-in Watch sends emails for everything. ReleasePulse focuses on what you care about: version releases and specific issue changes — with a clean notification feed grouped by time.

### Optional GitHub Token

Works without a token (60 API requests/hour). Add a Personal Access Token in Settings to increase the limit to 5,000 requests/hour — recommended if you watch many repositories.

### Privacy

All data stays on your device. No analytics. No third-party servers operated by ReleasePulse. See our Privacy Policy:
https://github.com/chennqqi/ReleasePulse/blob/main/PRIVACY.md

## Category

- **Chrome:** Productivity / Developer Tools
- **Firefox AMO:** Alerts & Updates · Developer Tools

## Permission justifications (review forms)

| Permission | Justification |
|------------|---------------|
| storage | Store watches, settings, and notification history locally |
| alarms | Background polling for GitHub updates |
| notifications | Desktop alerts for new releases and issue changes |
| tabs | Open GitHub links when user clicks a notification |
| host: api.github.com | Fetch release, tag, and issue data |
| host: github.com | Inject optional subscribe button on repo pages |

## Screenshots & promotional images

**Chrome Web Store specs:** 1280×800 (or 640×400) · JPEG or 24-bit PNG (no alpha) · max 5 per locale.

Generated assets (run `python scripts/generate-store-assets.py`):

| Chrome field | Path |
|--------------|------|
| **Global screenshots** | `doc/store-assets/global/screenshots/` (5 files) |
| **Localized screenshots (简体中文)** | `doc/store-assets/zh-CN/screenshots/` (5 files) |
| **Small promo tile** (440×280) | `doc/store-assets/global/promo-small-440x280.png` |
| **Marquee promo tile** (1400×560) | `doc/store-assets/global/promo-marquee-1400x560.png` |

| # | File | Scene |
|---|------|-------|
| 1 | `01-github-watch.png` | GitHub repo — Watch with ReleasePulse button |
| 2 | `02-watch-popover.png` | Releases / Tags popover |
| 3 | `03-options-watching.png` | Options — Watching (compact) |
| 4 | `04-popup-feed.png` | Popup Feed tab |
| 5 | `05-options-full.png` | Options — full Watching page |

**zh-CN note:** Current zh-CN files use English UI sources. Before publishing the Chinese listing, set extension language to **简体中文**, recapture sources, and regenerate. See `doc/store-assets/README.md`.

Legacy raw captures remain in `doc/store-screenshots/` (source only, wrong size for upload).

### Promotional video (optional)

Plan A: English demo + Chinese SRT — see [`doc/store-video.md`](./store-video.md)

## Privacy policy URL

https://github.com/chennqqi/ReleasePulse/blob/main/PRIVACY.md

## Homepage / support

https://github.com/chennqqi/ReleasePulse

---

## Chrome Web Store

**Upload package:** `web-ext-artifacts/release-pulse-1.0.0-chrome.zip`  
**Build:** `npm run chrome:zip` or `npm run release:pack`  
**Dashboard:** https://chrome.google.com/webstore/devconsole

### Chrome upload checklist

1. `npm run release:pack`
2. Upload `release-pulse-1.0.0-chrome.zip`
3. **Global screenshots:** upload all 5 from `doc/store-assets/global/screenshots/`
4. **Localized (zh-CN) screenshots:** upload all 5 from `doc/store-assets/zh-CN/screenshots/` (replace with 简体中文 UI captures before go-live if possible)
5. **Small promo tile:** `doc/store-assets/global/promo-small-440x280.png`
6. **Marquee promo tile:** `doc/store-assets/global/promo-marquee-1400x560.png`
7. Optional: promotional video — [`doc/store-video.md`](./store-video.md)
8. Paste short + detailed description from this file
9. Set privacy policy URL
10. Submit for review

**Minimum browser:** Chrome 121+

---

## Firefox Add-ons (AMO)

**Upload package:** `web-ext-artifacts/release-pulse-1.0.0-firefox.zip`  
**Add-on ID:** `release-pulse@chennqqi.github`  
**Build:** `npm run firefox:zip` or `npm run release:pack`  
**Dashboard:** https://addons.mozilla.org/developers/

### Data collection disclosure

ReleasePulse does **not** collect or transmit personal data to ReleasePulse servers. Manifest:

```json
"data_collection_permissions": { "required": ["none"] }
```

### AMO reviewer notes (optional field)

> Open-source on GitHub (Apache-2.0). Polls GitHub API for user-configured watches only; optional token in `browser.storage.local`. Content script injects subscribe UI on `github.com/*/*` repo pages. No remote code, no analytics. Two linter warnings remain from minified `react-dom` (`innerHTML`); our source does not use `innerHTML` or `dangerouslySetInnerHTML`.

### Source code submission (AMO form)

**Do you need to submit source code?** → **Yes**

The uploaded zip is a Vite production build (TypeScript, React, Tailwind). Reviewers must reproduce it from source.

**Tools used (check all that apply on the form):**

| AMO question | Answer | This project |
|--------------|--------|--------------|
| Code generation or minification | Yes | TypeScript → JS; Vite minifies bundles |
| File bundler (e.g. webpack) | Yes | **Vite** |
| HTML/CSS template engine | Yes | React TSX/JSX; Tailwind CSS + PostCSS |
| Other build processing | Yes | `@crxjs/vite-plugin`, `patch-firefox-manifest.mjs`, `pack-store-zip.mjs` |

**Source repository:** `https://github.com/chennqqi/ReleasePulse` (public, Apache-2.0)  
**Tag for this release:** `v1.0.0` (or matching commit on `main`)

**Build instructions (paste into “Build notes”):**

```text
Requirements: Node.js 24+, npm

git clone https://github.com/chennqqi/ReleasePulse.git
cd ReleasePulse
git checkout v1.0.0
npm ci
npm run firefox:zip

Upload: web-ext-artifacts/release-pulse-1.0.0-firefox.zip
(Firefox package removes background.service_worker; uses background.scripts only.)

Verify: npm run release:verify
```

Do **not** upload `node_modules/`, `dist/`, or `web-ext-artifacts/` as source — reviewers build locally.

### Firefox upload checklist

1. `npm run release:pack` (or `npm run firefox:zip`)
2. Upload `release-pulse-1.0.0-firefox.zip` (not a manual `dist/` zip)
3. Point source review to GitHub repo + build notes above
4. Upload screenshots (see Screenshots section)
5. Summary + description from this file
6. Privacy policy URL + Apache 2.0 license
7. Submit for review (Mozilla signing)

**Minimum browser:** Firefox 140+ desktop, Firefox for Android 142+
