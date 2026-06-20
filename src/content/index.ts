import { parseGithubUrl } from '@/lib/github-api'
import type { SubscriptionType } from '@/types'
import { injectSubscribeButtons, injectRepoRootButtonsWrapper } from './injector'
import { setLocale, detectLocale, type Locale } from '@/i18n'

/** Determine the page type from the current URL. Returns null for unsupported pages. */
function getPageType(url: string): SubscriptionType | 'repo_root' | null {
  if (/\/issues\/\d+/.test(url)) return 'github_issue'
  if (/\/releases/.test(url)) return 'github_release'
  if (/\/tags/.test(url)) return 'github_tag'
  // Repo root - support both release and tag subscription
  if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(url)) return 'repo_root'
  return null
}

/** Load language setting from storage and set the i18n locale. */
async function initLocale(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('settings')
    const language = result.settings?.language ?? 'auto'
    if (language === 'auto' || !language) {
      setLocale(detectLocale())
    } else {
      setLocale(language as Locale)
    }
  } catch {
    setLocale(detectLocale())
  }
}

/** Main content script entry point. */
async function init(): Promise<void> {
  await initLocale()
  const url = window.location.href
  const parsed = parseGithubUrl(url)
  if (!parsed) return

  const pageType = getPageType(url)
  if (!pageType) return

  const context: PageContext = {
    type: pageType === 'repo_root' ? 'github_release' : pageType,
    owner: parsed.owner,
    repo: parsed.repo,
    issueNumber: parsed.issueNumber,
  }

  if (pageType === 'repo_root') {
    injectRepoRootButtonsWrapper(context)
  } else {
    injectSubscribeButtons(context)
  }
}

/** Context describing the current GitHub page. */
export interface PageContext {
  type: SubscriptionType
  owner: string
  repo: string
  issueNumber?: number
}

/** Listen for GitHub SPA navigation (pjax events). */
document.addEventListener('pjax:end', () => {
  setTimeout(() => init(), 200)
})

/** Also listen for turbo navigation (GitHub's newer navigation system). */
document.addEventListener('turbo:render', () => {
  setTimeout(() => init(), 200)
})

/** Initial run. */
init()
