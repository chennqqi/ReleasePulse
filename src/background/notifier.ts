import {
  getRepoWatches,
  updateRepoWatch,
  getIssueSubscriptions,
  updateIssueSubscription,
  getSettings,
  addNotifications,
  getUnreadCount,
  saveSettings,
} from '@/lib/storage'
import {
  checkRepoWatch,
  checkIssueSubscription,
  createRepoWatchNotificationRecords,
  createIssueNotificationRecords,
} from './checker'
import { RateLimitError, fetchRateLimit } from '@/lib/github-api'

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

/** Run a full check cycle across all enabled watches. */
export async function runCheckCycle(): Promise<void> {
  console.log('[ReleasePulse] Starting check cycle')
  const settings = await getSettings()
  const [repoWatches, issueSubs] = await Promise.all([
    getRepoWatches(),
    getIssueSubscriptions(),
  ])

  const enabledWatches = repoWatches.filter((w) => w.enabled)
  const enabledIssues = issueSubs.filter((s) => s.enabled)

  if (enabledWatches.length === 0 && enabledIssues.length === 0) {
    console.log('[ReleasePulse] No enabled watches, skipping')
    return
  }

  let totalNewNotifications = 0

  for (const watch of enabledWatches) {
    try {
      const result = await checkRepoWatch(watch, settings.githubToken)

      await updateRepoWatch(watch.id, {
        lastSeenReleaseId: result.lastSeenReleaseId,
        lastSeenTagSha: result.lastSeenTagSha,
        lastCheckedAt: new Date().toISOString(),
      })

      if (result.notifications.length > 0) {
        const records = createRepoWatchNotificationRecords(watch.id, result.notifications)
        await addNotifications(records)
        totalNewNotifications += records.length

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
      console.error(`[ReleasePulse] Error checking ${watch.label}:`, err)
    }
  }

  for (const sub of enabledIssues) {
    try {
      const result = await checkIssueSubscription(sub, settings.githubToken)

      if (result.hasUpdate || result.newId !== sub.lastSeenId) {
        await updateIssueSubscription(sub.id, {
          lastSeenId: result.newId,
          lastCheckedAt: new Date().toISOString(),
        })
      } else {
        await updateIssueSubscription(sub.id, {
          lastCheckedAt: new Date().toISOString(),
        })
      }

      if (result.notifications.length > 0) {
        const records = createIssueNotificationRecords(sub.id, result)
        await addNotifications(records)
        totalNewNotifications += records.length

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

  const unreadCount = await getUnreadCount()
  const badgeText = unreadCount > 0 ? unreadCount.toString() : ''
  const badgeColor = unreadCount > 0 ? '#4338ca' : '#6b7280'
  chrome.action.setBadgeText({ text: badgeText })
  chrome.action.setBadgeBackgroundColor({ color: badgeColor })

  try {
    const rateLimit = await fetchRateLimit(settings.githubToken)
    await saveSettings({
      ...settings,
      lastSyncAt: new Date().toISOString(),
      apiRemaining: rateLimit.remaining,
    })
  } catch (err) {
    console.error('[ReleasePulse] Failed to update sync status:', err)
    await saveSettings({
      ...settings,
      lastSyncAt: new Date().toISOString(),
    })
  }

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
