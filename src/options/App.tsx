import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { parseGithubUrl } from '@/lib/github-api'
import {
  buildWatchingGroups,
  getTotalWatchCount,
  formatApiRemaining,
  formatSyncStatus,
  describeWatchEvents,
} from '@/lib/subscription-utils'
import { formatRelativeTime, getTypeColor, getTypeLabel, cn } from '@/lib/utils'
import { Logo } from '@/components/Logo'
import { t, getSupportedLocales } from '@/i18n'
import type { IssueEvent, Settings } from '@/types'
import {
  Bell, Plus, Trash2, RefreshCw, Key, Clock, Github,
  ToggleLeft, ToggleRight, ExternalLink, Info,
} from 'lucide-react'

type OptionsPage = 'watching' | 'settings' | 'about'
type AddMode = 'repo' | 'issue'

/** Options page with sidebar navigation. */
export default function App() {
  const navItems: { id: OptionsPage; label: string; icon: typeof Bell }[] = [
    { id: 'watching', label: t('options.nav.watching'), icon: Bell },
    { id: 'settings', label: t('options.nav.settings'), icon: Key },
    { id: 'about', label: t('options.nav.about'), icon: Info },
  ]
  const {
    repoWatches, issueSubscriptions, settings, loading,
    loadData, upsertWatch, updateWatchEvents, removeWatch, toggleWatch,
    addIssue, removeIssue, toggleIssue, updateSettings, runCheck,
  } = useAppStore()

  const [page, setPage] = useState<OptionsPage>('watching')
  const [addMode, setAddMode] = useState<AddMode>('repo')
  const [watchReleases, setWatchReleases] = useState(true)
  const [watchTags, setWatchTags] = useState(false)
  const [url, setUrl] = useState('')
  const [issueEvents, setIssueEvents] = useState<IssueEvent[]>(['closed', 'reopened'])
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [loadData])

  const watchCount = getTotalWatchCount(repoWatches, issueSubscriptions)
  const watchingGroups = buildWatchingGroups(repoWatches, issueSubscriptions)

  const handleAdd = async () => {
    setError('')
    const parsed = parseGithubUrl(url.trim())

    if (addMode === 'issue') {
      if (!parsed?.issueNumber) {
        setError(t('options.watching.errorInvalidIssueUrl'))
        return
      }
      await addIssue({
        owner: parsed.owner,
        repo: parsed.repo,
        issueNumber: parsed.issueNumber,
        label: `${parsed.owner}/${parsed.repo}#${parsed.issueNumber}`,
        enabled: true,
        issueEvents,
      })
      setUrl('')
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
      setError(t('options.watching.errorInvalidRepoUrl'))
      return
    }
    if (!watchReleases && !watchTags) {
      setError(t('options.watching.errorSelectEvent'))
      return
    }

    await upsertWatch(owner, repo, { releases: watchReleases, tags: watchTags })
    setUrl('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-52 bg-white border-r border-gray-200 shrink-0">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-200">
          <Logo size={24} />
          <span className="font-semibold text-gray-900">ReleasePulse</span>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                page === id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 max-w-3xl">
        {page === 'watching' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">{t('options.watching.title', { count: watchCount })}</h1>
              <button onClick={() => runCheck()} className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
                <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
                {t('common.checkNow')}
              </button>
            </div>

            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Plus size={16} className="text-brand-600" />
                {t('options.watching.addWatch')}
              </h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['repo', 'issue'] as AddMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setAddMode(m)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
                        addMode === m ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                      )}
                    >
                      {m === 'repo' ? t('common.repository') : t('common.issue')}
                    </button>
                  ))}
                </div>
                {addMode === 'repo' && (
                  <div className="flex gap-4 text-sm">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={watchReleases} onChange={(e) => setWatchReleases(e.target.checked)} className="rounded" />
                      <span>{t('common.releases')}</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={watchTags} onChange={(e) => setWatchTags(e.target.checked)} className="rounded" />
                      <span>{t('common.tags')}</span>
                    </label>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                      placeholder={
                        addMode === 'issue'
                          ? 'https://github.com/owner/repo/issues/123'
                          : 'https://github.com/owner/repo or owner/repo'
                      }
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                  >
                    {t('common.add')}
                  </button>
                </div>
                {addMode === 'issue' && (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">{t('common.notifyOn')}</span>
                    {(['closed', 'reopened', 'labeled', 'unlabeled'] as IssueEvent[]).map((evt) => (
                      <label key={evt} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={issueEvents.includes(evt)}
                          onChange={(e) => {
                            if (e.target.checked) setIssueEvents([...issueEvents, evt])
                            else setIssueEvents(issueEvents.filter((x) => x !== evt))
                          }}
                          className="rounded"
                        />
                        <span className="text-gray-700">{evt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
            </section>

            <section className="bg-white rounded-lg border border-gray-200 p-5">
              {watchingGroups.length === 0 ? (
                <p className="text-gray-400 text-sm py-6 text-center">
                  {t('options.watching.noWatches')}
                </p>
              ) : (
                <div className="space-y-4">
                  {watchingGroups.map((group) => (
                    <div key={group.label} className="border border-gray-200 rounded-lg p-4">
                      <a
                        href={`https://github.com/${group.owner}/${group.repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-gray-900 hover:text-brand-600 flex items-center gap-1 mb-3"
                      >
                        {group.label}
                        <ExternalLink size={12} className="text-gray-400" />
                      </a>

                      {group.repoWatch && (
                        <div className="flex items-center gap-3 py-2 border-b border-gray-100 mb-2">
                          <div className="flex-1 flex gap-3 text-sm">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={group.repoWatch.events.releases}
                                onChange={(e) => updateWatchEvents(group.repoWatch!.id, {
                                  releases: e.target.checked,
                                  tags: group.repoWatch!.events.tags,
                                })}
                                className="rounded"
                              />
                              <span>{t('common.releases')}</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={group.repoWatch.events.tags}
                                onChange={(e) => updateWatchEvents(group.repoWatch!.id, {
                                  releases: group.repoWatch!.events.releases,
                                  tags: e.target.checked,
                                })}
                                className="rounded"
                              />
                              <span>{t('common.tags')}</span>
                            </label>
                          </div>
                          <span className="text-xs text-gray-400 hidden sm:inline">
                            {describeWatchEvents(group.repoWatch)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(group.repoWatch.lastCheckedAt)}
                          </span>
                          <button onClick={() => toggleWatch(group.repoWatch!.id, !group.repoWatch!.enabled)} className="text-gray-400 hover:text-brand-600">
                            {group.repoWatch.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                          </button>
                          <button onClick={() => removeWatch(group.repoWatch!.id)} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}

                      {group.issues.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-3 py-1.5">
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded shrink-0', getTypeColor('github_issue'))}>
                            {getTypeLabel('github_issue')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 truncate">{sub.label}</p>
                            <p className="text-xs text-gray-400">{t('common.lastChecked', { time: formatRelativeTime(sub.lastCheckedAt) })}</p>
                          </div>
                          <button onClick={() => toggleIssue(sub.id, !sub.enabled)} className="text-gray-400 hover:text-brand-600">
                            {sub.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                          </button>
                          <button onClick={() => removeIssue(sub.id)} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {page === 'settings' && (
          <div className="space-y-6">
            <h1 className="text-xl font-semibold text-gray-900">{t('options.settings.title')}</h1>
            <div className="bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm text-brand-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {formatSyncStatus(settings.lastSyncAt)}
              </span>
              <span>{formatApiRemaining(settings.apiRemaining, settings.githubToken)}</span>
            </div>
            <section className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('options.settings.language')}</label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSettings({ language: e.target.value as Settings['language'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="auto">{t('options.settings.languageAuto')}</option>
                  {getSupportedLocales().map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('options.settings.token')}</label>
                <input
                  type="password"
                  value={settings.githubToken}
                  onChange={(e) => updateSettings({ githubToken: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxx (optional but recommended)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t('options.settings.tokenHint')}{' '}
                  <a href="https://github.com/settings/tokens/new?description=ReleasePulse&scopes=repo" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                    {t('options.settings.createToken')}
                  </a>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={14} className="inline mr-1" />
                  {t('options.settings.checkInterval')}
                </label>
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={settings.pollIntervalMinutes}
                  onChange={(e) => updateSettings({ pollIntervalMinutes: parseInt(e.target.value, 10) || 15 })}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="desktopNotif"
                  checked={settings.desktopNotifications}
                  onChange={(e) => updateSettings({ desktopNotifications: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="desktopNotif" className="text-sm text-gray-700 cursor-pointer">
                  {t('options.settings.desktopNotif')}
                </label>
              </div>
            </section>
          </div>
        )}

        {page === 'about' && (
          <div className="space-y-6">
            <h1 className="text-xl font-semibold text-gray-900">{t('options.about.title')}</h1>
            <section className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <Logo size={40} />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">ReleasePulse</h2>
                  <p className="text-sm text-gray-500">{t('app.version', { version: '0.1.0' })}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('options.about.description')}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>• {t('options.about.feature1')}</li>
                <li>• {t('options.about.feature2')}</li>
                <li>• {t('options.about.feature3')}</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a
                  href="https://github.com/chennqqi/ReleasePulse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700"
                >
                  <Github size={14} />
                  github.com/chennqqi/ReleasePulse
                  <ExternalLink size={12} className="text-gray-400" />
                </a>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
