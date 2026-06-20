import type { RepoWatch, Subscription, RepoWatchCheckResult, CheckResult, NotificationRecord } from '@/types'
import { fetchReleases, fetchTags, fetchIssue, fetchIssueEvents } from '@/lib/github-api'
import { generateId } from '@/lib/storage'
import { t } from '@/i18n'

/** Check a repo watch for release and tag updates. */
export async function checkRepoWatch(
  watch: RepoWatch,
  token: string,
): Promise<RepoWatchCheckResult> {
  const notifications: RepoWatchCheckResult['notifications'] = []
  let lastSeenReleaseId = watch.lastSeenReleaseId
  let lastSeenTagSha = watch.lastSeenTagSha

  if (watch.events.releases) {
    const releaseResult = await checkReleaseForWatch(watch, token)
    lastSeenReleaseId = releaseResult.newId
    notifications.push(...releaseResult.notifications)
  }

  if (watch.events.tags) {
    const tagResult = await checkTagForWatch(watch, token)
    lastSeenTagSha = tagResult.newId
    notifications.push(...tagResult.notifications)
  }

  return { lastSeenReleaseId, lastSeenTagSha, notifications }
}

async function checkReleaseForWatch(
  watch: RepoWatch,
  token: string,
): Promise<{ newId: string | null; notifications: RepoWatchCheckResult['notifications'] }> {
  const releases = await fetchReleases(watch.owner, watch.repo, token, 5)
  if (releases.length === 0) {
    return { newId: watch.lastSeenReleaseId, notifications: [] }
  }

  const latestId = releases[0].id
  const lastSeenId = watch.lastSeenReleaseId

  if (!lastSeenId) {
    return { newId: latestId.toString(), notifications: [] }
  }

  const lastSeenNum = Number(lastSeenId)
  const newReleases = releases.filter((r) => r.id > lastSeenNum)
  if (newReleases.length === 0) {
    return { newId: latestId.toString(), notifications: [] }
  }

  return {
    newId: latestId.toString(),
    notifications: newReleases.map((r) => ({
      type: 'github_release' as const,
      title: t('notif.newRelease', { label: watch.label }),
      body: r.name ?? r.tag_name,
      url: r.html_url,
    })),
  }
}

async function checkTagForWatch(
  watch: RepoWatch,
  token: string,
): Promise<{ newId: string | null; notifications: RepoWatchCheckResult['notifications'] }> {
  const tags = await fetchTags(watch.owner, watch.repo, token, 10)
  if (tags.length === 0) {
    return { newId: watch.lastSeenTagSha, notifications: [] }
  }

  const latestSha = tags[0].object.sha
  const lastSeenSha = watch.lastSeenTagSha

  if (!lastSeenSha) {
    return { newId: latestSha, notifications: [] }
  }

  // Tags are ordered newest-first; find the index of the last seen SHA
  // and treat all tags before it as new.
  const lastSeenIdx = tags.findIndex((tag) => tag.object.sha === lastSeenSha)
  const newTags = lastSeenIdx === -1 ? tags : tags.slice(0, lastSeenIdx)
  if (newTags.length === 0) {
    return { newId: latestSha, notifications: [] }
  }

  return {
    newId: latestSha,
    notifications: newTags.map((tag) => {
      const tagName = tag.ref.replace('refs/tags/', '')
      return {
        type: 'github_tag' as const,
        title: t('notif.newTag', { label: watch.label }),
        body: tagName,
        url: `https://github.com/${watch.owner}/${watch.repo}/releases/tag/${tagName}`,
      }
    }),
  }
}

/** Check a single issue subscription for updates. */
export async function checkIssueSubscription(
  sub: Subscription,
  token: string,
): Promise<CheckResult> {
  return checkIssue(sub, token)
}

/** Check for issue state changes. */
async function checkIssue(sub: Subscription, token: string): Promise<CheckResult> {
  if (!sub.issueNumber) {
    return { hasUpdate: false, newId: sub.lastSeenId ?? '', notifications: [] }
  }

  const issue = await fetchIssue(sub.owner, sub.repo, sub.issueNumber, token)
  const events = await fetchIssueEvents(sub.owner, sub.repo, sub.issueNumber, token, 20)

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

  const monitoredEvents: string[] = (sub.issueEvents ?? ['closed', 'reopened']).map(String)
  const newEvents = recentEvents.filter((e) => monitoredEvents.includes(e.event))

  const notifications = newEvents.map((e) => ({
    type: 'github_issue' as const,
    title: t('notif.issueUpdate', { number: sub.issueNumber ?? 0, event: e.event, label: sub.label }),
    body: t('notif.issueBody', { actor: e.actor.login, event: e.event }),
    url: issue.html_url,
  }))

  return { hasUpdate: notifications.length > 0, newId: stateHash, notifications }
}

/** Convert repo watch notifications into NotificationRecord objects. */
export function createRepoWatchNotificationRecords(
  watchId: string,
  notifications: RepoWatchCheckResult['notifications'],
): NotificationRecord[] {
  return notifications.map((n) => ({
    id: generateId(),
    subscriptionId: watchId,
    type: n.type,
    title: n.title,
    body: n.body,
    url: n.url,
    read: false,
    createdAt: new Date().toISOString(),
  }))
}

/** Convert issue check result notifications into NotificationRecord objects. */
export function createIssueNotificationRecords(
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
