/** Lightweight i18n module with auto-detection and manual override support. */

import { en } from './locales/en'
import { zhCN } from './locales/zh-CN'

/** Supported locale codes. */
export type Locale = 'en' | 'zh-CN'

/** All available locale dictionaries. */
const locales: Record<Locale, Record<string, string>> = {
  'en': en,
  'zh-CN': zhCN,
}

/** Fallback order when a key is missing in the current locale. */
const fallbackLocale: Locale = 'en'

let currentLocale: Locale = 'en'

/**
 * Detect the browser UI language and map to a supported locale.
 * Uses chrome.i18n.getUILanguage() in extension context,
 * falls back to navigator.language in other contexts.
 */
export function detectLocale(): Locale {
  let lang = 'en'
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage) {
      lang = chrome.i18n.getUILanguage()
    } else if (typeof navigator !== 'undefined') {
      lang = navigator.language
    }
  } catch {
    lang = typeof navigator !== 'undefined' ? navigator.language : 'en'
  }

  if (lang.startsWith('zh')) return 'zh-CN'
  return 'en'
}

/** Set the current locale for all subsequent t() calls. */
export function setLocale(locale: Locale): void {
  currentLocale = locale
}

/** Get the current locale code. */
export function getLocale(): Locale {
  return currentLocale
}

/** Get the list of supported locales with display names. */
export function getSupportedLocales(): { code: Locale; label: string }[] {
  return [
    { code: 'en', label: 'English' },
    { code: 'zh-CN', label: '简体中文' },
  ]
}

/**
 * Translate a key with optional parameter interpolation.
 * Falls back to English, then to the key itself if not found.
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const dict = locales[currentLocale] ?? locales[fallbackLocale]
  let text = dict[key] ?? locales[fallbackLocale][key] ?? key

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }

  return text
}
