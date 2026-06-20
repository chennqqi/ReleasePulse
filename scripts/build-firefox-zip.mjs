/**
 * Build dist/ and pack a Firefox installable zip (manifest.json at archive root).
 */
import { spawnSync } from 'node:child_process'

spawnSync('node', ['scripts/pack-store-zip.mjs', 'firefox'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})
