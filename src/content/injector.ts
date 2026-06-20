import type { PageContext } from './index'
import type { SubscriptionType, IssueEvent } from '@/types'

/** Check if a subscription already exists by querying the background. */
async function checkExisting(
  type: SubscriptionType,
  owner: string,
  repo: string,
  issueNumber?: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'CHECK_SUBSCRIPTION', payload: { subscriptionType: type, owner, repo, issueNumber } },
      (response) => resolve(response?.exists ?? false),
    )
  })
}

/** Send add subscription message to background. */
async function addSubscription(
  type: SubscriptionType,
  owner: string,
  repo: string,
  issueNumber?: number,
  issueEvents?: IssueEvent[],
): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        type: 'ADD_SUBSCRIPTION',
        payload: { subscriptionType: type, owner, repo, issueNumber, issueEvents },
      },
      (response) => resolve(response?.success ?? false),
    )
  })
}

/** Get the extension icon URL. */
function getIconUrl(): string {
  return chrome.runtime.getURL('src/assets/icon-16.png')
}

/** Create a styled subscribe button. */
function createButton(label: string, iconUrl: string): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.style.cssText = `
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
  `
  btn.innerHTML = `<img src="${iconUrl}" width="14" height="14" alt="ReleasePulse" style="vertical-align: middle;" /> ${label}`
  return btn
}

/** Create a subscribed (active) state button. */
function createSubscribedButton(iconUrl: string, label: string): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    border: 1px solid #2da44e;
    border-radius: 6px;
    background: #1a7f37;
    color: #ffffff;
    cursor: default;
    white-space: nowrap;
  `
  btn.innerHTML = `<img src="${iconUrl}" width="14" height="14" alt="ReleasePulse" style="vertical-align: middle;" /> ${label}`
  return btn
}

/** Get button label based on subscription type. */
function getButtonLabel(type: SubscriptionType): string {
  switch (type) {
    case 'github_release':
      return 'Subscribe Releases'
    case 'github_tag':
      return 'Subscribe Tags'
    case 'github_issue':
      return 'Subscribe Issue'
    default:
      return 'Subscribe'
  }
}

/** Create a container with a subscribe button for the given context. */
async function createSubscribeButton(context: PageContext): Promise<HTMLElement> {
  const iconUrl = getIconUrl()
  const label = getButtonLabel(context.type)
  const exists = await checkExisting(
    context.type,
    context.owner,
    context.repo,
    context.issueNumber,
  )

  const container = document.createElement('div')
  container.className = 'release-pulse-btn'
  container.style.cssText = 'display: inline-flex; margin-left: 8px; vertical-align: middle;'

  if (exists) {
    container.appendChild(createSubscribedButton(iconUrl, label))
    return container
  }

  const btn = createButton(label, iconUrl)
  btn.addEventListener('mouseenter', () => {
    btn.style.background = '#f3f4f6'
    btn.style.borderColor = '#afb8c1'
  })
  btn.addEventListener('mouseleave', () => {
    btn.style.background = '#f6f8fa'
    btn.style.borderColor = '#d0d7de'
  })
  btn.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()
    btn.disabled = true
    btn.textContent = 'Subscribing...'

    const issueEvents: IssueEvent[] | undefined = context.type === 'github_issue'
      ? ['closed', 'reopened']
      : undefined

    const success = await addSubscription(
      context.type,
      context.owner,
      context.repo,
      context.issueNumber,
      issueEvents,
    )

    if (success) {
      container.replaceChildren(createSubscribedButton(iconUrl, label))
    } else {
      btn.disabled = false
      btn.textContent = 'Failed - Retry?'
    }
  })
  container.appendChild(btn)
  return container
}

/** Try multiple selectors to find a suitable injection target. Returns null if none found. */
function findInjectionTarget(selectors: string[]): Element | null {
  for (const selector of selectors) {
    const el = document.querySelector(selector)
    if (el) return el
  }
  return null
}

/** Wait for an element to appear in the DOM, with timeout. */
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

/** Inject button(s) into a target element, checking for duplicates. */
async function injectInto(
  target: Element,
  context: PageContext,
): Promise<void> {
  if (target.querySelector('.release-pulse-btn')) return
  const btn = await createSubscribeButton(context)
  target.appendChild(btn)
}

/** Inject issue subscribe button on issue pages. */
async function injectIssueButton(context: PageContext): Promise<void> {
  if (!context.issueNumber) return

  const selectors = [
    '.gh-header-actions',
    '.gh-header .d-flex',
    '#partial-discussion-header .gh-header-meta',
    '.js-issues-toolbar',
  ]

  const target = await waitForElement(selectors, 3000)
  if (target) {
    await injectInto(target, context)
  }
}

/** Inject release subscribe button on releases/repo pages. */
async function injectReleaseButton(context: PageContext): Promise<void> {
  const selectors = [
    '.pagehead-actions',
    '.repohead-actions',
    '[data-pjax="#repo-content-pjax-container"] .d-flex',
    '.Layout-sidebar .Border',
    '#repo-content-pjax-container .d-flex',
  ]

  const target = await waitForElement(selectors, 3000)
  if (target) {
    await injectInto(target, context)
  }
}

/** Inject tag subscribe button on tags pages. */
async function injectTagButton(context: PageContext): Promise<void> {
  const selectors = [
    '.pagehead-actions',
    '.repohead-actions',
    '[data-pjax="#repo-content-pjax-container"] .d-flex',
    '.Layout-sidebar .Border',
    '#repo-content-pjax-container .d-flex',
  ]

  const target = await waitForElement(selectors, 3000)
  if (target) {
    await injectInto(target, context)
  }
}

/** Inject both release and tag buttons on repo root page. */
async function injectRepoRootButtons(context: PageContext): Promise<void> {
  const selectors = [
    '.pagehead-actions',
    '.repohead-actions',
    '.Layout-sidebar .Border',
  ]

  const target = await waitForElement(selectors, 3000)
  if (!target) return

  if (!target.querySelector('.release-pulse-btn-release')) {
    const releaseContext: PageContext = { ...context, type: 'github_release' }
    const releaseBtn = await createSubscribeButton(releaseContext)
    releaseBtn.classList.add('release-pulse-btn-release')
    target.appendChild(releaseBtn)
  }

  if (!target.querySelector('.release-pulse-btn-tag')) {
    const tagContext: PageContext = { ...context, type: 'github_tag' }
    const tagBtn = await createSubscribeButton(tagContext)
    tagBtn.classList.add('release-pulse-btn-tag')
    target.appendChild(tagBtn)
  }
}

/** Find injection targets and add buttons based on page type. */
export async function injectSubscribeButtons(context: PageContext): Promise<void> {
  // Remove any existing buttons first (for SPA navigation)
  document.querySelectorAll('.release-pulse-btn').forEach((el) => el.remove())

  switch (context.type) {
    case 'github_issue':
      await injectIssueButton(context)
      break
    case 'github_release':
      await injectReleaseButton(context)
      break
    case 'github_tag':
      await injectTagButton(context)
      break
    default:
      break
  }
}

/** Inject both release and tag buttons on repo root page. */
export async function injectRepoRootButtonsWrapper(context: PageContext): Promise<void> {
  document.querySelectorAll('.release-pulse-btn').forEach((el) => el.remove())
  await injectRepoRootButtons(context)
}
