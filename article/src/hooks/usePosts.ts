import React from 'react'
import { useQuery, useInfiniteQuery, UseQueryResult, UseInfiniteQueryResult } from '@tanstack/react-query'
import { postsApi, categoriesApi, WPPost, WPCategory, PostsQueryParams } from '../services/api'

// Query Keys
export const QUERY_KEYS = {
  POSTS: 'posts',
  POST: 'post',
  POSTS_BY_CATEGORY: 'posts-by-category',
  SEARCH_POSTS: 'search-posts',
  CATEGORIES: 'categories',
  CATEGORY: 'category',
} as const

// Custom hooks for posts
export const usePosts = (
  params?: PostsQueryParams,
  options?: { enabled?: boolean }
): UseQueryResult<WPPost[], Error> => {
  return useQuery({
    queryKey: [QUERY_KEYS.POSTS, params],
    queryFn: () => postsApi.getPosts(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export const usePost = (id: number): UseQueryResult<WPPost, Error> => {
  return useQuery({
    queryKey: [QUERY_KEYS.POST, id],
    queryFn: () => postsApi.getSinglePost(id),
    enabled: !!id, // Only run if id exists
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  })
}

export const usePostsByCategory = (
  categoryId?: number,
  params?: PostsQueryParams
): UseQueryResult<WPPost[], Error> => {
  return useQuery({
    queryKey: [QUERY_KEYS.POSTS_BY_CATEGORY, categoryId, params],
    queryFn: () => postsApi.getPostsByCategory(categoryId!, params),
    enabled: !!categoryId, // Only run if category ID exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  })
}

// Infinite query for posts with pagination
export const useInfinitePosts = (
  params?: Omit<PostsQueryParams, 'per_page'>,
  options?: { enabled?: boolean }
) => {
  const PER_PAGE = 9

  return useInfiniteQuery({
    queryKey: ['posts-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const result = await postsApi.getPosts({
          ...params,
          per_page: PER_PAGE,
          page: pageParam
        })
        return result
      } catch (error: any) {
        // If we get a 400 error about invalid page number, return empty array
        if (error.response?.status === 400 && error.response?.data?.code === 'rest_post_invalid_page_number') {
          return []
        }
        throw error
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      // If last page has less than PER_PAGE items or is empty, no more pages
      if (!lastPage || lastPage.length === 0 || lastPage.length < PER_PAGE) {
        return undefined
      }
      return allPages.length + 1
    },
    initialPageParam: 1,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Don't retry on 400 errors (invalid page number)
      if (error.response?.status === 400) {
        return false
      }
      return failureCount < 2
    },
  })
}

// Infinite query for posts by category with pagination
export const useInfinitePostsByCategory = (
  categoryId?: number,
  params?: Omit<PostsQueryParams, 'per_page' | 'categories'>
) => {
  const PER_PAGE = 9

  return useInfiniteQuery({
    queryKey: ['posts-by-category-infinite', categoryId, params],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        const result = await postsApi.getPostsByCategory(categoryId!, {
          ...params,
          per_page: PER_PAGE,
          page: pageParam
        })
        return result
      } catch (error: any) {
        // If we get a 400 error about invalid page number, return empty array
        if (error.response?.status === 400 && error.response?.data?.code === 'rest_post_invalid_page_number') {
          return []
        }
        throw error
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      // If last page has less than PER_PAGE items or is empty, no more pages
      if (!lastPage || lastPage.length === 0 || lastPage.length < PER_PAGE) {
        return undefined
      }
      return allPages.length + 1
    },
    initialPageParam: 1,
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Don't retry on 400 errors (invalid page number)
      if (error.response?.status === 400) {
        return false
      }
      // Retry other errors up to 2 times
      return failureCount < 2
    },
  })
}

export const useSearchPosts = (
  query?: string,
  params?: PostsQueryParams
): UseQueryResult<WPPost[], Error> => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS, query, params],
    queryFn: () => postsApi.searchPosts(query!, params),
    enabled: !!query && query.trim().length > 0, // Only run if query exists and not empty
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

// Utility hook for filtering posts client-side (alternative to API filtering)
export const useFilteredPosts = (
  posts: WPPost[] | undefined,
  filters: {
    categoryName?: string
    searchTerm?: string
    limit?: number
  }
) => {
  if (!posts) return []

  let filteredPosts = [...posts]

  // Filter by category
  if (filters.categoryName) {
    filteredPosts = filteredPosts.filter((post) => {
      const terms = post._embedded?.['wp:term']?.flat() || []
      return terms.some(
        (term) =>
          term.taxonomy === 'category' &&
          term.name?.toLowerCase() === filters.categoryName!.toLowerCase()
      )
    })
  }

  // Filter by search term
  if (filters.searchTerm) {
    const query = filters.searchTerm.toLowerCase().trim()
    if (query) {
      filteredPosts = filteredPosts.filter((post) => {
        const title = (post.title?.rendered || '').toLowerCase()
        const excerpt = stripHtml(post.excerpt?.rendered || '').toLowerCase()
        return title.includes(query) || excerpt.includes(query)
      })
    }
  }

  // Apply limit
  if (filters.limit) {
    filteredPosts = filteredPosts.slice(0, filters.limit)
  }

  return filteredPosts
}

// Categories hooks
export const useCategories = (): UseQueryResult<WPCategory[], Error> => {
  return useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: () => categoriesApi.getCategories(),
    select: (data) => data.filter(
      (c) => c.slug.toLowerCase() !== 'uncategorized' && c.name.toLowerCase() !== 'uncategorized'
    ),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  })
}

export const useCategory = (id: number): UseQueryResult<WPCategory, Error> => {
  return useQuery({
    queryKey: [QUERY_KEYS.CATEGORY, id],
    queryFn: () => categoriesApi.getCategory(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  })
}

// Helper function to build tabs from categories
export const useCategoriesAsTabs = () => {
  const { data: categories, isLoading, error } = useCategories()

  const tabs = React.useMemo(() => {
    if (!categories) return []

    // Add "Semua Artikel" as first tab
    const allTab = { id: 'all', label: 'Semua Artikel' }

    // Convert categories to tabs
    const categoryTabs = categories.map(category => ({
      id: category.slug,
      label: category.name,
      count: category.count,
    }))

    return [allTab, ...categoryTabs]
  }, [categories])

  return { tabs, isLoading, error }
}

// Helper function (moved from component)
const stripHtml = (html?: string) => {
  if (!html) return ''
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return (tmp.textContent || tmp.innerText || '').trim()
}