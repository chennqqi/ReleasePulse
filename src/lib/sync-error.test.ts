import { describe, it, expect } from 'vitest'
import { RateLimitError, GithubApiError } from './github-api'
import { classifySyncError, syncErrorMessageKey } from './sync-error'

describe('classifySyncError', () => {
  it('classifies rate limit errors', () => {
    expect(classifySyncError(new RateLimitError('limit'))).toBe('rate_limit')
  })

  it('classifies auth errors', () => {
    expect(classifySyncError(new GithubApiError(401, 'unauthorized'))).toBe('auth')
    expect(classifySyncError(new GithubApiError(403, 'forbidden'))).toBe('auth')
  })

  it('classifies not found errors', () => {
    expect(classifySyncError(new GithubApiError(404, 'missing'))).toBe('not_found')
  })

  it('classifies unknown errors as generic', () => {
    expect(classifySyncError(new Error('boom'))).toBe('generic')
    expect(classifySyncError(new GithubApiError(500, 'server'))).toBe('generic')
  })
})

describe('syncErrorMessageKey', () => {
  it('maps codes to i18n keys', () => {
    expect(syncErrorMessageKey('rate_limit')).toBe('error.rate_limit')
    expect(syncErrorMessageKey(null)).toBeNull()
  })
})
