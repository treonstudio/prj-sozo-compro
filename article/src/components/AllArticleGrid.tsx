import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/pagination'
import { usePosts, usePost, useFilteredPosts, usePostsByCategory, useInfinitePosts, useInfinitePostsByCategory, useInfiniteSearchPosts, useInfiniteSearchPostsByCategory } from '../hooks/usePosts'
import { WPPost } from '../services/api'
import { useStore } from '../store/useStore'

type Props = {
  categoryId?: number
  categoryName?: string
  searchTerm?: string
  limit?: number
  enableCarousel?: boolean
  randomize?: boolean
}

export const AllArticleGrid: React.FC<Props> = ({ categoryId, categoryName, searchTerm, limit, enableCarousel = true, randomize = false }) => {
  // Use Zustand store
  const { isMobile, modalPostId, setModalPostId } = useStore()

  // Feature toggle: set to true to use in-app modal reader; false to open posts in a new tab
  const ENABLE_MODAL = false

  // Determine query strategy based on props
  const hasSearchTerm = !!searchTerm && searchTerm.trim().length > 0
  const hasLimit = typeof limit === 'number'
  const shouldUseInfiniteQuery = !enableCarousel && !hasLimit
  const isSearchInCategory = hasSearchTerm && !!categoryId && !hasLimit
  const isSearchAll = hasSearchTerm && !categoryId && !hasLimit

  // Infinite query for search in category
  const {
    data: searchCategoryData,
    isLoading: searchCategoryLoading,
    error: searchCategoryError,
    fetchNextPage: searchCategoryFetchNext,
    hasNextPage: searchCategoryHasNext,
    isFetchingNextPage: searchCategoryFetching,
  } = useInfiniteSearchPostsByCategory(
    isSearchInCategory ? searchTerm : undefined,
    categoryId,
    {}
  )

  // Infinite query for search all
  const {
    data: searchAllData,
    isLoading: searchAllLoading,
    error: searchAllError,
    fetchNextPage: searchAllFetchNext,
    hasNextPage: searchAllHasNext,
    isFetchingNextPage: searchAllFetching,
  } = useInfiniteSearchPosts(
    isSearchAll ? searchTerm : undefined,
    {}
  )

  // Infinite query for category pagination (no search)
  const {
    data: infiniteData,
    isLoading: infiniteLoading,
    error: infiniteError,
    fetchNextPage: infiniteFetchNext,
    hasNextPage: infiniteHasNext,
    isFetchingNextPage: infiniteFetching,
  } = useInfinitePostsByCategory(
    shouldUseInfiniteQuery && !hasSearchTerm && categoryId ? categoryId : undefined,
    {}
  )

  // Regular query for carousel mode or limited items
  const {
    data: allPosts,
    isLoading: loading,
    error,
  } = categoryId && hasLimit
    ? usePostsByCategory(categoryId, { per_page: limit || 10 })
    : usePosts(
        { per_page: 10 },
        { enabled: (enableCarousel && !hasSearchTerm) || hasLimit }
      )

  // Determine which data to use based on current mode
  let isLoading: boolean
  let queryError: Error | null
  let posts: any[]
  let fetchNextPage: (() => void) | undefined
  let hasNextPage: boolean | undefined
  let isFetchingNextPage: boolean

  if (hasLimit) {
    // For limited items (carousel sections in "All" tab), use regular query without pagination
    isLoading = loading
    queryError = error
    posts = allPosts || []
    fetchNextPage = undefined
    hasNextPage = undefined
    isFetchingNextPage = false
  } else if (isSearchInCategory) {
    isLoading = searchCategoryLoading
    queryError = searchCategoryError
    posts = searchCategoryData?.pages.flatMap(page => page) || []
    fetchNextPage = searchCategoryFetchNext
    hasNextPage = searchCategoryHasNext
    isFetchingNextPage = searchCategoryFetching
  } else if (isSearchAll) {
    isLoading = searchAllLoading
    queryError = searchAllError
    posts = searchAllData?.pages.flatMap(page => page) || []
    fetchNextPage = searchAllFetchNext
    hasNextPage = searchAllHasNext
    isFetchingNextPage = searchAllFetching
  } else if (shouldUseInfiniteQuery && categoryId) {
    isLoading = infiniteLoading
    queryError = infiniteError
    posts = infiniteData?.pages.flatMap(page => page) || []
    fetchNextPage = infiniteFetchNext
    hasNextPage = infiniteHasNext
    isFetchingNextPage = infiniteFetching
  } else {
    isLoading = loading
    queryError = error
    posts = allPosts || []
    fetchNextPage = undefined
    hasNextPage = undefined
    isFetchingNextPage = false
  }

  // React Query for single post modal
  const { data: modalPost, isLoading: modalLoading } = usePost(modalPostId || 0)
  const [toast, setToast] = React.useState<string | null>(null)
  const [swiperRef, setSwiperRef] = React.useState<any>(null)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const [animOpen, setAnimOpen] = React.useState(false)
  const isDark = React.useMemo(() => new URLSearchParams(window.location.search).get('theme') === 'dark', [])

  // Carousel settings - responsive
  // Desktop: max 10 items, 3 per slide with 0.5 peek
  // Mobile: max 10 items, 1 per slide
  const MAX_ITEMS = typeof limit === 'number' ? limit : 10
  const ITEMS_PER_SLIDE = isMobile ? 1 : 3

  // When modal open/close or loading changes, ask parent to resize iframe
  React.useEffect(() => {
    const sendHeight = () => {
      try {
        const doc = document
        const height = Math.max(
          doc.body.scrollHeight,
          doc.documentElement.scrollHeight,
          doc.body.offsetHeight,
          doc.documentElement.offsetHeight,
          doc.body.clientHeight,
          doc.documentElement.clientHeight,
        )
        if (window.self !== window.top) {
          window.parent.postMessage({ type: 'REACT_APP_HEIGHT', height, isExpanded: true }, '*')
        }
      } catch {}
    }
    sendHeight()
    const t = setTimeout(sendHeight, 500)
    return () => clearTimeout(t)
  }, [modalPost, modalLoading])

  // Observe size changes of the modal panel to keep parent height in sync
  React.useEffect(() => {
    if (!modalPost || !panelRef.current) return
    const send = () => {
      try {
        const doc = document
        const height = Math.max(
          doc.body.scrollHeight,
          doc.documentElement.scrollHeight,
          doc.body.offsetHeight,
          doc.documentElement.offsetHeight,
          doc.body.clientHeight,
          doc.documentElement.clientHeight,
        )
        if (window.self !== window.top) {
          window.parent.postMessage({ type: 'REACT_APP_HEIGHT', height, isExpanded: true }, '*')
        }
      } catch {}
    }
    const ro = new ResizeObserver(() => send())
    ro.observe(panelRef.current)
    const timer = setInterval(send, 1500)
    return () => { ro.disconnect(); clearInterval(timer) }
  }, [modalPost])

  // Close with ESC
  React.useEffect(() => {
    if (!modalPost) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalPostId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalPost])

  // Animate open
  React.useEffect(() => {
    if (modalPost) {
      requestAnimationFrame(() => setAnimOpen(true))
    } else {
      setAnimOpen(false)
    }
  }, [modalPost])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  // Use filtered posts; if randomize, fetch without limit, then shuffle and slice
  // Note: When using search queries, we don't use client-side filtering
  const baseItems = hasSearchTerm ? posts : useFilteredPosts(posts, {
    categoryName: categoryId ? undefined : categoryName,
    searchTerm: undefined, // Don't filter again client-side when using search API
    limit: randomize ? undefined : MAX_ITEMS,
  })

  const items = React.useMemo(() => {
    if (!randomize) return baseItems
    // Fisher-Yates shuffle
    const arr = [...baseItems]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return typeof MAX_ITEMS === 'number' ? arr.slice(0, MAX_ITEMS) : arr
  }, [baseItems, randomize, MAX_ITEMS])

  const findIndexById = (id: number) => items.findIndex(x => x.id === id)
  const gotoSibling = (dir: 1 | -1) => {
    if (!modalPost) return
    const idx = findIndexById(modalPost.id)
    if (idx < 0) return
    const nextIdx = idx + dir
    if (nextIdx < 0 || nextIdx >= items.length) return
    const nextPost = items[nextIdx]
    setModalPostId(nextPost.id)
  }

  const shareCurrent = async () => {
    if (!modalPost) return
    const url = modalPost.link
    const title = stripHtml(modalPost.title?.rendered || 'Artikel')
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title, url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        showToast('Tautan disalin')
      } else {
        const ta = document.createElement('textarea')
        ta.value = url
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        showToast('Tautan disalin')
      }
    } catch {}
  }

  // Close modal
  const closeModal = () => {
    setModalPostId(null)
  }

  const getThumb = (p: WPPost) => p._embedded?.['wp:featuredmedia']?.[0]?.source_url
  const getCategory = (p: WPPost) => {
    const terms = p._embedded?.['wp:term']?.flat() || []
    const cat = terms.find(t => t.taxonomy === 'category')
    return cat?.name || 'Artikel'
  }

  const stripHtml = (html?: string) => {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return (tmp.textContent || tmp.innerText || '').trim()
  }

  const formatDate = (iso?: string) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch {
      return ''
    }
  }

  // Skeleton component
  const SkeletonCard = () => (
    <div className="skeleton-card">
      <div className="skeleton-thumb"></div>
      <div className="skeleton-body">
        <div className="skeleton-badge"></div>
        <div className="skeleton-title"></div>
        <div className="skeleton-title-short"></div>
        <div className="skeleton-excerpt"></div>
        <div className="skeleton-excerpt"></div>
        <div className="skeleton-meta"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  )

  // Handle loading state
  if (isLoading) {
    return (
      <div className="carousel-container">
        <div className="skeleton-grid">
          {Array.from({ length: isMobile ? 1 : 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
        <style>{`
          .carousel-container {
            position: relative;
            margin: 16px 0;
          }

          .skeleton-grid {
            display: grid;
            grid-template-columns: repeat(${isMobile ? 1 : 3}, 1fr);
            gap: 16px;
          }

          .skeleton-card {
            background: #fff;
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .skeleton-thumb {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 200px;
          }

          .skeleton-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .skeleton-badge {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 20px;
            width: 80px;
            border-radius: 6px;
          }

          .skeleton-title {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 20px;
            width: 100%;
            border-radius: 4px;
          }

          .skeleton-title-short {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 20px;
            width: 70%;
            border-radius: 4px;
          }

          .skeleton-excerpt {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 16px;
            width: 100%;
            border-radius: 4px;
          }

          .skeleton-meta {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 14px;
            width: 60%;
            border-radius: 4px;
          }

          .skeleton-button {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            height: 40px;
            width: 100%;
            border-radius: 999px;
            margin-top: 8px;
          }

          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }

          @media (max-width: 900px) {
            .skeleton-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .skeleton-thumb {
              height: 160px;
            }
          }

          @media (max-width: 600px) {
            .skeleton-grid {
              grid-template-columns: 1fr;
            }
            .skeleton-thumb {
              height: 200px;
            }
          }
        `}</style>
      </div>
    )
  }

  // Handle error state
  if (queryError) {
    return <p className="muted">Terjadi kesalahan: {queryError.message}</p>
  }

  // Determine if carousel needed
  const needsCarousel = enableCarousel && items.length > ITEMS_PER_SLIDE

  const renderArticleCard = (p: WPPost) => (
    <article key={p.id} className="carousel-card">
      {getThumb(p) ? (
        <img className="carousel-thumb-img" src={getThumb(p)!} alt="" loading="lazy" />
      ) : (
        <div className="carousel-thumb" />
      )}
      <div className="carousel-body">
        <h3 className="carousel-title" dangerouslySetInnerHTML={{ __html: p.title.rendered }} />
        {p.excerpt?.rendered && (
          <p className="carousel-excerpt">{stripHtml(p.excerpt.rendered).slice(0, 120)}…</p>
        )}
        <p className="carousel-meta">{formatDate(p.date)} • 4 min read</p>
        <a
          className="link"
          href={p.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={async (e) => {
            if (!ENABLE_MODAL) return
            try {
              e.preventDefault()
              setModalPostId(p.id)
            } catch (err) {
              window.open(p.link, '_blank', 'noopener,noreferrer')
              return
            }
            try {
              const doc = document
              const height = Math.max(
                doc.body.scrollHeight,
                doc.documentElement.scrollHeight,
                doc.body.offsetHeight,
                doc.documentElement.offsetHeight,
                doc.body.clientHeight,
                doc.documentElement.clientHeight,
              )
              if (window.self !== window.top) {
                window.parent.postMessage({ type: 'REACT_APP_HEIGHT', height, isExpanded: true }, '*')
              }
            } catch {}
          }}
        >
          Baca selengkapnya
        </a>
      </div>
    </article>
  )

  return (
    <div className="carousel-container">
      {needsCarousel ? (
        <div className="carousel-wrapper">
          <Swiper
            modules={[Pagination]}
            spaceBetween={16}
            slidesPerView={isMobile ? 1 : 3.5}
            slidesPerGroup={isMobile ? 1 : 3}
            allowTouchMove={true}
            speed={300}
            onSwiper={(sw) => setSwiperRef(sw)}
            onSlideChange={(sw) => setActiveIndex(sw.activeIndex)}
            className="articles-swiper"
            breakpoints={{
              320: {
                slidesPerView: 1,
                slidesPerGroup: 1,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 2.5,
                slidesPerGroup: 2,
                spaceBetween: 16,
              },
              1024: {
                slidesPerView: 3.5,
                slidesPerGroup: 3,
                spaceBetween: 16,
              },
            }}
          >
          {items.map((post) => (
            <SwiperSlide key={post.id}>
              {renderArticleCard(post)}
            </SwiperSlide>
          ))}
        </Swiper>
        </div>
      ) : (
        <>
          <div className="static-grid">
            {items.map(renderArticleCard)}
          </div>

          {/* Load More Button for infinite query */}
          {hasNextPage && fetchNextPage && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="load-more-btn"
              >
                {isFetchingNextPage ? 'Memuat...' : 'Muat Lebih Banyak'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Custom Controls */}
      {needsCarousel && (
        <div className="carousel-controls">
          <div className="swiper-pagination-custom">
            {(() => {
              const totalSlides = items.length
              const slidesPerGroup = isMobile ? 1 : 3
              const slidesPerView = isMobile ? 1 : 3.5

              // Calculate number of dots based on valid slide positions
              // For 10 items with 3.5 view and group of 3:
              // - Position 0: shows items 0,1,2 + peek 3
              // - Position 3: shows items 3,4,5 + peek 6
              // - Position 6: shows items 6,7,8 + peek 9
              // Total = 3 dots (last group starts at index 6, which is 10-3-1 = 6)
              //
              // Formula: How many full groups can we show?
              // We need at least slidesPerGroup items remaining to show a full group
              // Last valid start position = totalSlides - slidesPerGroup
              // Number of groups = floor(lastPosition / slidesPerGroup) + 1
              const lastValidPosition = Math.max(0, totalSlides - slidesPerGroup)
              const totalPages = Math.floor(lastValidPosition / slidesPerGroup) + 1

              // Determine which dot should be active based on activeIndex
              const currentPage = Math.min(
                Math.floor(activeIndex / slidesPerGroup),
                totalPages - 1
              )

              return Array.from({ length: totalPages }).map((_, idx) => {
                const isActive = idx === currentPage
                return (
                  <span
                    key={idx}
                    className={`swiper-pagination-bullet${isActive ? ' swiper-pagination-bullet-active' : ''}`}
                    onClick={() => {
                      if (swiperRef) {
                        // Slide to the start of the group
                        const targetIndex = idx * slidesPerGroup
                        swiperRef.slideTo(targetIndex)
                      }
                    }}
                  />
                )
              })
            })()}
          </div>
          <div className="navigation-buttons">
            <button
              className="swiper-button-prev-custom"
              onClick={() => {
                if (swiperRef && !swiperRef.isBeginning) {
                  swiperRef.slidePrev()
                }
              }}
              disabled={!swiperRef || activeIndex === 0}
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              className="swiper-button-next-custom"
              onClick={() => {
                if (swiperRef && !swiperRef.isEnd) {
                  swiperRef.slideNext()
                }
              }}
              disabled={!swiperRef || (swiperRef && swiperRef.isEnd)}
            >
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* Modal same as ArticleGrid */}
      {modalPost && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
          style={{
            position: 'fixed', inset: 0,
            background: isDark ? '#0b0f14' : '#ffffff',
            display: 'flex', alignItems: 'stretch', justifyContent: 'stretch', zIndex: 9999,
            opacity: animOpen ? 1 : 0,
            transition: 'opacity 180ms ease',
          }}
        >
          <div
            className="modal-panel"
            ref={panelRef}
            style={{
              background: isDark ? '#0b0f14' : '#fff', width: '100%', height: '100vh',
              color: isDark ? '#e6edf3' : '#111827',
              overflow: 'auto', WebkitOverflowScrolling: 'touch' as any,
              transform: animOpen ? 'translateY(0)' : 'translateY(8px)',
              transition: 'transform 220ms ease',
            }}
          >
            <div style={{ position: 'sticky', top: 0, zIndex: 2, background: isDark ? '#0b0f14' : '#fff', borderBottom: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', gap: 8 }}>
                <h3 style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: modalPost.title?.rendered || 'Artikel' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => gotoSibling(-1)} disabled={findIndexById(modalPost.id) <= 0}
                    style={{ background: 'transparent', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer', color: 'inherit' }}>Sebelumnya</button>
                  <button onClick={() => gotoSibling(1)} disabled={findIndexById(modalPost.id) >= items.length - 1}
                    style={{ background: 'transparent', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer', color: 'inherit' }}>Berikutnya</button>
                  <button onClick={shareCurrent}
                    style={{ background: isDark ? '#111827' : '#f3f4f6', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer', color: 'inherit' }}>Bagikan</button>
                  <button
                    aria-label="Tutup"
                    onClick={closeModal}
                    style={{ background: 'transparent', border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`, borderRadius: 8, padding: '6px 10px', fontSize: 14, cursor: 'pointer', color: 'inherit' }}
                  >Tutup ✕</button>
                </div>
              </div>
            </div>
            <div style={{ padding: 16, maxWidth: 860, margin: '0 auto' }}>
              {modalLoading ? (
                <p>Memuat…</p>
              ) : (
                <div>
                  {getThumb(modalPost) && (
                    <img src={getThumb(modalPost)!} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />
                  )}
                  <p className="badge" style={{ marginBottom: 8 }}>{getCategory(modalPost)}</p>
                  <p className="carousel-meta" style={{ marginTop: 0 }}>{formatDate(modalPost.date)} • 4 min read</p>
                  <div className="modal-content" style={{ lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: (modalPost.content?.rendered || modalPost.excerpt?.rendered || '') }} />
                  <style>
                    {`
                    .modal-content h1,.modal-content h2,.modal-content h3{margin:1.2em 0 .6em}
                    .modal-content p{margin:0 0 1em}
                    .modal-content img{max-width:100%;height:auto;border-radius:8px;margin:12px 0}
                    .modal-content ul{padding-left:1.25rem;margin:0 0 1em}
                    .modal-content ol{padding-left:1.25rem;margin:0 0 1em}
                    .modal-content blockquote{border-left:4px solid #e5e7eb;padding:.5em 1em;margin:1em 0;color:#4b5563}
                    ${isDark ? `.modal-content blockquote{border-left-color:#374151;color:#9ca3af}` : ''}
                    .modal-content a{color:#2563eb;text-decoration:underline}
                    ${isDark ? `.modal-content a{color:#60a5fa}` : ''}
                    `}
                  </style>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#fff', borderRadius: 9999, padding: '8px 14px', fontSize: 14, zIndex: 10000, opacity: 0.95 }}>{toast}</div>
      )}

      <style>{`
        .carousel-container {
          position: relative;
          margin: 16px 0;
        }

        .carousel-wrapper {
          overflow: hidden;
          position: relative;
        }

        .load-more-btn {
          background: #1A2080;
          color: white;
          border: none;
          border-radius: 999px;
          padding: 12px 32px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(26, 32, 128, 0.2);
        }

        .load-more-btn:hover:not(:disabled) {
          background: #151a66;
          box-shadow: 0 4px 12px rgba(26, 32, 128, 0.3);
          transform: translateY(-1px);
        }

        .load-more-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .load-more-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .articles-swiper {
          overflow: visible;
          margin: 0;
        }

        .swiper-slide {
          height: auto;
          box-sizing: border-box;
          display: flex;
        }

        .swiper-wrapper {
          align-items: stretch;
        }

        .static-grid {
          display: grid;
          grid-template-columns: repeat(${isMobile ? 1 : 3}, 1fr);
          gap: 16px;
        }

        .carousel-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }

        .carousel-thumb {
          background: linear-gradient(135deg,#bae6fd,#93c5fd);
          height: 200px;
        }

        .carousel-thumb-img {
          display: block;
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .carousel-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
        }

        /* Keep the CTA aligned at the bottom for consistent card heights */
        .carousel-body .link {
          margin-top: auto;
          align-self: stretch;
          text-align: center;
        }

        .carousel-title {
          margin: 0 0 8px;
          font-size: 16px;
          line-height: 1.3;
        }

        .carousel-excerpt {
          margin: 0 0 10px;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.4;
        }

        .carousel-meta {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 12px;
        }

        .carousel-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: nowrap;
          flex-direction: row !important;
          white-space: nowrap;
          margin-top: 8px;
          width: 100%;
          min-height: 36px;
        }

        /* Keep pagination inline so it can sit next to arrows on the right */
        .carousel-controls .swiper-pagination-custom,
        .carousel-controls .swiper-pagination-custom.swiper-pagination-bullets {
          display: inline-flex !important;
          width: auto !important;
          margin: 0 !important;
          align-items: center;
          flex: 0 1 auto;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          box-sizing: border-box;
          max-width: calc(100% - 140px); /* reserve extra room for buttons + gap */
          line-height: 1;
          padding: 0;
        }

        .navigation-buttons {
          display: flex;
          gap: 8px;
          flex: 0 0 auto;
        }

        .swiper-button-prev-custom,
        .swiper-button-next-custom {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--border);
          border-radius: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.2s ease;
          color: inherit;
        }

        .swiper-button-prev-custom:hover,
        .swiper-button-next-custom:hover {
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .swiper-button-prev-custom:disabled,
        .swiper-button-next-custom:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Custom pagination styles */
        .swiper-pagination-custom {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: nowrap;
          line-height: 1;
          padding: 0;
        }

        :global(.swiper-pagination-custom .swiper-pagination-bullet) {
          width: 12px !important;
          height: 12px !important;
          border-radius: 50% !important;
          border: none !important;
          background: #d1d5db !important;
          cursor: pointer;
          transition: all 0.3s ease !important;
          opacity: 1 !important;
          transform: scale(1) !important;
          margin: 0 !important;
        }

        :global(.swiper-pagination-custom .swiper-pagination-bullet-active) {
          background: #1e40af !important;
          width: 20px !important;
          height: 20px !important;
        }

        :global(.swiper-pagination-custom .swiper-pagination-bullet:hover) {
          background: #9ca3af !important;
        }

        :global(.swiper-pagination-custom .swiper-pagination-bullet-active:hover) {
          background: #1e40af !important;
        }

        .swiper-pagination-custom .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
        }

        .swiper-pagination-custom .swiper-pagination-bullet-active {
          width: 20px;
          height: 20px;
          background-color: #1A2080;
        }
          

        @media (max-width: 900px) {
          .slide-grid, .static-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .carousel-thumb,
          .carousel-thumb-img {
            height: 160px;
          }
        }

        @media (max-width: 600px) {
          .slide-grid, .static-grid {
            grid-template-columns: 1fr;
          }

          .carousel-thumb,
          .carousel-thumb-img {
            height: 200px;
          }

          .carousel-controls {
            flex-direction: row !important;
            justify-content: space-between;
            gap: 10px;
            align-items: center;
            flex-wrap: nowrap;
            white-space: nowrap;
            width: 100%;
            min-height: 32px;
            margin-top: 8px;
          }

          .carousel-controls .swiper-pagination-custom,
          .carousel-controls .swiper-pagination-custom.swiper-pagination-bullets {
            display: inline-flex !important;
            width: auto !important;
            margin: 0 !important;
            align-items: center;
            flex: 0 1 auto;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            box-sizing: border-box;
            max-width: calc(100% - 120px); /* reserve extra room on mobile */
            line-height: 1;
            padding: 0;
          }

          .swiper-button-prev-custom,
          .swiper-button-next-custom {
            width: 40px;
            height: 40px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}