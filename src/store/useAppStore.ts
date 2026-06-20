import { create } from 'zustand'
import type { Subscription, NotificationRecord, Settings } from '@/types'
import {
  getSubscriptions,
  addSubscription,
  removeSubscription,
  updateSubscription,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
  getSettings,
  saveSettings,
  generateId,
} from '@/lib/storage'

interface AppStore {
  subscriptions: Subscription[]
  notifications: NotificationRecord[]
  settings: Settings
  loading: boolean

  loadData: () => Promise<void>
  addSub: (sub: Omit<Subscription, 'id' | 'createdAt' | 'lastCheckedAt' | 'lastSeenId'>) => Promise<void>
  removeSub: (id: string) => Promise<void>
  toggleSub: (id: string, enabled: boolean) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  clearAll: () => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  runCheck: () => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  subscriptions: [],
  notifications: [],
  settings: { githubToken: '', pollIntervalMinutes: 15, desktopNotifications: true },
  loading: false,

  loadData: async () => {
    set({ loading: true })
    const [subscriptions, notifications, settings] = await Promise.all([
      getSubscriptions(),
      getNotifications(),
      getSettings(),
    ])
    set({ subscriptions, notifications, settings, loading: false })
  },

  addSub: async (sub) => {
    const newSub: Subscription = {
      ...sub,
      id: generateId(),
      createdAt: new Date().toISOString(),
      lastCheckedAt: null,
      lastSeenId: null,
    }
    await addSubscription(newSub)
    set({ subscriptions: [...get().subscriptions, newSub] })
  },

  removeSub: async (id) => {
    await removeSubscription(id)
    set({ subscriptions: get().subscriptions.filter((s) => s.id !== id) })
  },

  toggleSub: async (id, enabled) => {
    await updateSubscription(id, { enabled })
    set({
      subscriptions: get().subscriptions.map((s) =>
        s.id === id ? { ...s, enabled } : s,
      ),
    })
  },

  markRead: async (id) => {
    await markNotificationRead(id)
    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })
  },

  markAllRead: async () => {
    await markAllNotificationsRead()
    set({
      notifications: get().notifications.map((n) => ({ ...n, read: true })),
    })
  },

  clearAll: async () => {
    await clearNotifications()
    set({ notifications: [] })
  },

  updateSettings: async (patch) => {
    const newSettings = { ...get().settings, ...patch }
    await saveSettings(newSettings)
    set({ settings: newSettings })
    // Notify background to update alarm
    chrome.runtime.sendMessage({ type: 'UPDATE_ALARM' })
  },

  runCheck: async () => {
    chrome.runtime.sendMessage({ type: 'RUN_CHECK' })
    // Reload data after a short delay
    setTimeout(() => get().loadData(), 2000)
  },
}))
