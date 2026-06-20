import { setupAlarm, runCheckCycle, setupNotificationHandler } from './notifier'
import { getSettings } from '@/lib/storage'

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
})

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`[ReleasePulse] ${details.reason}`)
  init().catch(console.error)
})

// Handle service worker startup
init().catch(console.error)
