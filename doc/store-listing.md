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

## Screenshots

Source files in `doc/store-screenshots/`:

| File | Description | Upload order |
|------|-------------|--------------|
| `01-github-watch-popover.png` | GitHub repo page — “Watch with ReleasePulse” on react repo | 1 |
| `02-watch-popover.png` | Watch popover — Releases & Tags checkboxes | 2 |
| `03-options-watching.png` | Options — Watching page with repo groups | 3 |

Recommended size: **1280×800** or **640×400** (resize if needed before upload)

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
3. Upload 3 screenshots from `doc/store-screenshots/`
4. Paste short + detailed description from this file
5. Set privacy policy URL
6. Submit for review

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

> Polls GitHub API for user watches; optional token in local storage only. Injects subscribe UI on GitHub repo pages. No external analytics.

### Firefox upload checklist

1. `npm run release:pack`
2. Upload `release-pulse-1.0.0-firefox.zip`
3. Upload same 3 screenshots
4. Summary + description from this file
5. Privacy policy URL + Apache 2.0 license
6. Submit for review (Mozilla signing)

**Minimum browser:** Firefox 136+
