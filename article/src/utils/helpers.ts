import { WPPost } from '../services/api'

/**
 * Strip HTML tags from string
 */
export const stripHtml = (html?: string): string => {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').trim()
}

/**
 * Format ISO date to Indonesian locale
 */
export const formatDate = (iso?: string): string => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

/**
 * Get featured image URL from post
 */
export const getFeaturedImage = (post: WPPost): string | undefined => {
  return post._embedded?.['wp:featuredmedia']?.[0]?.source_url
}

/**
 * Get category name from post
 */
export const getCategoryName = (post: WPPost): string => {
  const terms = post._embedded?.['wp:term']?.flat() || []
  const cat = terms.find((t) => t.taxonomy === 'category')
  return cat?.name || 'Artikel'
}

/**
 * Calculate document height for iframe communication
 */
export const getDocumentHeight = (): number => {
  const doc = document
  return Math.max(
    doc.body.scrollHeight,
    doc.documentElement.scrollHeight,
    doc.body.offsetHeight,
    doc.documentElement.offsetHeight,
    doc.body.clientHeight,
    doc.documentElement.clientHeight
  )
}

/**
 * Check if running inside iframe
 */
export const isInIframe = (): boolean => {
  return window.self !== window.top
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Get parent origin from URL params or referrer
 */
export const getParentOrigin = (): string => {
  try {
    const params = new URLSearchParams(window.location.search)
    const fromParam = params.get('wpOrigin') || params.get('parent')
    if (fromParam) return new URL(fromParam).origin
  } catch {}

  try {
    if (document.referrer) return new URL(document.referrer).origin
  } catch {}

  // Optional: fallback to env if provided
  // @ts-ignore
  const envOrigin =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_WP_ORIGIN
      ? import.meta.env.VITE_WP_ORIGIN
      : ''
  if (envOrigin) {
    try {
      return new URL(envOrigin).origin
    } catch {}
  }

  return ''
}

/**
 * Check if theme is dark mode
 */
export const isDarkTheme = (): boolean => {
  return new URLSearchParams(window.location.search).get('theme') === 'dark'
}

/**
 * Copy text to clipboard with fallback
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
  } else {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

/**
 * Share using Web Share API or fallback to clipboard
 */
export const shareContent = async (
  title: string,
  url: string
): Promise<'shared' | 'copied'> => {
  if ((navigator as any).share) {
    await (navigator as any).share({ title, url })
    return 'shared'
  } else {
    await copyToClipboard(url)
    return 'copied'
  }
}
