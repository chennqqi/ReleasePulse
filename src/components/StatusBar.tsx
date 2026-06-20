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
  const hasError = Boolean(settings.syncError)

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-2 bg-white border-t border-gray-200 text-[11px]',
        hasError ? 'text-amber-700' : 'text-gray-500',
        className,
      )}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            hasError ? 'bg-amber-500' : 'bg-green-500',
          )}
        />
        <span className="truncate">
          {hasError ? t(`error.${settings.syncError}`) : formatSyncStatus(settings.lastSyncAt)}
        </span>
      </span>
      <span className="shrink-0 ml-2">
        {t('status.watchCount', { count: watchCount })} · {formatApiRemaining(settings.apiRemaining, settings.githubToken)}
      </span>
    </div>
  )
}
