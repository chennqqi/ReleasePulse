import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { parseGithubUrl } from '@/lib/github-api'
import { formatRelativeTime, getTypeColor, getTypeLabel, cn } from '@/lib/utils'
import type { SubscriptionType, IssueEvent } from '@/types'
import {
  Bell, Plus, Trash2, RefreshCw, Key, Clock, Github,
  ToggleLeft, ToggleRight, ExternalLink, Sparkles, ArrowRight, MousePointerClick,
} from 'lucide-react'

/** Options page - manage subscriptions and settings. */
export default function App() {
  const {
    subscriptions, settings, loading,
    loadData, addSub, removeSub, toggleSub, updateSettings, runCheck,
  } = useAppStore()

  const [url, setUrl] = useState('')
  const [subType, setSubType] = useState<SubscriptionType>('github_release')
  const [issueEvents, setIssueEvents] = useState<IssueEvent[]>(['closed', 'reopened'])
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [loadData])

  /** Handle adding a new subscription. */
  const handleAdd = async () => {
    setError('')

    if (subType === 'github_issue') {
      // For issue subscriptions, parse issue URL
      const parsed = parseGithubUrl(url.trim())
      if (!parsed || !parsed.issueNumber) {
        setError('Please enter a valid GitHub issue URL (e.g. https://github.com/owner/repo/issues/123)')
        return
      }
      await addSub({
        type: 'github_issue',
        owner: parsed.owner,
        repo: parsed.repo,
        issueNumber: parsed.issueNumber,
        label: `${parsed.owner}/${parsed.repo}#${parsed.issueNumber}`,
        enabled: true,
        issueEvents,
      })
    } else {
      // For release/tag subscriptions, parse repo URL or owner/repo
      const parsed = parseGithubUrl(url.trim())
      let owner = ''
      let repo = ''

      if (parsed) {
        owner = parsed.owner
        repo = parsed.repo
      } else {
        const parts = url.trim().split('/')
        if (parts.length === 2) {
          owner = parts[0]
          repo = parts[1]
        }
      }

      if (!owner || !repo) {
        setError('Please enter a valid GitHub repo URL or owner/repo')
        return
      }

      await addSub({
        type: subType,
        owner,
        repo,
        label: `${owner}/${repo}`,
        enabled: true,
      })
    }

    setUrl('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-600 text-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Bell size={22} />
          <h1 className="text-xl font-semibold">ReleasePulse</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* First-time onboarding banner */}
        {subscriptions.length === 0 && (
          <section className="bg-gradient-to-br from-brand-50 to-blue-50 rounded-lg border border-brand-200 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center shrink-0">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Welcome to ReleasePulse!</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Subscribe to GitHub repos and get notified about new releases, tags, and issue updates.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-gray-200">
                <MousePointerClick size={18} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Subscribe on GitHub</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Visit any GitHub repo and click the <span className="font-medium text-brand-600">Subscribe</span> button.
                  </p>
                  <a
                    href="https://github.com/trending"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mt-1"
                  >
                    Browse GitHub <ArrowRight size={12} />
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-white rounded-lg p-3 border border-gray-200">
                <Plus size={18} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Add manually below</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Enter a repo URL or <code className="text-xs bg-gray-100 px-1 rounded">owner/repo</code> in the form below.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Add Subscription */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus size={18} className="text-brand-600" />
            Add Subscription
          </h2>

          <div className="space-y-3">
            {/* Type selector */}
            <div className="flex gap-2">
              {(['github_release', 'github_tag', 'github_issue'] as SubscriptionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setSubType(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    subType === t
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {getTypeLabel(t)}
                </button>
              ))}
            </div>

            {/* URL input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder={
                    subType === 'github_issue'
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
                Add
              </button>
            </div>

            {/* Issue event selectors */}
            {subType === 'github_issue' && (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">Notify on:</span>
                {(['closed', 'reopened', 'labeled', 'unlabeled'] as IssueEvent[]).map((evt) => (
                  <label key={evt} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={issueEvents.includes(evt)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIssueEvents([...issueEvents, evt])
                        } else {
                          setIssueEvents(issueEvents.filter((x) => x !== evt))
                        }
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

        {/* Subscriptions List */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Bell size={18} className="text-brand-600" />
              Subscriptions ({subscriptions.length})
            </h2>
            <button
              onClick={() => runCheck()}
              className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
            >
              <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
              Check now
            </button>
          </div>

          {subscriptions.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">
              No subscriptions yet. Add one above to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded shrink-0',
                      getTypeColor(sub.type),
                    )}
                  >
                    {getTypeLabel(sub.type)}
                  </span>

                  <div className="flex-1 min-w-0">
                    <a
                      href={`https://github.com/${sub.owner}/${sub.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-gray-900 hover:text-brand-600 flex items-center gap-1"
                    >
                      {sub.label}
                      <ExternalLink size={12} className="text-gray-400" />
                    </a>
                    <p className="text-xs text-gray-400">
                      Last checked: {formatRelativeTime(sub.lastCheckedAt)}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleSub(sub.id, !sub.enabled)}
                    className="text-gray-400 hover:text-brand-600 transition-colors"
                    title={sub.enabled ? 'Disable' : 'Enable'}
                  >
                    {sub.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>

                  <button
                    onClick={() => removeSub(sub.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Settings */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Key size={18} className="text-brand-600" />
            Settings
          </h2>

          <div className="space-y-4">
            {/* GitHub Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={settings.githubToken}
                onChange={(e) => updateSettings({ githubToken: e.target.value })}
                placeholder="ghp_xxxxxxxxxxxx (optional but recommended)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Without a token: 60 requests/hour. With a token: 5,000 requests/hour.
                {' '}
                <a
                  href="https://github.com/settings/tokens/new?description=ReleasePulse&scopes=repo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline"
                >
                  Create token
                </a>
              </p>
            </div>

            {/* Poll interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock size={14} className="inline mr-1" />
                Check interval (minutes)
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

            {/* Desktop notifications */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="desktopNotif"
                checked={settings.desktopNotifications}
                onChange={(e) => updateSettings({ desktopNotifications: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="desktopNotif" className="text-sm text-gray-700 cursor-pointer">
                Enable desktop notifications
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
