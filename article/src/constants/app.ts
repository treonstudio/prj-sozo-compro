// App-wide constants

// Breakpoints
export const BREAKPOINTS = {
  MOBILE: 600,
  TABLET: 900,
} as const

// Pagination
export const PAGINATION = {
  PER_PAGE: 9,
  CAROUSEL_ITEMS: 10,
  CATEGORY_PREVIEW: 3,
  CAROUSEL_GROUP_SIZE: 3,
} as const

// Timing
export const TIMING = {
  DEBOUNCE_DELAY: 1000,
  HEIGHT_SYNC_DELAY: 500,
  TOAST_DURATION: 2000,
  RESIZE_OBSERVER_INTERVAL: 1500,
} as const

// Feature Flags
export const FEATURES = {
  ENABLE_MODAL: false, // Set to true to use in-app modal reader
} as const

// External URLs
export const EXTERNAL_URLS = {
  WORDPRESS_BASE: 'https://sozo.treonstudio.com',
  getCategoryUrl: (slug: string) => `https://sozo.treonstudio.com/category/${slug}`,
} as const

// Message Types for WordPress iframe communication
export const MESSAGE_TYPES = {
  TOGGLE_EXPAND: 'TOGGLE_EXPAND',
  IFRAME_READY: 'IFRAME_READY',
  REACT_APP_HEIGHT: 'REACT_APP_HEIGHT',
} as const

// Query Stale Times (in milliseconds)
export const CACHE_TIMES = {
  POSTS: 5 * 60 * 1000, // 5 minutes
  CATEGORIES: 30 * 60 * 1000, // 30 minutes
  SEARCH: 2 * 60 * 1000, // 2 minutes
} as const
