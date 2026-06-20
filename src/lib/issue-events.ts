import type { IssueEvent } from '@/types'

/** A single issue timeline event from the GitHub API. */
export interface IssueTimelineEvent {
  event: string
  created_at: string
  actor: { login: string }
}

/** Returns true when lastSeenId uses the legacy state-hash format. */
export function isLegacyIssueCursor(cursor: string | null): boolean {
  if (!cursor) return false
  return Number.isNaN(Date.parse(cursor))
}

/** Pick the latest created_at timestamp from a list of events. */
export function getLatestEventTimestamp(events: IssueTimelineEvent[]): string | null {
  if (events.length === 0) return null
  return events.reduce(
    (max, e) => (e.created_at > max ? e.created_at : max),
    events[0].created_at,
  )
}

/**
 * Find monitored issue events that occurred after the stored cursor.
 * Returns an empty list and a rebased cursor when the cursor is missing or legacy.
 */
export function findNewMonitoredEvents(
  events: IssueTimelineEvent[],
  monitored: IssueEvent[],
  cursor: string | null,
): { newEvents: IssueTimelineEvent[]; newCursor: string | null } {
  const monitoredSet = new Set<string>(monitored.map(String))
  const relevant = events.filter((e) => monitoredSet.has(e.event))

  if (!cursor || isLegacyIssueCursor(cursor)) {
    const baseline = getLatestEventTimestamp(events) ?? getLatestEventTimestamp(relevant)
    return { newEvents: [], newCursor: baseline }
  }

  const newEvents = relevant.filter((e) => e.created_at > cursor)
  if (newEvents.length === 0) {
    return { newEvents: [], newCursor: cursor }
  }

  return {
    newEvents,
    newCursor: getLatestEventTimestamp(newEvents),
  }
}
