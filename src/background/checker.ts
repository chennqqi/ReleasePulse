import type { Subscription, CheckResult, NotificationRecord } from '@/types'
import { fetchReleases, fetchTags, fetchIssue, fetchIssueEvents } from '@/lib/github-api'
import { generateId } from '@/lib/storage'

/** Check a single subscription for updates. Returns check result with any new notifications. */
export async function checkSubscription(
  sub: Subscription,
  token: string,
): Promise<CheckResult> {
  switch (sub.type) {
    case 'github_release':
      return checkRelease(sub, token)
    case 'github_tag':
      return checkTag(sub, token)
    case 'github_issue':
      return checkIssue(sub, token)
    default:
      return { hasUpdate: false, newId: sub.lastSeenId ?? '', notifications: [] }
  }
}

/** Check for new releases. */
async function checkRelease(sub: Subscription, token: string): Promise<CheckResult> {
  const releases = await fetchReleases(sub.owner, sub.repo, token, 5)
  if (releases.length === 0) {
    return { hasUpdate: false, newId: sub.lastSeenId ?? '', notifications: [] }
  }

  const latestId = releases[0].id.toString()
  const lastSeenId = sub.lastSeenId

  // First check - just record the latest, don't notify
  if (!lastSeenId) {
    return { hasUpdate: false, newId: latestId, notifications: [] }
  }

  // Find releases newer than lastSeenId
  const newReleases = releases.filter(
    (r) => r.id.toString() > lastSeenId,
  )

  if (newReleases.length === 0) {
    return { hasUpdate: false, newId: latestId, notifications: [] }
  }

  const notifications = newReleases.map((r) => ({
    type: 'github_release' as const,
    title: `New release: ${sub.label}`,
    body: r.name ?? r.tag_name,
    url: r.html_url,
  }))

  return { hasUpdate: true, newId: latestId, notifications }
}

/** Check for new tags. */
async function checkTag(sub: Subscription, token: string): Promise<CheckResult> {
  const tags = await fetchTags(sub.owner, sub.repo, token, 10)
  if (tags.length === 0) {
    return { hasUpdate: false, newId: sub.lastSeenId ?? '', notifications: [] }
  }

  // Use the latest tag's sha as the identifier
  const latestSha = tags[0].object.sha
  const lastSeenSha = sub.lastSeenId

  if (!lastSeenSha) {
    return { hasUpdate: false, newId: latestSha, notifications: [] }
  }

  // Find tags newer than lastSeenSha
  const newTags = tags.filter((t) => t.object.sha > lastSeenSha)

  if (newTags.length === 0) {
    return { hasUpdate: false, newId: latestSha, notifications: [] }
  }

  const notifications = newTags.map((t) => {
    const tagName = t.ref.replace('refs/tags/', '')
    return {
      type: 'github_tag' as const,
      title: `New tag: ${sub.label}`,
      body: tagName,
      url: `https://github.com/${sub.owner}/${sub.repo}/releases/tag/${tagName}`,
    }
  })

  return { hasUpdate: true, newId: latestSha, notifications }
}

/** Check for issue state changes. */
async function checkIssue(sub: Subscription, token: string): Promise<CheckResult> {
  if (!sub.issueNumber) {
    return { hasUpdate: false, newId: sub.lastSeenId ?? '', notifications: [] }
  }

  const issue = await fetchIssue(sub.owner, sub.repo, sub.issueNumber, token)
  const events = await fetchIssueEvents(sub.owner, sub.repo, sub.issueNumber, token, 20)

  // Build a state hash from the issue state + recent events
  const recentEvents = events.slice(-10)
  const stateHash = `${issue.state}:${issue.updated_at}:${recentEvents
    .map((e) => `${e.event}:${e.created_at}`)
    .join(',')}`

  const lastSeenHash = sub.lastSeenId

  if (!lastSeenHash) {
    return { hasUpdate: false, newId: stateHash, notifications: [] }
  }

  if (stateHash === lastSeenHash) {
    return { hasUpdate: false, newId: stateHash, notifications: [] }
  }

  // Detect what changed by looking at recent events since last check
  const monitoredEvents: string[] = (sub.issueEvents ?? ['closed', 'reopened']).map(String)
  const newEvents = recentEvents.filter((e) =>
    monitoredEvents.includes(e.event),
  )

  const notifications = newEvents.map((e) => ({
    type: 'github_issue' as const,
    title: `Issue #${sub.issueNumber} ${e.event}: ${sub.label}`,
    body: `${e.actor.login} ${e.event} the issue`,
    url: issue.html_url,
  }))

  return { hasUpdate: notifications.length > 0, newId: stateHash, notifications }
}

/** Convert check result notifications into NotificationRecord objects. */
export function createNotificationRecords(
  subscriptionId: string,
  checkResult: CheckResult,
): NotificationRecord[] {
  return checkResult.notifications.map((n) => ({
    id: generateId(),
    subscriptionId,
    type: n.type,
    title: n.title,
    body: n.body,
    url: n.url,
    read: false,
    createdAt: new Date().toISOString(),
  }))
}
