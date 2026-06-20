# ReleasePulse — Web Store Release Checklist

**Version:** 1.0.0 · **Date:** 2026-06-20

Use this checklist before submitting to [Chrome Web Store](https://chrome.google.com/webstore/devconsole) and [Firefox Add-ons (AMO)](https://addons.mozilla.org/developers/).

## Pre-flight (local)

```bash
npm run release:pack
```

This runs: version sync → tests → build → Firefox lint → packages both store zips.

| Output | Path |
|--------|------|
| Chrome Web Store upload | `web-ext-artifacts/release-pulse-1.0.0-chrome.zip` |
| Firefox AMO upload | `web-ext-artifacts/release-pulse-1.0.0-firefox.zip` |

Zip roots contain `manifest.json` directly (not a nested folder). Source maps are excluded.

### Verify before upload

- [ ] `npm run release:pack` exits 0
- [ ] Version **1.0.0** in `package.json`, `manifest.ts`, `src/version.ts`
- [ ] Firefox temporary install tested (passed)
- [ ] Chrome side-load tested with `dist/` or chrome zip
- [ ] Privacy policy live at GitHub URL (see below)
- [ ] Screenshots ready in `doc/store-screenshots/`

---

## Shared assets

| Asset | Location |
|-------|----------|
| Listing copy (EN) | [`doc/store-listing.md`](./store-listing.md) |
| Privacy policy | [`PRIVACY.md`](../PRIVACY.md) |
| Privacy policy URL | `https://github.com/chennqqi/ReleasePulse/blob/main/PRIVACY.md` |
| Screenshots (3) | `doc/store-screenshots/01-*.png` … `03-*.png` |
| Icon 128×128 | Built into extension (`src/assets/icon-128.png`) |
| License | Apache 2.0 — [`LICENSE`](../LICENSE) |

**Screenshot size:** 1280×800 or 640×400 recommended (resize before upload if needed).

---

## Chrome Web Store

**Dashboard:** https://chrome.google.com/webstore/devconsole  
**Package:** `web-ext-artifacts/release-pulse-1.0.0-chrome.zip`

### Listing

| Field | Value |
|-------|-------|
| Name | ReleasePulse |
| Category | Productivity |
| Language | English (primary); supports 简体中文 in UI |
| Short description | See `doc/store-listing.md` (≤132 chars) |
| Detailed description | See `doc/store-listing.md` |
| Privacy policy URL | GitHub `PRIVACY.md` link above |
| Homepage | `https://github.com/chennqqi/ReleasePulse` |

### Permissions justification

Copy from [`doc/store-listing.md`](./store-listing.md) → Permission justifications table when the review form asks.

### Chrome checklist

- [ ] Upload zip (not the `dist/` folder)
- [ ] Upload 3 screenshots
- [ ] Set privacy policy URL
- [ ] Declare: **No remote code**; **No data sold to third parties**
- [ ] Single purpose: GitHub release/tag/issue notifications
- [ ] Submit for review

**Minimum browser:** Chrome 121+ (Manifest V3, module service worker)

---

## Firefox Add-ons (AMO)

**Dashboard:** https://addons.mozilla.org/developers/  
**Package:** `web-ext-artifacts/release-pulse-1.0.0-firefox.zip`  
**Add-on ID:** `release-pulse@chennqqi.github`

### Listing

| Field | Value |
|-------|-------|
| Name | ReleasePulse |
| Summary | See `doc/store-listing.md` — Short description |
| Description | See `doc/store-listing.md` — Detailed description |
| Categories | Alerts & Updates · Developer Tools |
| License | Apache License 2.0 |
| Privacy policy | Same GitHub URL as Chrome |

### Data collection (built-in consent)

Manifest declares **no data collection** by ReleasePulse:

```json
"data_collection_permissions": { "required": ["none"] }
```

User data stays local; GitHub API calls go directly from the browser (see `PRIVACY.md`). No ReleasePulse-operated servers.

### Notes for reviewers

> ReleasePulse polls GitHub API for user-configured repo watches and issue subscriptions. Optional GitHub token is stored in `browser.storage.local` only. Content script injects a subscribe button on `github.com/*/*` repo pages. Background uses `alarms` for periodic checks.

### Firefox checklist

- [ ] Upload zip on AMO submission page
- [ ] Upload 3 screenshots (same as Chrome)
- [ ] Privacy policy URL set
- [ ] License: Apache 2.0
- [ ] Confirm data collection: **None** (matches manifest)
- [ ] Submit for review (Mozilla signing)

**Minimum browser:** Firefox 136+ (`strict_min_version` in manifest)

See also [`doc/firefox.md`](./firefox.md).

---

## After approval

- [ ] Tag git release `v1.0.0`
- [ ] Update README with store links (when live)
- [ ] Monitor review feedback / crash reports

## Next version bump

1. Update version in `package.json`, `manifest.ts`, `src/version.ts`
2. Run `npm run release:pack`
3. Upload new zips to both stores
