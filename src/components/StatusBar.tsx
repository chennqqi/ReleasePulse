import { formatApiRemaining, formatSyncStatus } from '@/lib/subscription-utils'
import type { Settings } from '@/types'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'

/** Bottom status bar showing sync time, watch count, and API quota. */
export function StatusBar({
  settings,
  watchCount,
  className,
}: {
  settings: Settings
  watchCount: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2 bg-white border-t border-gray-200 text-[11px] text-gray-500',
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
        {formatSyncStatus(settings.lastSyncAt)}
      </span>
      <span>
        {t('status.watchCount', { count: watchCount })} · {formatApiRemaining(settings.apiRemaining, settings.githubToken)}
      </span>
    </div>
  )
}
