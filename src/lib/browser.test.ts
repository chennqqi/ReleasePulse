import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  buildDesktopNotificationOptions,
  isFirefox,
  EXTENSION_ICON_128,
} from './browser'

describe('isFirefox', () => {
  const originalUserAgent = navigator.userAgent

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    })
  })

  it('returns true for Firefox user agent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Firefox/136.0',
      configurable: true,
    })
    expect(isFirefox()).toBe(true)
  })

  it('returns false for Chrome user agent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Chrome/136.0',
      configurable: true,
    })
    expect(isFirefox()).toBe(false)
  })
})

describe('buildDesktopNotificationOptions', () => {
  beforeEach(() => {
    vi.stubGlobal('chrome', {
      runtime: {
        getURL: (path: string) => `chrome-extension://test-id/${path}`,
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses absolute icon URL for notifications', () => {
    const options = buildDesktopNotificationOptions({
      title: 'Release v1.0',
      message: 'owner/repo',
    })

    expect(options.type).toBe('basic')
    expect(options.iconUrl).toBe(`chrome-extension://test-id/${EXTENSION_ICON_128}`)
    expect(options.title).toBe('Release v1.0')
    expect(options.message).toBe('owner/repo')
  })

  it('omits Chrome-only priority on Firefox', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Firefox/136.0',
      configurable: true,
    })

    const firefoxOptions = buildDesktopNotificationOptions({
      title: 'Tag',
      message: 'v2.0',
    })
    expect(firefoxOptions.priority).toBeUndefined()

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 Chrome/136.0',
      configurable: true,
    })

    const chromeOptions = buildDesktopNotificationOptions({
      title: 'Tag',
      message: 'v2.0',
    })
    expect(chromeOptions.priority).toBe(2)
  })
})
