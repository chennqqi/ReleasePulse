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
import { classifySyncError } from '@/lib/sync-error'
import { showDesktopNotification, updateActionBadge } from '@/lib/browser'

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
  let syncError: typeof settings.syncError = null

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
        const added = await addNotifications(records)
        totalNewNotifications += added

        if (settings.desktopNotifications && added > 0) {
          for (const record of records.slice(0, added)) {
            showDesktopNotification(record.id, {
              title: record.title,
              message: record.body,
            })
          }
        }
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        syncError = 'rate_limit'
        console.error('[ReleasePulse] Rate limit hit, stopping cycle')
        break
      }
      syncError = classifySyncError(err)
      console.error(`[ReleasePulse] Error checking ${watch.label}:`, err)
    }
  }

  if (syncError !== 'rate_limit') {
    for (const sub of enabledIssues) {
      try {
        const result = await checkIssueSubscription(sub, settings.githubToken)

        await updateIssueSubscription(sub.id, {
          lastSeenId: result.newId,
          lastCheckedAt: new Date().toISOString(),
        })

        if (result.notifications.length > 0) {
          const records = createIssueNotificationRecords(sub.id, result)
          const added = await addNotifications(records)
          totalNewNotifications += added

          if (settings.desktopNotifications && added > 0) {
            for (const record of records.slice(0, added)) {
              showDesktopNotification(record.id, {
                title: record.title,
                message: record.body,
              })
            }
          }
        }
      } catch (err) {
        if (err instanceof RateLimitError) {
          syncError = 'rate_limit'
          console.error('[ReleasePulse] Rate limit hit, stopping cycle')
          break
        }
        syncError = classifySyncError(err)
        console.error(`[ReleasePulse] Error checking ${sub.label}:`, err)
      }
    }
  }

  const unreadCount = await getUnreadCount()
  updateActionBadge(unreadCount)

  const patch: Partial<typeof settings> = {
    lastSyncAt: new Date().toISOString(),
    syncError,
  }

  try {
    const rateLimit = await fetchRateLimit(settings.githubToken)
    patch.apiRemaining = rateLimit.remaining
  } catch (err) {
    console.error('[ReleasePulse] Failed to update sync status:', err)
    if (!syncError) {
      syncError = classifySyncError(err)
      patch.syncError = syncError
    }
  }

  await saveSettings({ ...settings, ...patch })

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
