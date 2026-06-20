/**
 * Validate Firefox-ready dist/ output: manifest fields and referenced files.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const distDir = join(process.cwd(), 'dist')
const manifestPath = join(distDir, 'manifest.json')

function fail(message) {
  console.error(`[verify-firefox] ${message}`)
  process.exit(1)
}

if (!existsSync(manifestPath)) {
  fail('dist/manifest.json not found. Run npm run build first.')
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

if (manifest.manifest_version !== 3) {
  fail('manifest_version must be 3')
}

const geckoId = manifest.browser_specific_settings?.gecko?.id
if (!geckoId) {
  fail('browser_specific_settings.gecko.id is required')
}

const worker = manifest.background?.service_worker
const scripts = manifest.background?.scripts
if (!worker || !Array.isArray(scripts) || scripts.length === 0) {
  fail('background must include service_worker and scripts for cross-browser MV3')
}

if (manifest.background.type !== 'module') {
  fail('background.type must be "module"')
}

for (const script of scripts) {
  const scriptPath = join(distDir, script)
  if (!existsSync(scriptPath)) {
    fail(`background script not found: ${script}`)
  }
}

const workerPath = join(distDir, worker)
if (!existsSync(workerPath)) {
  fail(`background service_worker not found: ${worker}`)
}

console.log('[verify-firefox] Manifest structure OK for Firefox')

const lint = spawnSync('npx', ['web-ext', 'lint', '--source-dir', 'dist', '--self-hosted', '--boring'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})

if (lint.status !== 0) {
  fail('web-ext lint reported errors (see output above)')
}

console.log('[verify-firefox] web-ext lint passed')
