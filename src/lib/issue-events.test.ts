import { describe, it, expect } from 'vitest'
import {
  isLegacyIssueCursor,
  getLatestEventTimestamp,
  findNewMonitoredEvents,
  type IssueTimelineEvent,
} from './issue-events'

const actor = { login: 'dev' }

function event(name: string, created_at: string): IssueTimelineEvent {
  return { event: name, created_at, actor }
}

describe('isLegacyIssueCursor', () => {
  it('returns false for null', () => {
    expect(isLegacyIssueCursor(null)).toBe(false)
  })

  it('returns false for ISO timestamps', () => {
    expect(isLegacyIssueCursor('2026-06-20T10:00:00Z')).toBe(false)
  })

  it('returns true for legacy state-hash cursors', () => {
    expect(isLegacyIssueCursor('open:2026-06-20T10:00:00Z:closed:2026-06-19T08:00:00Z')).toBe(true)
  })
})

describe('getLatestEventTimestamp', () => {
  it('returns null for empty list', () => {
    expect(getLatestEventTimestamp([])).toBeNull()
  })

  it('returns the max created_at value', () => {
    const events = [
      event('closed', '2026-06-18T10:00:00Z'),
      event('reopened', '2026-06-20T12:00:00Z'),
      event('commented', '2026-06-19T08:00:00Z'),
    ]
    expect(getLatestEventTimestamp(events)).toBe('2026-06-20T12:00:00Z')
  })
})

describe('findNewMonitoredEvents', () => {
  const events = [
    event('closed', '2026-06-18T10:00:00Z'),
    event('reopened', '2026-06-19T08:00:00Z'),
    event('closed', '2026-06-20T12:00:00Z'),
  ]

  it('rebases without notifying when cursor is missing', () => {
    const result = findNewMonitoredEvents(events, ['closed', 'reopened'], null)
    expect(result.newEvents).toHaveLength(0)
    expect(result.newCursor).toBe('2026-06-20T12:00:00Z')
  })

  it('rebases legacy hash cursor without notifying', () => {
    const result = findNewMonitoredEvents(
      events,
      ['closed'],
      'open:2026-06-20T10:00:00Z:closed:2026-06-18T10:00:00Z',
    )
    expect(result.newEvents).toHaveLength(0)
    expect(result.newCursor).toBe('2026-06-20T12:00:00Z')
  })

  it('returns only events after the cursor', () => {
    const result = findNewMonitoredEvents(events, ['closed', 'reopened'], '2026-06-18T11:00:00Z')
    expect(result.newEvents.map((e) => e.event)).toEqual(['reopened', 'closed'])
    expect(result.newCursor).toBe('2026-06-20T12:00:00Z')
  })

  it('ignores non-monitored event types', () => {
    const withLabel = [...events, event('labeled', '2026-06-21T09:00:00Z')]
    const result = findNewMonitoredEvents(withLabel, ['closed'], '2026-06-20T12:00:00Z')
    expect(result.newEvents).toHaveLength(0)
    expect(result.newCursor).toBe('2026-06-20T12:00:00Z')
  })

  it('keeps cursor unchanged when no new monitored events', () => {
    const cursor = '2026-06-20T12:00:00Z'
    const result = findNewMonitoredEvents(events, ['closed'], cursor)
    expect(result.newEvents).toHaveLength(0)
    expect(result.newCursor).toBe(cursor)
  })
})
