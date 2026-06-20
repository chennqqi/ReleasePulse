import type { RepoWatch, Subscription, NotificationRecord } from '@/types'

/** A repo-centric view combining RepoWatch and issue subscriptions. */
export interface WatchingGroup {
  owner: string
  repo: string
  label: string
  repoWatch?: RepoWatch
  issues: Subscription[]
}

/** Build watching groups from repo watches and issue subscriptions. */
export function buildWatchingGroups(
  repoWatches: RepoWatch[],
  issueSubscriptions: Subscription[],
): WatchingGroup[] {
  const map = new Map<string, WatchingGroup>()

  for (const watch of repoWatches) {
    const key = `${watch.owner}/${watch.repo}`
    map.set(key, {
      owner: watch.owner,
      repo: watch.repo,
      label: watch.label,
      repoWatch: watch,
      issues: [],
    })
  }

  for (const sub of issueSubscriptions) {
    const key = `${sub.owner}/${sub.repo}`
    if (!map.has(key)) {
      map.set(key, {
        owner: sub.owner,
        repo: sub.repo,
        label: `${sub.owner}/${sub.repo}`,
        issues: [],
      })
    }
    map.get(key)!.issues.push(sub)
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
}

/** Count total watches (repo watches + issue subscriptions). */
export function getTotalWatchCount(
  repoWatches: RepoWatch[],
  issueSubscriptions: Subscription[],
): number {
  return repoWatches.length + issueSubscriptions.length
}

/** A time-grouped section of notifications for the Feed view. */
export interface NotificationTimeSection {
  key: 'today' | 'yesterday' | 'earlier'
  label: string
  items: NotificationRecord[]
}

/** Group notifications by Today / Yesterday / Earlier. */
export function groupNotificationsByTime(
  notifications: NotificationRecord[],
): NotificationTimeSection[] {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const today: NotificationRecord[] = []
  const yesterday: NotificationRecord[] = []
  const earlier: NotificationRecord[] = []

  for (const notif of notifications) {
    const date = new Date(notif.createdAt)
    if (date >= todayStart) today.push(notif)
    else if (date >= yesterdayStart) yesterday.push(notif)
    else earlier.push(notif)
  }

  const sections: NotificationTimeSection[] = []
  if (today.length > 0) sections.push({ key: 'today', label: 'Today', items: today })
  if (yesterday.length > 0) sections.push({ key: 'yesterday', label: 'Yesterday', items: yesterday })
  if (earlier.length > 0) sections.push({ key: 'earlier', label: 'Earlier', items: earlier })
  return sections
}

/** Format API remaining count for display. */
export function formatApiRemaining(remaining: number | null, token: string): string {
  if (remaining === null) return 'API: —'
  const limit = token ? 5000 : 60
  return `API: ${remaining}/${limit}`
}

/** Format last sync time for the status bar. */
export function formatSyncStatus(lastSyncAt: string | null): string {
  if (!lastSyncAt) return 'Not synced yet'
  const diffMin = Math.floor((Date.now() - new Date(lastSyncAt).getTime()) / 60000)
  if (diffMin < 1) return 'Synced just now'
  if (diffMin < 60) return `Synced ${diffMin}m ago`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `Synced ${diffHour}h ago`
  return `Synced ${new Date(lastSyncAt).toLocaleDateString()}`
}

/** Describe active events on a repo watch. */
export function describeWatchEvents(watch: RepoWatch): string {
  const parts: string[] = []
  if (watch.events.releases) parts.push('Releases')
  if (watch.events.tags) parts.push('Tags')
  return parts.join(' · ') || 'No events'
}
