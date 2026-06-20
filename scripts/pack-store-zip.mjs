/**
 * Pack dist/ into a store-upload zip (manifest.json at archive root, no source maps).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const target = process.argv[2]
if (target !== 'chrome' && target !== 'firefox') {
  console.error('[pack-store-zip] Usage: node scripts/pack-store-zip.mjs <chrome|firefox>')
  process.exit(1)
}

const skipBuild = process.env.SKIP_BUILD === '1'
const artifactsDir = join(process.cwd(), 'web-ext-artifacts')

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env, shell: true })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

if (!skipBuild) {
  run('npm', ['run', 'build'])
}

const manifestPath = join(process.cwd(), 'dist', 'manifest.json')
if (!existsSync(manifestPath)) {
  console.error('[pack-store-zip] dist/manifest.json not found. Run npm run build first.')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const version = manifest.version ?? '0.0.0'
const zipName = `release-pulse-${version}-${target}.zip`
const zipPath = join(artifactsDir, zipName)

if (existsSync(zipPath)) {
  try {
    unlinkSync(zipPath)
  } catch (err) {
    console.error(`[pack-store-zip] Could not remove existing zip: ${zipPath}`)
    throw err
  }
}

run('npx', [
  'web-ext',
  'build',
  '--source-dir',
  'dist',
  '--artifacts-dir',
  artifactsDir,
  '--filename',
  zipName,
  '--overwrite-dest',
])

console.log(`[pack-store-zip] Created ${join(artifactsDir, zipName)}`)
