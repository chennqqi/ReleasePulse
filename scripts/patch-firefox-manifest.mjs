/**
 * Ensure dist/manifest.json includes Firefox background.scripts alongside service_worker.
 * crxjs emits service-worker-loader.js; Firefox MV3 uses scripts + type module.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const manifestPath = join(process.cwd(), 'dist', 'manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

if (!manifest.background?.service_worker) {
  console.error('[patch-firefox-manifest] Missing background.service_worker in dist/manifest.json')
  process.exit(1)
}

const workerFile = manifest.background.service_worker

manifest.background = {
  ...manifest.background,
  scripts: [workerFile],
  type: manifest.background.type ?? 'module',
}

if (!manifest.browser_specific_settings?.gecko?.id) {
  console.error('[patch-firefox-manifest] Missing browser_specific_settings.gecko.id')
  process.exit(1)
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log('[patch-firefox-manifest] Added background.scripts for Firefox:', workerFile)
