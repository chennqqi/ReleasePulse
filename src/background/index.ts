import { setupAlarm, runCheckCycle, setupNotificationHandler } from './notifier'
import {
  getSettings,
  getIssueSubscriptions,
  addIssueSubscription,
  upsertRepoWatch,
  getRepoWatches,
  generateId,
  updateRepoWatch,
  updateIssueSubscription,
} from '@/lib/storage'
import type { IssueEvent, Subscription } from '@/types'
import { migrateIfNeeded } from '@/lib/migrate'
import { setLocale, detectLocale, type Locale } from '@/i18n'
import { fetchReleases, fetchTags, fetchIssue, fetchIssueEvents } from '@/lib/github-api'

/** Initialize i18n locale from stored settings. */
async function initLocale(): Promise<void> {
  try {
    const settings = await getSettings()
    if (settings.language === 'auto' || !settings.language) {
      setLocale(detectLocale())
    } else {
      setLocale(settings.language as Locale)
    }
  } catch {
    setLocale(detectLocale())
  }
}

/** Initialize the background service worker. */
async function init(): Promise<void> {
  console.log('[ReleasePulse] Background service worker initializing')

  await migrateIfNeeded()
  await initLocale()
  const settings = await getSettings()
  setupAlarm(settings.pollIntervalMinutes)
  setupNotificationHandler()

  runCheckCycle().catch(console.error)
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'release-pulse-poll') {
    runCheckCycle().catch(console.error)
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'RUN_CHECK') {
    runCheckCycle()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }))
    return true
  }

  if (message.type === 'UPDATE_ALARM') {
    getSettings().then((settings) => {
      setupAlarm(settings.pollIntervalMinutes)
      sendResponse({ success: true })
    })
    return true
  }

  if (message.type === 'GET_UNREAD_COUNT') {
    import('@/lib/storage').then(({ getUnreadCount }) => {
      getUnreadCount().then((count) => sendResponse({ count }))
    })
    return true
  }

  if (message.type === 'CHECK_SUBSCRIPTION') {
    const { owner, repo, issueNumber } = message.payload
    getIssueSubscriptions().then((subs) => {
      const exists = subs.some(
        (s) => s.owner === owner && s.repo === repo && s.issueNumber === issueNumber,
      )
      sendResponse({ exists })
    })
    return true
  }

  if (message.type === 'ADD_SUBSCRIPTION') {
    const { owner, repo, issueNumber, issueEvents } = message.payload as {
      owner: string
      repo: string
      issueNumber: number
      issueEvents?: IssueEvent[]
    }
    const sub: Subscription = {
      id: generateId(),
      type: 'github_issue',
      owner,
      repo,
      issueNumber,
      label: `${owner}/${repo}#${issueNumber}`,
      lastCheckedAt: null,
      lastSeenId: null,
      enabled: true,
      createdAt: new Date().toISOString(),
      issueEvents,
    }
    addIssueSubscription(sub)
      .then(async () => {
        // Fetch current issue state as baseline to avoid historical notifications
        try {
          const settings = await getSettings()
          const issue = await fetchIssue(owner, repo, issueNumber, settings.githubToken)
          const events = await fetchIssueEvents(owner, repo, issueNumber, settings.githubToken, 20)
          const recentEvents = events.slice(-10)
          const stateHash = issue.state + ':' + issue.updated_at + ':' +
            recentEvents.map((e) => e.event + ':' + e.created_at).join(',')
          await updateIssueSubscription(sub.id, { lastSeenId: stateHash, lastCheckedAt: new Date().toISOString() })
        } catch (err) {
          console.error('[ReleasePulse] Failed to set issue baseline:', err)
        }
        sendResponse({ success: true })
      })
      .catch((err) => sendResponse({ success: false, error: String(err) }))
    return true
  }

  if (message.type === 'CHECK_REPO_WATCH') {
    const { owner, repo } = message.payload as { owner: string; repo: string }
    getRepoWatches().then((watches) => {
      const watch = watches.find((w) => w.owner === owner && w.repo === repo)
      sendResponse({
        releases: watch?.events.releases ?? false,
        tags: watch?.events.tags ?? false,
      })
    })
    return true
  }

  if (message.type === 'ADD_REPO_WATCH') {
    const { owner, repo, releases, tags } = message.payload as {
      owner: string
      repo: string
      releases: boolean
      tags: boolean
    }
    upsertRepoWatch(owner, repo, { releases, tags })
      .then(async (watch) => {
        // Fetch latest release/tag as baseline to avoid historical notifications
        // Only for newly created watches (lastSeenReleaseId and lastSeenTagSha are both null)
        if (watch.lastSeenReleaseId === null || watch.lastSeenTagSha === null) {
          try {
            const settings = await getSettings()
            const patch: { lastSeenReleaseId?: string; lastSeenTagSha?: string } = {}
            if (releases && watch.lastSeenReleaseId === null) {
              const latestReleases = await fetchReleases(owner, repo, settings.githubToken, 1)
              if (latestReleases.length > 0) {
                patch.lastSeenReleaseId = latestReleases[0].id.toString()
              }
            }
            if (tags && watch.lastSeenTagSha === null) {
              const latestTags = await fetchTags(owner, repo, settings.githubToken, 1)
              if (latestTags.length > 0) {
                patch.lastSeenTagSha = latestTags[0].object.sha
              }
            }
            if (Object.keys(patch).length > 0) {
              await updateRepoWatch(watch.id, patch)
              console.log('[ReleasePulse] Baseline set for new watch:', watch.label, patch)
            }
          } catch (err) {
            console.error('[ReleasePulse] Failed to set repo watch baseline:', err)
          }
        }
        sendResponse({ success: true })
      })
      .catch((err) => sendResponse({ success: false, error: String(err) }))
    return true
  }
})

chrome.runtime.onInstalled.addListener((details) => {
  console.log(`[ReleasePulse] ${details.reason}`)
  init().catch(console.error)
})

init().catch(console.error)
