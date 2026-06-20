import { setupAlarm, runCheckCycle, setupNotificationHandler } from './notifier'
import { getSettings, getSubscriptions, addSubscription, generateId } from '@/lib/storage'
import type { SubscriptionType, IssueEvent, Subscription } from '@/types'

/** Initialize the background service worker. */
async function init(): Promise<void> {
  console.log('[ReleasePulse] Background service worker initializing')

  const settings = await getSettings()
  setupAlarm(settings.pollIntervalMinutes)
  setupNotificationHandler()

  // Run an initial check on startup
  runCheckCycle().catch(console.error)
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'release-pulse-poll') {
    runCheckCycle().catch(console.error)
  }
})

// Listen for messages from popup/options
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
    const { subscriptionType, owner, repo, issueNumber } = message.payload
    getSubscriptions().then((subs) => {
      const exists = subs.some(
        (s) =>
          s.type === subscriptionType &&
          s.owner === owner &&
          s.repo === repo &&
          (subscriptionType !== 'github_issue' || s.issueNumber === issueNumber),
      )
      sendResponse({ exists })
    })
    return true
  }

  if (message.type === 'ADD_SUBSCRIPTION') {
    const { subscriptionType, owner, repo, issueNumber, issueEvents } = message.payload as {
      subscriptionType: SubscriptionType
      owner: string
      repo: string
      issueNumber?: number
      issueEvents?: IssueEvent[]
    }
    const label = issueNumber
      ? `${owner}/${repo}#${issueNumber}`
      : `${owner}/${repo}`
    const sub: Subscription = {
      id: generateId(),
      type: subscriptionType,
      owner,
      repo,
      issueNumber,
      label,
      lastCheckedAt: null,
      lastSeenId: null,
      enabled: true,
      createdAt: new Date().toISOString(),
      issueEvents,
    }
    addSubscription(sub)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: String(err) }))
    return true
  }
})

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`[ReleasePulse] ${details.reason}`)
  init().catch(console.error)
})

// Handle service worker startup
init().catch(console.error)
