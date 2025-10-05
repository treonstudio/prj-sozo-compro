import axios from 'axios'
import { API_CONFIG } from '../constants/api'

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.message)
    return Promise.reject(error)
  }
)

// Types
export type WPPost = {
  id: number
  link: string
  date?: string
  title: { rendered: string }
  excerpt?: { rendered: string }
  content?: { rendered: string }
  categories?: number[]
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url?: string }>
    'wp:term'?: Array<Array<{ taxonomy: string; name: string }>>
  }
}

export type WPCategory = {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: string
  parent: number
  meta: any[]
  _links: any
}

export type PostsQueryParams = {
  _embed?: boolean
  per_page?: number
  categories?: number
  search?: string
  [key: string]: any
}

// API Functions
export const postsApi = {
  // Get all posts with default params
  getPosts: async (params?: PostsQueryParams): Promise<WPPost[]> => {
    const defaultParams = {
      _embed: true,
      per_page: 10,
      ...params,
    }

    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}`, {
      params: defaultParams,
    })

    return response.data
  },

  // Get single post by ID
  getSinglePost: async (id: number): Promise<WPPost> => {
    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}/${id}`, {
      params: { _embed: 1 },
    })

    return response.data
  },

  // Get posts by category
  getPostsByCategory: async (categoryId: number, params?: PostsQueryParams): Promise<WPPost[]> => {
    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}`, {
      params: {
        _embed: true,
        per_page: 10,
        categories: categoryId, // WordPress expects category ID (integer)
        ...params,
      },
    })

    return response.data
  },

  // Search posts
  searchPosts: async (query: string, params?: PostsQueryParams): Promise<WPPost[]> => {
    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}`, {
      params: {
        _embed: true,
        per_page: 10,
        search: query,
        ...params,
      },
    })

    return response.data
  },
}

// Categories API
export const categoriesApi = {
  // Get all categories
  getCategories: async (params?: { per_page?: number; hide_empty?: boolean }): Promise<WPCategory[]> => {
    const defaultParams = {
      per_page: 10, // Get all categories
      hide_empty: true, // Only show categories with posts
      ...params,
    }

    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.CATEGORIES_ENDPOINT}`, {
      params: defaultParams,
    })

    return response.data
  },

  // Get single category by ID
  getCategory: async (id: number): Promise<WPCategory> => {
    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.CATEGORIES_ENDPOINT}/${id}`)
    return response.data
  },
}

// Search API using WordPress Search REST API
export type WPSearchResult = {
  id: number
  title: string
  url: string
  type: string
  subtype: string
  _links: any
}

export type SearchQueryParams = {
  search: string
  per_page?: number
  page?: number
  subtype?: string // 'post', 'page', etc.
  [key: string]: any
}

export const searchApi = {
  // Search using WordPress Search REST API
  search: async (params: SearchQueryParams): Promise<WPSearchResult[]> => {
    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}/search`, {
      params: {
        per_page: 10,
        subtype: 'post', // Only search posts
        ...params,
      },
    })

    return response.data
  },

  // Get full post details from search results
  getPostsFromSearchResults: async (searchResults: WPSearchResult[]): Promise<WPPost[]> => {
    if (searchResults.length === 0) return []

    // Extract post IDs from search results
    const postIds = searchResults.map(result => result.id)

    // Fetch full post details with _embed
    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}`, {
      params: {
        include: postIds.join(','),
        _embed: true,
        per_page: postIds.length,
      },
    })

    // Preserve the order from search results
    const postsMap = new Map(response.data.map((post: WPPost) => [post.id, post]))
    return postIds.map(id => postsMap.get(id)).filter(Boolean) as WPPost[]
  },

  // Combined search: search + fetch full posts in one function
  searchPosts: async (searchQuery: string, params?: Omit<SearchQueryParams, 'search'>): Promise<WPPost[]> => {
    const searchResults = await searchApi.search({
      search: searchQuery,
      ...params,
    })

    if (searchResults.length === 0) return []

    return await searchApi.getPostsFromSearchResults(searchResults)
  },
}