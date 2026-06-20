import type { SyncErrorCode } from '@/types'
import { syncErrorMessageKey } from '@/lib/sync-error'
import { t } from '@/i18n'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

/** Inline alert banner for sync/API errors. */
export function SyncAlert({
  syncError,
  className,
  compact = false,
}: {
  syncError: SyncErrorCode
  className?: string
  compact?: boolean
}) {
  if (!syncError) return null

  const messageKey = syncErrorMessageKey(syncError)
  if (!messageKey) return null

  return (
    <div
      className={cn(
        'flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-900',
        compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm rounded-lg',
        className,
      )}
      role="alert"
    >
      <AlertTriangle size={compact ? 14 : 16} className="shrink-0 mt-0.5" />
      <p>{t(messageKey)}</p>
    </div>
  )
}
