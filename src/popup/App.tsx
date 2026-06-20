import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { formatRelativeTime, getTypeColor, getTypeLabel, cn } from '@/lib/utils'
import { Bell, CheckCheck, RefreshCw, Settings, Trash2, ExternalLink } from 'lucide-react'

/** Popup main component - shows recent notifications and quick actions. */
export default function App() {
  const { notifications, loadData, markRead, markAllRead, clearAll, runCheck, loading } = useAppStore()

  useEffect(() => {
    loadData()
  }, [loadData])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleOpenLink = (url: string, id: string) => {
    chrome.tabs.create({ url })
    markRead(id)
  }

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div className="w-[380px] min-h-[300px] bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-brand-600 text-white">
        <div className="flex items-center gap-2">
          <Bell size={18} />
          <span className="font-semibold text-sm">ReleasePulse</span>
          {unreadCount > 0 && (
            <span className="bg-white text-brand-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => runCheck()}
            className="p-1.5 hover:bg-brand-700 rounded transition-colors"
            title="Check now"
          >
            <RefreshCw size={15} className={cn(loading && 'animate-spin')} />
          </button>
          <button
            onClick={handleOpenOptions}
            className="p-1.5 hover:bg-brand-700 rounded transition-colors"
            title="Settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-1">Subscribe to repos in settings</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                'flex items-start gap-2 px-4 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors',
                !notif.read && 'bg-brand-50',
              )}
              onClick={() => handleOpenLink(notif.url, notif.id)}
            >
              <span
                className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5',
                  getTypeColor(notif.type),
                )}
              >
                {getTypeLabel(notif.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {notif.title}
                </p>
                <p className="text-xs text-gray-500 truncate">{notif.body}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatRelativeTime(notif.createdAt)}
                </p>
              </div>
              <ExternalLink size={12} className="text-gray-300 shrink-0 mt-1" />
            </div>
          ))
        )}
      </div>

      {/* Footer actions */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-200">
          <button
            onClick={() => markAllRead()}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-600 transition-colors"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
          <button
            onClick={() => clearAll()}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
