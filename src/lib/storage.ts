import type { RepoWatch, Subscription, NotificationRecord, Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { migrateIfNeeded } from './migrate'

const REPO_WATCHES_KEY = 'repoWatches'
const ISSUE_SUBS_KEY = 'issueSubscriptions'
const NOTIFICATIONS_KEY = 'notifications'
const SETTINGS_KEY = 'settings'

/** Generate a unique ID. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Retrieve all repo watches from storage. */
export async function getRepoWatches(): Promise<RepoWatch[]> {
  await migrateIfNeeded()
  const result = await chrome.storage.local.get(REPO_WATCHES_KEY)
  return (result[REPO_WATCHES_KEY] as RepoWatch[]) ?? []
}

/** Save all repo watches to storage. */
export async function saveRepoWatches(watches: RepoWatch[]): Promise<void> {
  await chrome.storage.local.set({ [REPO_WATCHES_KEY]: watches })
}

/** Add a repo watch. */
export async function addRepoWatch(watch: RepoWatch): Promise<void> {
  const watches = await getRepoWatches()
  watches.push(watch)
  await saveRepoWatches(watches)
}

/** Remove a repo watch by ID. */
export async function removeRepoWatch(id: string): Promise<void> {
  const watches = await getRepoWatches()
  await saveRepoWatches(watches.filter((w) => w.id !== id))
}

/** Update a repo watch by ID with partial data. */
export async function updateRepoWatch(id: string, patch: Partial<RepoWatch>): Promise<void> {
  const watches = await getRepoWatches()
  const idx = watches.findIndex((w) => w.id === id)
  if (idx === -1) return
  watches[idx] = { ...watches[idx], ...patch }
  await saveRepoWatches(watches)
}

/** Create or merge a repo watch for the given owner/repo. */
export async function upsertRepoWatch(
  owner: string,
  repo: string,
  events: { releases: boolean; tags: boolean },
): Promise<RepoWatch> {
  const watches = await getRepoWatches()
  const existing = watches.find((w) => w.owner === owner && w.repo === repo)

  if (existing) {
    const mergedEvents = {
      releases: existing.events.releases || events.releases,
      tags: existing.events.tags || events.tags,
    }
    const updated = { ...existing, events: mergedEvents, enabled: true }
    await updateRepoWatch(existing.id, { events: mergedEvents, enabled: true })
    return updated
  }

  const watch: RepoWatch = {
    id: generateId(),
    owner,
    repo,
    label: `${owner}/${repo}`,
    events,
    lastCheckedAt: null,
    lastSeenReleaseId: null,
    lastSeenTagSha: null,
    enabled: true,
    createdAt: new Date().toISOString(),
  }
  await addRepoWatch(watch)
  return watch
}

/** Retrieve all issue subscriptions from storage. */
export async function getIssueSubscriptions(): Promise<Subscription[]> {
  await migrateIfNeeded()
  const result = await chrome.storage.local.get(ISSUE_SUBS_KEY)
  return (result[ISSUE_SUBS_KEY] as Subscription[]) ?? []
}

/** Save all issue subscriptions to storage. */
export async function saveIssueSubscriptions(subs: Subscription[]): Promise<void> {
  await chrome.storage.local.set({ [ISSUE_SUBS_KEY]: subs })
}

/** Add an issue subscription. */
export async function addIssueSubscription(sub: Subscription): Promise<void> {
  const subs = await getIssueSubscriptions()
  subs.push(sub)
  await saveIssueSubscriptions(subs)
}

/** Remove an issue subscription by ID. */
export async function removeIssueSubscription(id: string): Promise<void> {
  const subs = await getIssueSubscriptions()
  await saveIssueSubscriptions(subs.filter((s) => s.id !== id))
}

/** Update an issue subscription by ID with partial data. */
export async function updateIssueSubscription(
  id: string,
  patch: Partial<Subscription>,
): Promise<void> {
  const subs = await getIssueSubscriptions()
  const idx = subs.findIndex((s) => s.id === id)
  if (idx === -1) return
  subs[idx] = { ...subs[idx], ...patch }
  await saveIssueSubscriptions(subs)
}

/** Retrieve all notifications from storage. */
export async function getNotifications(): Promise<NotificationRecord[]> {
  const result = await chrome.storage.local.get(NOTIFICATIONS_KEY)
  return (result[NOTIFICATIONS_KEY] as NotificationRecord[]) ?? []
}

/** Save all notifications to storage. */
export async function saveNotifications(notifications: NotificationRecord[]): Promise<void> {
  await chrome.storage.local.set({ [NOTIFICATIONS_KEY]: notifications })
}

/** Add new notification records. */
export async function addNotifications(newNotifs: NotificationRecord[]): Promise<void> {
  if (newNotifs.length === 0) return
  const existing = await getNotifications()
  const combined = [...newNotifs, ...existing]
  const trimmed = combined.slice(0, 200)
  await saveNotifications(trimmed)
}

/** Mark a notification as read. */
export async function markNotificationRead(id: string): Promise<void> {
  const notifs = await getNotifications()
  const idx = notifs.findIndex((n) => n.id === id)
  if (idx === -1) return
  notifs[idx].read = true
  await saveNotifications(notifs)
}

/** Mark all notifications as read. */
export async function markAllNotificationsRead(): Promise<void> {
  const notifs = await getNotifications()
  const updated = notifs.map((n) => ({ ...n, read: true }))
  await saveNotifications(updated)
}

/** Clear all notifications. */
export async function clearNotifications(): Promise<void> {
  await saveNotifications([])
}

/** Retrieve settings from storage, merged with defaults. */
export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY)
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as Partial<Settings> ?? {}) }
}

/** Save settings to storage. */
export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings })
}

/** Get unread notification count. */
export async function getUnreadCount(): Promise<number> {
  const notifs = await getNotifications()
  return notifs.filter((n) => !n.read).length
}

/** Count total active watches (repo watches + issue subscriptions). */
export async function getWatchCount(): Promise<number> {
  const [watches, issues] = await Promise.all([getRepoWatches(), getIssueSubscriptions()])
  return watches.length + issues.length
}
