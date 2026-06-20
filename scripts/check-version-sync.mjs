/**
 * Ensure package.json, manifest.ts, and src/version.ts share the same version.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function readVersionFromPackage() {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
  return pkg.version
}

function readVersionFromManifest() {
  const source = readFileSync(join(process.cwd(), 'manifest.ts'), 'utf8')
  const match = source.match(/version:\s*['"]([^'"]+)['"]/)
  if (!match) {
    throw new Error('Could not parse version from manifest.ts')
  }
  return match[1]
}

function readVersionFromApp() {
  const source = readFileSync(join(process.cwd(), 'src', 'version.ts'), 'utf8')
  const match = source.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/)
  if (!match) {
    throw new Error('Could not parse APP_VERSION from src/version.ts')
  }
  return match[1]
}

const versions = {
  packageJson: readVersionFromPackage(),
  manifest: readVersionFromManifest(),
  app: readVersionFromApp(),
}

const unique = new Set(Object.values(versions))
if (unique.size !== 1) {
  console.error('[check-version-sync] Version mismatch:', versions)
  process.exit(1)
}

console.log(`[check-version-sync] OK — ${versions.packageJson}`)
