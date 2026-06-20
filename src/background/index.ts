import { setupAlarm, runCheckCycle, setupNotificationHandler } from './notifier'
import {
  getSettings,
  getIssueSubscriptions,
  addIssueSubscription,
  upsertRepoWatch,
  getRepoWatches,
  generateId,
} from '@/lib/storage'
import type { IssueEvent, Subscription } from '@/types'
import { migrateIfNeeded } from '@/lib/migrate'

/** Initialize the background service worker. */
async function init(): Promise<void> {
  console.log('[ReleasePulse] Background service worker initializing')

  await migrateIfNeeded()
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
      .then(() => sendResponse({ success: true }))
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
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }))
    return true
  }
})

chrome.runtime.onInstalled.addListener((details) => {
  console.log(`[ReleasePulse] ${details.reason}`)
  init().catch(console.error)
})

init().catch(console.error)
