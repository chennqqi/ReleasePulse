import type { RepoWatch, Subscription } from '@/types'

const MIGRATION_KEY = 'migrated_v2'

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Migrate legacy release/tag subscriptions into RepoWatch entries. */
export async function migrateIfNeeded(): Promise<void> {
  const result = await chrome.storage.local.get([
    MIGRATION_KEY,
    'subscriptions',
    'repoWatches',
    'issueSubscriptions',
  ])

  if (result[MIGRATION_KEY]) return

  const legacySubs = (result.subscriptions as Subscription[] | undefined) ?? []
  const existingWatches = (result.repoWatches as RepoWatch[] | undefined) ?? []
  const existingIssues = (result.issueSubscriptions as Subscription[] | undefined) ?? []

  const watchMap = new Map<string, RepoWatch>()
  for (const watch of existingWatches) {
    watchMap.set(`${watch.owner}/${watch.repo}`, watch)
  }

  const issues: Subscription[] = [...existingIssues]

  for (const sub of legacySubs) {
    if (sub.type === 'github_issue') {
      issues.push(sub)
      continue
    }

    const key = `${sub.owner}/${sub.repo}`
    let watch = watchMap.get(key)
    if (!watch) {
      watch = {
        id: newId(),
        owner: sub.owner,
        repo: sub.repo,
        label: `${sub.owner}/${sub.repo}`,
        events: { releases: false, tags: false },
        lastCheckedAt: sub.lastCheckedAt,
        lastSeenReleaseId: null,
        lastSeenTagSha: null,
        enabled: sub.enabled,
        createdAt: sub.createdAt,
      }
      watchMap.set(key, watch)
    }

    if (sub.type === 'github_release') {
      watch.events.releases = true
      watch.lastSeenReleaseId = sub.lastSeenId
    }
    if (sub.type === 'github_tag') {
      watch.events.tags = true
      watch.lastSeenTagSha = sub.lastSeenId
    }

    watch.enabled = watch.enabled || sub.enabled
    if (sub.lastCheckedAt && (!watch.lastCheckedAt || sub.lastCheckedAt > watch.lastCheckedAt)) {
      watch.lastCheckedAt = sub.lastCheckedAt
    }
  }

  await chrome.storage.local.set({
    repoWatches: Array.from(watchMap.values()),
    issueSubscriptions: issues,
    [MIGRATION_KEY]: true,
  })

  if (legacySubs.length > 0) {
    await chrome.storage.local.remove('subscriptions')
    console.log('[ReleasePulse] Migrated legacy subscriptions to RepoWatch model')
  }
}
