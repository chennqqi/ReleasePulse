import { defineManifest } from '@crxjs/vite-plugin'

/** Stable Firefox add-on ID for AMO signing and updates. */
export const FIREFOX_EXTENSION_ID = 'release-pulse@chennqqi.github'

export const manifest = defineManifest({
  manifest_version: 3,
  name: '__MSG_manifest_name__',
  version: '1.0.0',
  description: '__MSG_manifest_description__',
  default_locale: 'en',
  browser_specific_settings: {
    gecko: {
      id: FIREFOX_EXTENSION_ID,
      strict_min_version: '136.0',
      data_collection_permissions: {
        required: ['none'],
      },
    },
  },
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
    scripts: ['src/background/index.ts'],
    type: 'module',
  },
  icons: {
    '16': 'src/assets/icon-16.png',
    '48': 'src/assets/icon-48.png',
    '128': 'src/assets/icon-128.png',
  },
  content_scripts: [
    {
      matches: ['https://github.com/*/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
  web_accessible_resources: [
    {
      resources: ['src/assets/icon-16.png'],
      matches: ['https://github.com/*'],
    },
  ],
})
