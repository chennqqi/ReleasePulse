/**
 * Full release pipeline: version check, tests, build, lint, Chrome + Firefox store zips.
 */
import { spawnSync } from 'node:child_process'

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell: true })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log('[release:pack] Step 1/6 — version sync')
run('node', ['scripts/check-version-sync.mjs'])

console.log('[release:pack] Step 2/6 — unit tests')
run('npm', ['run', 'test'])

console.log('[release:pack] Step 3/6 — production build')
run('npm', ['run', 'build'])

console.log('[release:pack] Step 4/6 — Firefox lint')
run('npm', ['run', 'firefox:lint'])

console.log('[release:pack] Step 5/6 — store zips')
run('node', ['scripts/pack-store-zip.mjs', 'chrome'], { ...process.env, SKIP_BUILD: '1' })
run('node', ['scripts/pack-store-zip.mjs', 'firefox'], { ...process.env, SKIP_BUILD: '1' })

console.log('[release:pack] Step 6/6 — done')
console.log('')
console.log('Upload packages (web-ext-artifacts/):')
console.log('  release-pulse-*-chrome.zip  → Chrome Web Store')
console.log('  release-pulse-*-firefox.zip → Firefox AMO')
console.log('')
console.log('Next: doc/release-checklist.md')
