/** Cross-browser helpers for Chrome and Firefox WebExtension APIs. */

/** Relative path to the 128px toolbar / notification icon. */
export const EXTENSION_ICON_128 = 'src/assets/icon-128.png'

/** Options for a basic desktop notification. */
export interface DesktopNotificationOptions {
  title: string
  message: string
}

/**
 * Resolve an extension asset to an absolute URL.
 * Required by notifications API on Firefox.
 */
export function getExtensionAssetUrl(relativePath: string): string {
  return chrome.runtime.getURL(relativePath)
}

/**
 * Detect Firefox at runtime in extension contexts.
 * Uses user agent because both browsers expose the chrome namespace.
 */
export function isFirefox(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }
  return navigator.userAgent.includes('Firefox')
}

/**
 * Build notification options compatible with Chrome and Firefox.
 * Omits Chrome-only fields such as priority on Firefox.
 */
export function buildDesktopNotificationOptions(
  options: DesktopNotificationOptions,
): chrome.notifications.NotificationOptions<true> {
  const notification: chrome.notifications.NotificationOptions<true> = {
    type: 'basic',
    iconUrl: getExtensionAssetUrl(EXTENSION_ICON_128),
    title: options.title,
    message: options.message,
  }

  if (!isFirefox()) {
    notification.priority = 2
  }

  return notification
}

/**
 * Show a desktop notification and log create failures when present.
 */
export function showDesktopNotification(
  notificationId: string,
  options: DesktopNotificationOptions,
): void {
  chrome.notifications.create(
    notificationId,
    buildDesktopNotificationOptions(options),
    () => {
      const error = chrome.runtime.lastError
      if (error) {
        console.error('[ReleasePulse] Failed to create notification:', error.message)
      }
    },
  )
}

/**
 * Update extension toolbar badge for unread notification count.
 */
export function updateActionBadge(unreadCount: number): void {
  const text = unreadCount > 0 ? unreadCount.toString() : ''
  chrome.action.setBadgeText({ text })

  const color = unreadCount > 0 ? '#4338ca' : '#6b7280'
  chrome.action.setBadgeBackgroundColor({ color })
}
