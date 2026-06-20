import { RateLimitError, GithubApiError } from '@/lib/github-api'
import type { SyncErrorCode } from '@/types'

/** Classify a sync failure for user-facing status display. */
export function classifySyncError(err: unknown): SyncErrorCode {
  if (err instanceof RateLimitError) return 'rate_limit'
  if (err instanceof GithubApiError) {
    if (err.status === 401 || err.status === 403) return 'auth'
    if (err.status === 404) return 'not_found'
  }
  return 'generic'
}

/** Map a sync error code to an i18n message key. */
export function syncErrorMessageKey(code: SyncErrorCode): string | null {
  if (!code) return null
  return `error.${code}`
}
