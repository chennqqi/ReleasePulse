# ReleasePulse

A browser extension for subscribing to software release notifications.

## Features

### GitHub Subscriptions (v0.1)
- **New Release** - Get notified when a repo publishes a new release
- **New Tag** - Get notified when a repo creates a new tag
- **Issue Status** - Get notified when a subscribed issue is closed, reopened, labeled, or unlabeled

## Tech Stack

- **Manifest V3** (Chrome/Edge compatible)
- **React + TypeScript**
- **TailwindCSS**
- **Vite + @crxjs/vite-plugin**
- **Zustand** for state management

## Development

```bash
# Install dependencies
cnpm install

# Dev build (watch mode)
npm run dev

# Production build
npm run build
```

### Load in Chrome/Edge

1. Run `npm run build`
2. Open `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` directory

## Configuration

1. Click the extension icon and open Settings
2. Optionally add a GitHub Personal Access Token (increases API rate limit from 60 to 5,000 req/hour)
3. Set check interval (default: 15 minutes)
4. Add subscriptions by entering GitHub repo URLs or `owner/repo` format

## License

See [LICENSE](./LICENSE)
