import { defineManifest } from '@crxjs/vite-plugin'

export const manifest = defineManifest({
  manifest_version: 3,
  name: 'ReleasePulse',
  version: '0.1.0',
  description: 'Subscribe to software release notifications (GitHub releases, tags, issues)',
  permissions: ['storage', 'alarms', 'notifications', 'tabs'],
  host_permissions: ['https://api.github.com/*', 'https://github.com/*'],
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      '16': 'src/assets/icon-16.png',
      '48': 'src/assets/icon-48.png',
      '128': 'src/assets/icon-128.png',
    },
  },
  options_page: 'src/options/index.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  icons: {
    '16': 'src/assets/icon-16.png',
    '48': 'src/assets/icon-48.png',
    '128': 'src/assets/icon-128.png',
  },
})
