import React from 'react'
import { Tabs } from './components/Tabs'
import { ArticleGrid } from './components/ArticleGrid'

export default function App() {
  const [activeTab, setActiveTab] = React.useState('tab-1')
  const [query, setQuery] = React.useState('')
  const [latestExpanded, setLatestExpanded] = React.useState(false)
  const [categoryExpanded, setCategoryExpanded] = React.useState(false)

  const categoryFromTab = (id: string): string | undefined => {
    if (id === 'tab-2') return 'Skincare Tips'
    if (id === 'tab-3') return 'Treatment Guide'
    if (id === 'tab-4') return 'Expert Opinion'
    return undefined
  }

  // Sync with URL hash
  React.useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && ['tab-1','tab-2','tab-3','tab-4'].includes(hash)) {
      setActiveTab(hash)
    }
    const onHashChange = () => {
      const h = window.location.hash.replace('#', '')
      if (h && ['tab-1','tab-2','tab-3','tab-4'].includes(h)) setActiveTab(h)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  React.useEffect(() => {
    if (window.location.hash.replace('#','') !== activeTab) {
      history.replaceState(null, '', `#${activeTab}`)
    }
  }, [activeTab])

  // Reset category expanded when switching tabs
  React.useEffect(() => {
    setCategoryExpanded(false)
  }, [activeTab])

  // Listen for messages from parent (WordPress) to toggle expansion
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Optionally validate origin
      // if (event.origin !== 'https://YOUR_WORDPRESS_DOMAIN') return;
      console.log('[RAD][React] message received from parent:', {
        origin: event.origin,
        data: event.data,
      })
      if (event.origin !== 'https://sozo.treonstudio.com') {
        console.log('[RAD][React] ignored message due to origin mismatch')
        return
      }

      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'TOGGLE_EXPAND') {
          console.log('[RAD][React] toggling latestExpanded via parent request')
          setLatestExpanded(prev => !prev)
        }
        if (event.data.type === 'IFRAME_READY') {
          // Parent indicates iframe wrapper is ready; send current height
          const height = document.documentElement.scrollHeight
          if (window.self !== window.top) {
            console.log('[RAD][React] parent ready detected, posting current height', { height, latestExpanded })
            window.parent.postMessage({
              type: 'REACT_APP_HEIGHT',
              height,
              isExpanded: latestExpanded,
            }, '*')
          }
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [latestExpanded])

  // Send height to parent whenever latestExpanded changes (only when embedded)
  React.useEffect(() => {
    if (window.self !== window.top) {
      const sendHeight = () => {
        const height = document.documentElement.scrollHeight
        console.log('[RAD][React] posting height to parent', { height, latestExpanded })
        window.parent.postMessage({
          type: 'REACT_APP_HEIGHT',
          height,
          isExpanded: latestExpanded,
        }, '*')
      }
      sendHeight()
      const timer = setTimeout(sendHeight, 500)
      return () => clearTimeout(timer)
    }
  }, [latestExpanded, activeTab, query])

  return (
    <div className="container">
      <main>
        <section className="hub-hero" aria-label="Knowledge Hub">
          <h1 className="hub-title">Explore Our Beauty Knowledge Hub</h1>
          <p className="hub-desc">Temukan artikel yang tepat untuk kebutuhan kecantikan Anda dari koleksi 200+ artikel yang ditulis oleh para expert</p>

          <div className="hub-controls">
            <Tabs tabs={[
              { id: 'tab-1', label: 'Semua Artikel' },
              { id: 'tab-2', label: 'Skincare Tips' },
              { id: 'tab-3', label: 'Treatment Guide' },
              { id: 'tab-4', label: 'Expert Opinion' },
            ]} value={activeTab} onChange={setActiveTab} />

            <form className="searchbar" role="search" onSubmit={(e) => e.preventDefault()}>
              <input
                className="search-input"
                type="search"
                placeholder="Cari topik, treatment, atau tips..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </form>
          </div>
        </section>

        {activeTab === 'tab-1' && (
          <section aria-labelledby="artikel-terbaru" className="articles-section">
            <div className="section-head">
              <h2 id="artikel-terbaru">Artikel Terbaru</h2>
              <a href="#" className="see-all" onClick={(e) => { e.preventDefault(); setLatestExpanded(v => !v) }}>
                {latestExpanded ? 'Tutup' : 'Lihat Semua'}
              </a>
            </div>
            <ArticleGrid searchTerm={query} limit={latestExpanded ? undefined : 3} />
          </section>
        )}

        {activeTab !== 'tab-1' && (
          <section aria-labelledby="category-section" className="articles-section fade-in">
            <div className="section-head">
              <h2 id="category-section">{categoryFromTab(activeTab)}</h2>
              <a href="#" className="see-all" onClick={(e) => { e.preventDefault(); setCategoryExpanded(v => !v) }}>
                {categoryExpanded ? 'Tutup' : 'Lihat Semua'}
              </a>
            </div>
            <ArticleGrid categoryName={categoryFromTab(activeTab)} limit={categoryExpanded ? undefined : 3} />
          </section>
        )}
      </main>
    </div>
  )
}
