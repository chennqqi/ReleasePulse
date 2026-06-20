import type { Subscription, NotificationRecord, Settings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

const SUBSCRIPTIONS_KEY = 'subscriptions'
const NOTIFICATIONS_KEY = 'notifications'
const SETTINGS_KEY = 'settings'

/** Generate a unique ID. */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Retrieve all subscriptions from storage. */
export async function getSubscriptions(): Promise<Subscription[]> {
  const result = await chrome.storage.local.get(SUBSCRIPTIONS_KEY)
  return (result[SUBSCRIPTIONS_KEY] as Subscription[]) ?? []
}

/** Save all subscriptions to storage. */
export async function saveSubscriptions(subscriptions: Subscription[]): Promise<void> {
  await chrome.storage.local.set({ [SUBSCRIPTIONS_KEY]: subscriptions })
}

/** Add a single subscription. */
export async function addSubscription(sub: Subscription): Promise<void> {
  const subs = await getSubscriptions()
  subs.push(sub)
  await saveSubscriptions(subs)
}

/** Remove a subscription by ID. */
export async function removeSubscription(id: string): Promise<void> {
  const subs = await getSubscriptions()
  const filtered = subs.filter((s) => s.id !== id)
  await saveSubscriptions(filtered)
}

/** Update a subscription by ID with partial data. */
export async function updateSubscription(
  id: string,
  patch: Partial<Subscription>,
): Promise<void> {
  const subs = await getSubscriptions()
  const idx = subs.findIndex((s) => s.id === id)
  if (idx === -1) return
  subs[idx] = { ...subs[idx], ...patch }
  await saveSubscriptions(subs)
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
export async function addNotifications(
  newNotifs: NotificationRecord[],
): Promise<void> {
  if (newNotifs.length === 0) return
  const existing = await getNotifications()
  const combined = [...newNotifs, ...existing]
  // Keep at most 200 notifications
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
