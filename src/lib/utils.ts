import { clsx, type ClassValue } from 'clsx'
import { t } from '@/i18n'

/** Merge class names with clsx. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

/** Format ISO date string to a human-readable relative time. */
export function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return t('common.never')
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return t('common.justNow')
  if (diffMin < 60) return t('common.minAgo', { min: diffMin })
  if (diffHour < 24) return t('common.hourAgo', { hour: diffHour })
  if (diffDay < 30) return t('common.dayAgo', { day: diffDay })
  return date.toLocaleDateString()
}

/** Get the type badge label for a subscription type. */
export function getTypeLabel(type: string): string {
  return t(`type.${type}`)
}

/** Get the type badge color class for a subscription type. */
export function getTypeColor(type: string): string {
  switch (type) {
    case 'github_release':
      return 'bg-green-100 text-green-700'
    case 'github_tag':
      return 'bg-purple-100 text-purple-700'
    case 'github_issue':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}
