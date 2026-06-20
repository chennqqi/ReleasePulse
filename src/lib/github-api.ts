import type {
  GithubRelease,
  GithubTag,
  GithubIssue,
} from '@/types'

const API_BASE = 'https://api.github.com'

/** Custom error for GitHub API rate limiting. */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RateLimitError'
  }
}

/** Build headers for GitHub API requests. */
function buildHeaders(token: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token.length > 0) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

/** Handle GitHub API response, including rate limit errors. */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 403) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    if (remaining === '0') {
      throw new RateLimitError('GitHub API rate limit exceeded')
    }
  }
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GitHub API error ${response.status}: ${text}`)
  }
  return response.json() as Promise<T>
}

/** Fetch the latest releases for a repository. */
export async function fetchReleases(
  owner: string,
  repo: string,
  token: string,
  perPage = 5,
): Promise<GithubRelease[]> {
  const url = `${API_BASE}/repos/${owner}/${repo}/releases?per_page=${perPage}&sort=created&direction=desc`
  const response = await fetch(url, { headers: buildHeaders(token) })
  return handleResponse<GithubRelease[]>(response)
}

/** Fetch tags for a repository. */
export async function fetchTags(
  owner: string,
  repo: string,
  token: string,
  perPage = 10,
): Promise<GithubTag[]> {
  const url = `${API_BASE}/repos/${owner}/${repo}/git/refs/tags?per_page=${perPage}`
  const response = await fetch(url, { headers: buildHeaders(token) })
  return handleResponse<GithubTag[]>(response)
}

/** Fetch a single issue for a repository. */
export async function fetchIssue(
  owner: string,
  repo: string,
  issueNumber: number,
  token: string,
): Promise<GithubIssue> {
  const url = `${API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}`
  const response = await fetch(url, { headers: buildHeaders(token) })
  return handleResponse<GithubIssue>(response)
}

/** Fetch issue events (timeline) to detect state changes. */
export async function fetchIssueEvents(
  owner: string,
  repo: string,
  issueNumber: number,
  token: string,
  perPage = 10,
): Promise<{ event: string; created_at: string; actor: { login: string } }[]> {
  const url = `${API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/events?per_page=${perPage}`
  const response = await fetch(url, { headers: buildHeaders(token) })
  return handleResponse(response)
}

/** Fetch current GitHub API rate limit status. */
export async function fetchRateLimit(
  token: string,
): Promise<{ remaining: number; limit: number }> {
  const url = `${API_BASE}/rate_limit`
  const response = await fetch(url, { headers: buildHeaders(token) })
  const data = await handleResponse<{
    rate: { remaining: number; limit: number }
  }>(response)
  return { remaining: data.rate.remaining, limit: data.rate.limit }
}

/** Parse a GitHub URL into owner and repo. Returns null if invalid. */
export function parseGithubUrl(
  url: string,
): { owner: string; repo: string; issueNumber?: number } | null {
  const patterns = [
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)$/,
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/releases$/,
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tags$/,
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const [, owner, repo, issueNumber] = match
      return {
        owner,
        repo: repo.replace(/\.git$/, ''),
        issueNumber: issueNumber ? parseInt(issueNumber, 10) : undefined,
      }
    }
  }
  return null
}
