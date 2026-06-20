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

/** Create a styled subscribe button. */
function createButton(label: string, iconUrl: string): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.className = 'btn'
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
function createSubscribedButton(iconUrl: string): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.className = 'btn'
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
  btn.innerHTML = `<img src="${iconUrl}" width="14" height="14" alt="ReleasePulse" style="vertical-align: middle;" /> Subscribed`
  return btn
}

/** Get the extension icon URL. */
function getIconUrl(): string {
  return chrome.runtime.getURL('src/assets/icon-16.png')
}

/** Inject a single subscribe button into a target element. */
async function injectButton(
  target: Element,
  context: PageContext,
): Promise<void> {
  if (target.querySelector('.release-pulse-btn')) return

  const iconUrl = getIconUrl()
  const exists = await checkExisting(
    context.type,
    context.owner,
    context.repo,
    context.issueNumber,
  )

  const container = document.createElement('div')
  container.className = 'release-pulse-btn'
  container.style.cssText = 'display: inline-flex; margin-left: 8px;'

  if (exists) {
    container.appendChild(createSubscribedButton(iconUrl))
  } else {
    const label = getButtonLabel(context.type)
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
        container.replaceChildren(createSubscribedButton(iconUrl))
      } else {
        btn.disabled = false
        btn.textContent = 'Failed - Retry?'
      }
    })
    container.appendChild(btn)
  }

  target.appendChild(container)
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

/** Find injection targets and add buttons based on page type. */
export async function injectSubscribeButtons(context: PageContext): Promise<void> {
  // Remove any existing buttons first (for SPA navigation)
  document.querySelectorAll('.release-pulse-btn').forEach((el) => el.remove())

  if (context.type === 'github_issue' && context.issueNumber) {
    // Inject on issue page - next to the issue title actions
    const issueActions = document.querySelector('.gh-header-actions')
    if (issueActions) {
      await injectButton(issueActions, context)
      return
    }
    // Fallback: inject near issue title
    const titleRow = document.querySelector('.js-issue-title')
    if (titleRow?.parentElement) {
      await injectButton(titleRow.parentElement, context)
    }
    return
  }

  if (context.type === 'github_release') {
    // Releases page: inject next to "Draft a new release" button or in the sidebar
    const releaseHeader = document.querySelector('[data-pjax="#repo-content-pjax-container"] .d-flex')
    if (releaseHeader) {
      await injectButton(releaseHeader, context)
      return
    }
    // Repo root: inject in the repo action bar
    const repoActions = document.querySelector('.pagehead-actions')
    if (repoActions) {
      await injectButton(repoActions, context)
      return
    }
    // Fallback: sidebar
    const sidebar = document.querySelector('.Layout-sidebar')
    if (sidebar) {
      await injectButton(sidebar, context)
    }
    return
  }

  if (context.type === 'github_tag') {
    // Tags page: similar to releases
    const tagHeader = document.querySelector('[data-pjax="#repo-content-pjax-container"] .d-flex')
    if (tagHeader) {
      await injectButton(tagHeader, context)
      return
    }
    const sidebar = document.querySelector('.Layout-sidebar')
    if (sidebar) {
      await injectButton(sidebar, context)
    }
    return
  }
}
