import type { PageContext } from './index'
import type { IssueEvent } from '@/types'

interface RepoWatchStatus {
  releases: boolean
  tags: boolean
}

/** Check which repo events are already subscribed. */
async function checkRepoWatch(owner: string, repo: string): Promise<RepoWatchStatus> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'CHECK_REPO_WATCH', payload: { owner, repo } },
      (response) => resolve(response ?? { releases: false, tags: false }),
    )
  })
}

/** Check if a single issue subscription exists. */
async function checkIssueExists(owner: string, repo: string, issueNumber: number): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: 'CHECK_SUBSCRIPTION',
        payload: { owner, repo, issueNumber },
      },
      (response) => resolve(response?.exists ?? false),
    )
  })
}

/** Add repo watch subscriptions for selected event types. */
async function addRepoWatch(
  owner: string,
  repo: string,
  releases: boolean,
  tags: boolean,
): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'ADD_REPO_WATCH', payload: { owner, repo, releases, tags } },
      (response) => resolve(response?.success ?? false),
    )
  })
}

/** Add a single issue subscription. */
async function addIssueSubscription(
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: 'ADD_SUBSCRIPTION',
        payload: {
          owner,
          repo,
          issueNumber,
          issueEvents: ['closed', 'reopened'] as IssueEvent[],
        },
      },
      (response) => resolve(response?.success ?? false),
    )
  })
}

function getIconUrl(): string {
  return chrome.runtime.getURL('src/assets/icon-16.png')
}

const BTN_STYLE = `
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #f6f8fa;
  color: #24292f;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`

const BTN_ACTIVE_STYLE = `
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  border: 1px solid #4338ca;
  border-radius: 6px;
  background: #eef2ff;
  color: #4338ca;
  cursor: pointer;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
`

function createButton(label: string, iconUrl: string, active = false): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.style.cssText = active ? BTN_ACTIVE_STYLE : BTN_STYLE
  btn.innerHTML = `<img src="${iconUrl}" width="14" height="14" alt="ReleasePulse" /> ${label}`
  if (!active) {
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#eef2ff'
      btn.style.borderColor = '#4338ca'
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#f6f8fa'
      btn.style.borderColor = '#d0d7de'
    })
  }
  return btn
}

function removeExistingButtons(): void {
  document.querySelectorAll('.release-pulse-btn, .release-pulse-popover').forEach((el) => el.remove())
}

function findInjectionTarget(selectors: string[]): Element | null {
  for (const selector of selectors) {
    const el = document.querySelector(selector)
    if (el) return el
  }
  return null
}

async function waitForElement(selectors: string[], timeoutMs = 3000): Promise<Element | null> {
  const existing = findInjectionTarget(selectors)
  if (existing) return existing

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const el = findInjectionTarget(selectors)
      if (el) {
        observer.disconnect()
        resolve(el)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeoutMs)
  })
}

const REPO_SELECTORS = [
  '.pagehead-actions',
  '.repohead-actions',
  '[data-pjax="#repo-content-pjax-container"] .d-flex',
  '.Layout-sidebar .Border',
  '#repo-content-pjax-container .d-flex',
]

const ISSUE_SELECTORS = [
  '.gh-header-actions',
  '.gh-header .d-flex',
  '#partial-discussion-header .gh-header-meta',
  '.js-issues-toolbar',
]

/** Create and show a popover for selecting watch events. */
function showWatchPopover(
  anchor: HTMLElement,
  owner: string,
  repo: string,
  status: RepoWatchStatus,
  onDone: () => void,
): void {
  document.querySelectorAll('.release-pulse-popover').forEach((el) => el.remove())

  const popover = document.createElement('div')
  popover.className = 'release-pulse-popover'
  popover.style.cssText = `
    position: absolute;
    z-index: 9999;
    background: #fff;
    border: 1px solid #d0d7de;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    padding: 12px;
    min-width: 200px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `

  const title = document.createElement('p')
  title.textContent = 'Watch with ReleasePulse'
  title.style.cssText = 'font-size: 12px; font-weight: 600; color: #24292f; margin: 0 0 8px;'
  popover.appendChild(title)

  const releasesCheck = document.createElement('label')
  releasesCheck.style.cssText = 'display: flex; align-items: center; gap: 6px; font-size: 12px; color: #24292f; margin-bottom: 6px; cursor: pointer;'
  const releasesInput = document.createElement('input')
  releasesInput.type = 'checkbox'
  releasesInput.checked = true
  releasesInput.disabled = status.releases
  releasesCheck.appendChild(releasesInput)
  releasesCheck.appendChild(document.createTextNode(status.releases ? 'New Releases ✓' : 'New Releases'))
  popover.appendChild(releasesCheck)

  const tagsCheck = document.createElement('label')
  tagsCheck.style.cssText = 'display: flex; align-items: center; gap: 6px; font-size: 12px; color: #24292f; margin-bottom: 10px; cursor: pointer;'
  const tagsInput = document.createElement('input')
  tagsInput.type = 'checkbox'
  tagsInput.checked = true
  tagsInput.disabled = status.tags
  tagsCheck.appendChild(tagsInput)
  tagsCheck.appendChild(document.createTextNode(status.tags ? 'New Tags ✓' : 'New Tags'))
  popover.appendChild(tagsCheck)

  const allWatching = status.releases && status.tags

  const applyBtn = document.createElement('button')
  applyBtn.textContent = allWatching ? 'Watching' : 'Apply'
  applyBtn.disabled = allWatching
  applyBtn.style.cssText = `
    width: 100%;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    background: ${allWatching ? '#e4e4e7' : '#4338ca'};
    color: ${allWatching ? '#71717a' : '#fff'};
    cursor: ${allWatching ? 'default' : 'pointer'};
  `

  applyBtn.addEventListener('click', async () => {
    const wantReleases = releasesInput.checked && !status.releases
    const wantTags = tagsInput.checked && !status.tags
    if (!wantReleases && !wantTags) {
      popover.remove()
      return
    }
    applyBtn.disabled = true
    applyBtn.textContent = 'Applying...'
    const success = await addRepoWatch(owner, repo, wantReleases, wantTags)
    popover.remove()
    if (success) onDone()
  })

  popover.appendChild(applyBtn)

  const rect = anchor.getBoundingClientRect()
  popover.style.top = `${rect.bottom + window.scrollY + 4}px`
  popover.style.left = `${rect.left + window.scrollX}px`
  document.body.appendChild(popover)

  const closeOnClickOutside = (e: MouseEvent) => {
    if (!popover.contains(e.target as Node) && e.target !== anchor) {
      popover.remove()
      document.removeEventListener('click', closeOnClickOutside)
    }
  }
  setTimeout(() => document.addEventListener('click', closeOnClickOutside), 0)
}

/** Inject unified repo watch button with popover. */
async function injectRepoWatchButton(context: PageContext): Promise<void> {
  const target = await waitForElement(REPO_SELECTORS, 3000)
  if (!target || target.querySelector('.release-pulse-btn')) return

  const iconUrl = getIconUrl()
  const status = await checkRepoWatch(context.owner, context.repo)
  const isWatching = status.releases || status.tags

  const container = document.createElement('div')
  container.className = 'release-pulse-btn'
  container.style.cssText = 'display: inline-flex; margin-left: 8px; vertical-align: middle; position: relative;'

  const openPopover = async (anchor: HTMLButtonElement) => {
    const currentStatus = await checkRepoWatch(context.owner, context.repo)
    showWatchPopover(anchor, context.owner, context.repo, currentStatus, async () => {
      container.remove()
      await injectRepoWatchButton(context)
    })
  }

  const btn = createButton(
    isWatching ? 'Watching' : 'Watch with ReleasePulse',
    iconUrl,
    isWatching,
  )

  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    openPopover(btn)
  })

  container.appendChild(btn)
  target.appendChild(container)
}

/** Inject issue subscribe button. */
async function injectIssueButton(context: PageContext): Promise<void> {
  if (!context.issueNumber) return

  const target = await waitForElement(ISSUE_SELECTORS, 3000)
  if (!target || target.querySelector('.release-pulse-btn')) return

  const iconUrl = getIconUrl()
  const exists = await checkIssueExists(context.owner, context.repo, context.issueNumber)

  const container = document.createElement('div')
  container.className = 'release-pulse-btn'
  container.style.cssText = 'display: inline-flex; margin-left: 8px; vertical-align: middle;'

  if (exists) {
    container.appendChild(createButton('Subscribed', iconUrl, true))
    target.appendChild(container)
    return
  }

  const btn = createButton('Subscribe Issue', iconUrl)
  btn.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()
    btn.disabled = true
    btn.textContent = 'Subscribing...'
    const success = await addIssueSubscription(context.owner, context.repo, context.issueNumber!)
    if (success) {
      container.replaceChildren(createButton('Subscribed', iconUrl, true))
    } else {
      btn.disabled = false
      btn.textContent = 'Failed - Retry?'
    }
  })
  container.appendChild(btn)
  target.appendChild(container)
}

/** Inject buttons based on page type. */
export async function injectSubscribeButtons(context: PageContext): Promise<void> {
  removeExistingButtons()

  if (context.type === 'github_issue') {
    await injectIssueButton(context)
    return
  }

  await injectRepoWatchButton(context)
}

/** Inject repo watch button on repo root (same as release/tag pages). */
export async function injectRepoRootButtonsWrapper(context: PageContext): Promise<void> {
  removeExistingButtons()
  await injectRepoWatchButton(context)
}
