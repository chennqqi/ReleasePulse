import { describe, it, expect } from 'vitest'
import {
  buildWatchingGroups,
  getTotalWatchCount,
  groupNotificationsByTime,
} from './subscription-utils'
import type { RepoWatch, Subscription, NotificationRecord } from '@/types'

function makeWatch(owner: string, repo: string): RepoWatch {
  return {
    id: `watch-${owner}-${repo}`,
    owner,
    repo,
    label: `${owner}/${repo}`,
    events: { releases: true, tags: false },
    lastCheckedAt: null,
    lastSeenReleaseId: null,
    lastSeenTagSha: null,
    enabled: true,
    createdAt: '2026-06-01T00:00:00Z',
  }
}

function makeIssue(owner: string, repo: string, num: number): Subscription {
  return {
    id: `issue-${num}`,
    type: 'github_issue',
    owner,
    repo,
    issueNumber: num,
    label: `${owner}/${repo}#${num}`,
    lastCheckedAt: null,
    lastSeenId: null,
    enabled: true,
    createdAt: '2026-06-01T00:00:00Z',
  }
}

describe('buildWatchingGroups', () => {
  it('merges repo watch and issues under the same repo', () => {
    const groups = buildWatchingGroups(
      [makeWatch('vercel', 'next.js')],
      [makeIssue('vercel', 'next.js', 1)],
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].repoWatch?.label).toBe('vercel/next.js')
    expect(groups[0].issues).toHaveLength(1)
  })

  it('sorts groups by label', () => {
    const groups = buildWatchingGroups(
      [makeWatch('zebra', 'z'), makeWatch('alpha', 'a')],
      [],
    )
    expect(groups.map((g) => g.label)).toEqual(['alpha/a', 'zebra/z'])
  })
})

describe('getTotalWatchCount', () => {
  it('counts repo watches and issue subscriptions', () => {
    expect(getTotalWatchCount([makeWatch('a', 'b')], [makeIssue('a', 'b', 1)])).toBe(2)
  })
})

describe('groupNotificationsByTime', () => {
  it('groups notifications into today, yesterday, and earlier', () => {
    const now = new Date()
    const today = new Date(now)
    today.setHours(12, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const earlier = new Date(today)
    earlier.setDate(earlier.getDate() - 3)

    const mk = (createdAt: string): NotificationRecord => ({
      id: createdAt,
      subscriptionId: 's1',
      type: 'github_release',
      title: 't',
      body: 'b',
      url: 'https://github.com',
      read: false,
      createdAt,
    })

    const sections = groupNotificationsByTime([
      mk(today.toISOString()),
      mk(yesterday.toISOString()),
      mk(earlier.toISOString()),
    ])

    expect(sections.map((s) => s.key)).toEqual(['today', 'yesterday', 'earlier'])
    expect(sections[0].items).toHaveLength(1)
    expect(sections[1].items).toHaveLength(1)
    expect(sections[2].items).toHaveLength(1)
  })
})
