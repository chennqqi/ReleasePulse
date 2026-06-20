import { create } from 'zustand'
import type { RepoWatch, Subscription, NotificationRecord, Settings, IssueEvent } from '@/types'
import {
  getRepoWatches,
  removeRepoWatch,
  updateRepoWatch,
  upsertRepoWatch,
  getIssueSubscriptions,
  addIssueSubscription,
  removeIssueSubscription,
  updateIssueSubscription,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
  getSettings,
  saveSettings,
  generateId,
} from '@/lib/storage'
import { setLocale, detectLocale, type Locale } from '@/i18n'

/** Resolve the effective locale from a settings.language value. */
function resolveLocale(language: Settings['language']): Locale {
  if (language === 'auto' || !language) return detectLocale()
  return language
}

interface AppStore {
  repoWatches: RepoWatch[]
  issueSubscriptions: Subscription[]
  notifications: NotificationRecord[]
  settings: Settings
  loading: boolean

  loadData: () => Promise<void>
  upsertWatch: (owner: string, repo: string, events: { releases: boolean; tags: boolean }) => Promise<void>
  updateWatchEvents: (id: string, events: { releases: boolean; tags: boolean }) => Promise<void>
  removeWatch: (id: string) => Promise<void>
  toggleWatch: (id: string, enabled: boolean) => Promise<void>
  addIssue: (sub: Omit<Subscription, 'id' | 'type' | 'createdAt' | 'lastCheckedAt' | 'lastSeenId'>) => Promise<void>
  removeIssue: (id: string) => Promise<void>
  toggleIssue: (id: string, enabled: boolean) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  clearAll: () => Promise<void>
  updateSettings: (patch: Partial<Settings>) => Promise<void>
  completeOnboarding: () => Promise<void>
  runCheck: () => Promise<void>
}

export const useAppStore = create<AppStore>((set, get) => ({
  repoWatches: [],
  issueSubscriptions: [],
  notifications: [],
  settings: {
    githubToken: '',
    pollIntervalMinutes: 15,
    desktopNotifications: true,
    onboardingCompleted: false,
    lastSyncAt: null,
    apiRemaining: null,
    language: 'auto',
    syncError: null,
  },
  loading: false,

  loadData: async () => {
    set({ loading: true })
    const [repoWatches, issueSubscriptions, notifications, settings] = await Promise.all([
      getRepoWatches(),
      getIssueSubscriptions(),
      getNotifications(),
      getSettings(),
    ])
    setLocale(resolveLocale(settings.language))
    set({ repoWatches, issueSubscriptions, notifications, settings, loading: false })
  },

  upsertWatch: async (owner, repo, events) => {
    const watch = await upsertRepoWatch(owner, repo, events)
    const watches = await getRepoWatches()
    set({ repoWatches: watches.length ? watches : [watch] })
    await get().loadData()
  },

  updateWatchEvents: async (id, events) => {
    const watch = get().repoWatches.find((w) => w.id === id)
    if (!watch) return

    if (!events.releases && !events.tags) {
      await removeRepoWatch(id)
      set({ repoWatches: get().repoWatches.filter((w) => w.id !== id) })
      return
    }

    await updateRepoWatch(id, { events })
    set({
      repoWatches: get().repoWatches.map((w) =>
        w.id === id ? { ...w, events } : w,
      ),
    })
  },

  removeWatch: async (id) => {
    await removeRepoWatch(id)
    set({ repoWatches: get().repoWatches.filter((w) => w.id !== id) })
  },

  toggleWatch: async (id, enabled) => {
    await updateRepoWatch(id, { enabled })
    set({
      repoWatches: get().repoWatches.map((w) =>
        w.id === id ? { ...w, enabled } : w,
      ),
    })
  },

  addIssue: async (sub) => {
    const newSub: Subscription = {
      ...sub,
      id: generateId(),
      type: 'github_issue',
      createdAt: new Date().toISOString(),
      lastCheckedAt: null,
      lastSeenId: null,
    }
    await addIssueSubscription(newSub)
    set({ issueSubscriptions: [...get().issueSubscriptions, newSub] })
  },

  removeIssue: async (id) => {
    await removeIssueSubscription(id)
    set({ issueSubscriptions: get().issueSubscriptions.filter((s) => s.id !== id) })
  },

  toggleIssue: async (id, enabled) => {
    await updateIssueSubscription(id, { enabled })
    set({
      issueSubscriptions: get().issueSubscriptions.map((s) =>
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
    const remaining = await getNotifications()
    set({ notifications: remaining })
  },

  updateSettings: async (patch) => {
    const newSettings = { ...get().settings, ...patch }
    await saveSettings(newSettings)
    if (patch.language) setLocale(resolveLocale(patch.language))
    set({ settings: newSettings })
    chrome.runtime.sendMessage({ type: 'UPDATE_ALARM' })
  },

  completeOnboarding: async () => {
    const newSettings = { ...get().settings, onboardingCompleted: true }
    await saveSettings(newSettings)
    set({ settings: newSettings })
  },

  runCheck: async () => {
    chrome.runtime.sendMessage({ type: 'RUN_CHECK' })
    setTimeout(() => get().loadData(), 2000)
  },
}))

export type { IssueEvent }
