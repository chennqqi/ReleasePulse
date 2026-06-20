import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { parseGithubUrl } from '@/lib/github-api'
import {
  buildWatchingGroups,
  getTotalWatchCount,
  groupNotificationsByTime,
  describeWatchEvents,
} from '@/lib/subscription-utils'
import { formatRelativeTime, getTypeColor, getTypeLabel, cn } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import { StatusBar } from '@/components/StatusBar'
import type { SubscriptionType } from '@/types'
import {
  RefreshCw, Settings, Trash2, ExternalLink, Sparkles,
  ArrowRight, Github, CheckCheck, Plus, ToggleLeft, ToggleRight,
} from 'lucide-react'

type PopupTab = 'feed' | 'watching' | 'add'
type FeedFilter = 'all' | SubscriptionType
type AddMode = 'repo' | 'issue'

/** Popup main component with Feed, Watching, and Add tabs. */
export default function App() {
  const {
    notifications, repoWatches, issueSubscriptions, settings, loading,
    loadData, markRead, markAllRead, clearAll, runCheck,
    upsertWatch, toggleWatch, removeWatch, toggleIssue, removeIssue,
    addIssue, completeOnboarding, updateSettings,
  } = useAppStore()

  const [tab, setTab] = useState<PopupTab>('feed')
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all')
  const [addMode, setAddMode] = useState<AddMode>('repo')
  const [watchReleases, setWatchReleases] = useState(true)
  const [watchTags, setWatchTags] = useState(false)
  const [url, setUrl] = useState('')
  const [addError, setAddError] = useState('')
  const [onboardingStep, setOnboardingStep] = useState(0)

  useEffect(() => {
    loadData()
  }, [loadData])

  const watchCount = getTotalWatchCount(repoWatches, issueSubscriptions)
  const unreadCount = notifications.filter((n) => !n.read).length
  const showOnboarding = !settings.onboardingCompleted && watchCount === 0

  const filteredNotifications = feedFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === feedFilter)

  const timeSections = groupNotificationsByTime(filteredNotifications)
  const watchingGroups = buildWatchingGroups(repoWatches, issueSubscriptions)

  const handleOpenLink = (linkUrl: string, id: string) => {
    chrome.tabs.create({ url: linkUrl })
    markRead(id)
  }

  const handleOpenOptions = () => chrome.runtime.openOptionsPage()
  const handleOpenGithub = () => chrome.tabs.create({ url: 'https://github.com/trending' })

  const handleFinishOnboarding = async (skipToken = false) => {
    if (!skipToken && onboardingStep === 2) {
      await completeOnboarding()
      return
    }
    if (onboardingStep < 2) {
      setOnboardingStep(onboardingStep + 1)
      return
    }
    await completeOnboarding()
  }

  const handleQuickAdd = async () => {
    setAddError('')
    const parsed = parseGithubUrl(url.trim())

    if (addMode === 'issue') {
      if (!parsed?.issueNumber) {
        setAddError('Please enter a valid GitHub issue URL')
        return
      }
      await addIssue({
        owner: parsed.owner,
        repo: parsed.repo,
        issueNumber: parsed.issueNumber,
        label: `${parsed.owner}/${parsed.repo}#${parsed.issueNumber}`,
        enabled: true,
        issueEvents: ['closed', 'reopened'],
      })
      setUrl('')
      setTab('watching')
      return
    }

    let owner = parsed?.owner ?? ''
    let repo = parsed?.repo ?? ''
    if (!owner || !repo) {
      const parts = url.trim().split('/')
      if (parts.length === 2) {
        owner = parts[0]
        repo = parts[1]
      }
    }

    if (!owner || !repo) {
      setAddError('Please enter a valid GitHub repo URL or owner/repo')
      return
    }
    if (!watchReleases && !watchTags) {
      setAddError('Select at least one event type')
      return
    }

    await upsertWatch(owner, repo, { releases: watchReleases, tags: watchTags })
    setUrl('')
    setTab('watching')
  }

  const renderNotification = (notif: typeof notifications[0]) => (
    <div
      key={notif.id}
      className={cn(
        'flex items-start gap-2 px-4 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors',
        !notif.read && 'bg-brand-50',
      )}
      onClick={() => handleOpenLink(notif.url, notif.id)}
    >
      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5', getTypeColor(notif.type))}>
        {getTypeLabel(notif.type)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
        <p className="text-xs text-gray-500 truncate">{notif.body}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(notif.createdAt)}</p>
      </div>
      <ExternalLink size={12} className="text-gray-300 shrink-0 mt-1" />
    </div>
  )

  return (
    <div className="w-[380px] min-h-[360px] bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span className="font-semibold text-sm text-gray-900">ReleasePulse</span>
          {unreadCount > 0 && (
            <span className="bg-brand-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => runCheck()}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600"
            title="Check now"
          >
            <RefreshCw size={15} className={cn(loading && 'animate-spin')} />
          </button>
          <button
            onClick={handleOpenOptions}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600"
            title="Settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {showOnboarding ? (
        <div className="flex-1 px-4 py-5">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mb-3">
              <Sparkles size={24} className="text-brand-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {onboardingStep === 0 && 'Welcome to ReleasePulse'}
              {onboardingStep === 1 && 'Subscribe on GitHub'}
              {onboardingStep === 2 && 'Configure API access'}
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-[280px]">
              {onboardingStep === 0 && 'Get notified about new releases, tags, and issue updates from GitHub repos.'}
              {onboardingStep === 1 && 'Visit any GitHub repo and click Watch with ReleasePulse, or add watches manually.'}
              {onboardingStep === 2 && 'Add a GitHub token to increase API limit from 60 to 5,000 requests/hour.'}
            </p>
          </div>

          {onboardingStep === 2 && (
            <div className="mb-4">
              <input
                type="password"
                value={settings.githubToken}
                onChange={(e) => updateSettings({ githubToken: e.target.value })}
                placeholder="ghp_xxxxxxxxxxxx (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Without a token you may hit rate limits with many watches.
              </p>
            </div>
          )}

          <div className="flex gap-1 justify-center mb-4">
            {[0, 1, 2].map((s) => (
              <span
                key={s}
                className={cn('w-2 h-2 rounded-full', s === onboardingStep ? 'bg-brand-600' : 'bg-gray-300')}
              />
            ))}
          </div>

          {onboardingStep === 1 ? (
            <button
              onClick={handleOpenGithub}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <Github size={16} />
              Explore GitHub repos
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => handleFinishOnboarding(onboardingStep === 2 && !settings.githubToken)}
              className="w-full px-3 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              {onboardingStep === 2 ? (settings.githubToken ? 'Finish setup' : 'Skip for now') : 'Continue'}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex border-b border-gray-200 bg-white">
            {(['feed', 'watching', 'add'] as PopupTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium capitalize transition-colors',
                  tab === t ? 'text-brand-600 border-b-2 border-brand-600' : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'feed' && (
            <>
              {notifications.length > 0 && (
                <div className="flex gap-1 px-3 py-2 bg-white border-b border-gray-100 overflow-x-auto">
                  {(['all', 'github_release', 'github_tag', 'github_issue'] as FeedFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFeedFilter(f)}
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap transition-colors',
                        feedFilter === f ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      {f === 'all' ? 'All' : getTypeLabel(f)}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex-1 max-h-[340px] overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Logo size={32} className="opacity-40 mb-2" />
                    <p className="text-sm">No notifications</p>
                    <p className="text-xs mt-1">Watching {watchCount} item{watchCount !== 1 ? 's' : ''}</p>
                  </div>
                ) : (
                  timeSections.map((section) => (
                    <div key={section.key}>
                      <div className="px-4 py-1.5 bg-gray-100 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                        {section.label}
                      </div>
                      {section.items.map(renderNotification)}
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-200">
                  <button onClick={() => markAllRead()} className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-600">
                    <CheckCheck size={14} /> Mark all read
                  </button>
                  <button onClick={() => clearAll()} className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-500">
                    <Trash2 size={14} /> Clear all
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'watching' && (
            <div className="flex-1 max-h-[380px] overflow-y-auto">
              {watchingGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 px-4">
                  <p className="text-sm">No watches yet</p>
                  <button onClick={() => setTab('add')} className="mt-2 text-xs text-brand-600 hover:underline">
                    Add your first watch
                  </button>
                </div>
              ) : (
                watchingGroups.map((group) => (
                  <div key={group.label} className="px-4 py-3 border-b border-gray-100">
                    <a
                      href={`https://github.com/${group.owner}/${group.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 hover:text-brand-600 flex items-center gap-1 mb-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {group.label}
                      <ExternalLink size={11} className="text-gray-400" />
                    </a>
                    {group.repoWatch && (
                      <div className="flex items-center gap-2 py-1">
                        <span className="text-xs text-gray-500 flex-1">{describeWatchEvents(group.repoWatch)}</span>
                        <span className="text-xs text-gray-400">{formatRelativeTime(group.repoWatch.lastCheckedAt)}</span>
                        <button onClick={() => toggleWatch(group.repoWatch!.id, !group.repoWatch!.enabled)} className="text-gray-400 hover:text-brand-600">
                          {group.repoWatch.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => removeWatch(group.repoWatch!.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                    {group.issues.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2 py-1">
                        <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', getTypeColor('github_issue'))}>
                          Issue
                        </span>
                        <span className="flex-1 text-xs text-gray-400 truncate">{sub.label}</span>
                        <button onClick={() => toggleIssue(sub.id, !sub.enabled)} className="text-gray-400 hover:text-brand-600">
                          {sub.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => removeIssue(sub.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'add' && (
            <div className="flex-1 px-4 py-4 space-y-3">
              <div className="flex gap-2">
                {(['repo', 'issue'] as AddMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setAddMode(m)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors',
                      addMode === m ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    {m === 'repo' ? 'Repository' : 'Issue'}
                  </button>
                ))}
              </div>
              {addMode === 'repo' && (
                <div className="flex gap-3 text-sm">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={watchReleases} onChange={(e) => setWatchReleases(e.target.checked)} className="rounded" />
                    <span>Releases</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={watchTags} onChange={(e) => setWatchTags(e.target.checked)} className="rounded" />
                    <span>Tags</span>
                  </label>
                </div>
              )}
              <div className="relative">
                <Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                  placeholder={
                    addMode === 'issue'
                      ? 'https://github.com/owner/repo/issues/123'
                      : 'https://github.com/owner/repo or owner/repo'
                  }
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              {addError && <p className="text-xs text-red-500">{addError}</p>}
              <button
                onClick={handleQuickAdd}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                <Plus size={16} />
                Add watch
              </button>
              <button onClick={handleOpenOptions} className="w-full text-xs text-gray-500 hover:text-brand-600">
                Open full settings →
              </button>
            </div>
          )}
        </>
      )}

      <StatusBar settings={settings} watchCount={watchCount} />
    </div>
  )
}
