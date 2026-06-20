import { describe, it, expect } from 'vitest'
import { parseGithubUrl } from './github-api'

describe('parseGithubUrl', () => {
  it('parses repo root URL', () => {
    expect(parseGithubUrl('https://github.com/facebook/react')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })
  })

  it('parses repo root URL with trailing slash', () => {
    expect(parseGithubUrl('https://github.com/facebook/react/')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })
  })

  it('parses issue URL', () => {
    expect(parseGithubUrl('https://github.com/facebook/react/issues/123')).toEqual({
      owner: 'facebook',
      repo: 'react',
      issueNumber: 123,
    })
  })

  it('parses releases page URL', () => {
    expect(parseGithubUrl('https://github.com/facebook/react/releases')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })
  })

  it('parses tags page URL', () => {
    expect(parseGithubUrl('https://github.com/facebook/react/tags')).toEqual({
      owner: 'facebook',
      repo: 'react',
    })
  })

  it('strips .git suffix from repo name', () => {
    expect(parseGithubUrl('https://github.com/owner/repo.git/')).toEqual({
      owner: 'owner',
      repo: 'repo',
    })
  })

  it('returns null for unsupported URLs', () => {
    expect(parseGithubUrl('https://gitlab.com/owner/repo')).toBeNull()
    expect(parseGithubUrl('not-a-url')).toBeNull()
    expect(parseGithubUrl('https://github.com/owner')).toBeNull()
  })
})
