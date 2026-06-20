# ReleasePulse Privacy Policy

**Last updated:** June 20, 2026

ReleasePulse is a browser extension that notifies you about GitHub repository releases, tags, and issue updates. This policy explains what data the extension handles and how.

## Data collection

ReleasePulse does **not** collect, sell, or transmit personal data to servers operated by ReleasePulse. Optional GitHub API calls are made directly from your browser to GitHub. Firefox manifest declares `data_collection_permissions: { required: ["none"] }`.

- **No account** is created by ReleasePulse.
- **No analytics** or third-party tracking is used.
- All subscription and settings data stays **on your device**.

## Data We Access

### Stored locally (browser extension storage)

| Data | Purpose |
|------|---------|
| GitHub Personal Access Token (optional) | Authenticate GitHub API requests from your browser |
| Repo watches & issue subscriptions | Know which repositories/issues to monitor |
| Notification history | Show recent alerts in the popup |
| Settings (poll interval, language, etc.) | Configure extension behavior |

Data is stored using the browser’s extension storage API (`chrome.storage.local` / `browser.storage.local`). It never leaves your device except when the extension calls the **GitHub API** directly from your browser.

### Network requests

ReleasePulse only communicates with:

- `https://api.github.com` — check releases, tags, and issues
- `https://github.com` — inject the optional “Watch” button on repo pages

No other external services receive your data.

## Permissions Explained

| Permission | Why it is needed |
|------------|------------------|
| `storage` | Save watches, settings, and notification history locally |
| `alarms` | Periodically check for updates in the background |
| `notifications` | Show desktop alerts when updates are detected |
| `tabs` | Open a GitHub link when you click a notification |
| `https://api.github.com/*` | Fetch release/tag/issue data |
| `https://github.com/*` | Optional subscribe button on GitHub pages |

## GitHub Token

If you provide a GitHub Personal Access Token:

- It is stored only in your browser’s local extension storage.
- It is sent only to `api.github.com` as a Bearer token.
- It is never logged or transmitted elsewhere.
- You can remove it at any time in Settings.

We recommend using a token with the minimum scope required (`public_repo` for public repos, or `repo` for private repos).

## Data Retention

- Notification history is capped at **200 entries**; older entries are removed automatically.
- Uninstalling the extension removes all locally stored data.

## Children’s Privacy

ReleasePulse is not directed at children under 13 and does not knowingly collect personal information.

## Changes

We may update this policy as the extension evolves. Material changes will be reflected in the “Last updated” date above.

## Contact

For privacy questions or requests, open an issue on the project repository:
https://github.com/chennqqi/ReleasePulse
