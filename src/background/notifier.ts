import {
  getSubscriptions,
  updateSubscription,
  getSettings,
  addNotifications,
  getUnreadCount,
} from '@/lib/storage'
import { checkSubscription, createNotificationRecords } from './checker'
import { RateLimitError } from '@/lib/github-api'

const ALARM_NAME = 'release-pulse-poll'

/** Set up the periodic alarm for checking subscriptions. */
export function setupAlarm(intervalMinutes: number): void {
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: 1,
      periodInMinutes: intervalMinutes,
    })
    console.log(`[ReleasePulse] Alarm set: every ${intervalMinutes} minutes`)
  })
}

/** Run a full check cycle across all enabled subscriptions. */
export async function runCheckCycle(): Promise<void> {
  console.log('[ReleasePulse] Starting check cycle')
  const settings = await getSettings()
  const subscriptions = await getSubscriptions()
  const enabledSubs = subscriptions.filter((s) => s.enabled)

  if (enabledSubs.length === 0) {
    console.log('[ReleasePulse] No enabled subscriptions, skipping')
    return
  }

  let totalNewNotifications = 0

  for (const sub of enabledSubs) {
    try {
      const result = await checkSubscription(sub, settings.githubToken)

      if (result.hasUpdate || result.newId !== sub.lastSeenId) {
        await updateSubscription(sub.id, {
          lastSeenId: result.newId,
          lastCheckedAt: new Date().toISOString(),
        })
      } else {
        await updateSubscription(sub.id, {
          lastCheckedAt: new Date().toISOString(),
        })
      }

      if (result.notifications.length > 0) {
        const records = createNotificationRecords(sub.id, result)
        await addNotifications(records)
        totalNewNotifications += records.length

        // Send desktop notifications
        if (settings.desktopNotifications) {
          for (const record of records) {
            chrome.notifications.create(record.id, {
              type: 'basic',
              iconUrl: 'src/assets/icon-128.png',
              title: record.title,
              message: record.body,
              priority: 2,
            })
          }
        }
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        console.error('[ReleasePulse] Rate limit hit, stopping cycle')
        break
      }
      console.error(`[ReleasePulse] Error checking ${sub.label}:`, err)
    }
  }

  // Update badge with unread count
  const unreadCount = await getUnreadCount()
  const badgeText = unreadCount > 0 ? unreadCount.toString() : ''
  const badgeColor = unreadCount > 0 ? '#2563eb' : '#6b7280'
  chrome.action.setBadgeText({ text: badgeText })
  chrome.action.setBadgeBackgroundColor({ color: badgeColor })

  console.log(`[ReleasePulse] Check cycle complete: ${totalNewNotifications} new notifications`)
}

/** Handle notification click - open the URL in a new tab. */
export function setupNotificationHandler(): void {
  chrome.notifications.onClicked.addListener(async (notificationId) => {
    const { getNotifications, markNotificationRead } = await import('@/lib/storage')
    const notifs = await getNotifications()
    const notif = notifs.find((n) => n.id === notificationId)
    if (notif) {
      await markNotificationRead(notif.id)
      chrome.tabs.create({ url: notif.url })
    }
    chrome.notifications.clear(notificationId)
  })
}
