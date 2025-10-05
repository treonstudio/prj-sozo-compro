import { useEffect, useCallback } from 'react'
import { getDocumentHeight, isInIframe, getParentOrigin } from '../utils/helpers'
import { MESSAGE_TYPES, TIMING } from '../constants/app'
import { API_CONFIG } from '../constants/api'

/**
 * Custom hook to sync iframe height with parent window
 * Sends height updates to both parent window (postMessage) and WordPress REST API
 */
export const useIframeHeight = (dependencies: any[] = []) => {
  const parentOrigin = getParentOrigin()

  const sendHeightToParent = useCallback(
    (isExpanded: boolean = true) => {
      const height = getDocumentHeight()

      // Send via postMessage to parent window
      if (isInIframe()) {
        console.log('[RAD][React] posting height to parent', {
          height,
          isExpanded,
          parentOrigin,
        })
        window.parent.postMessage(
          {
            type: MESSAGE_TYPES.REACT_APP_HEIGHT,
            height,
            isExpanded,
          },
          parentOrigin || '*'
        )
      } else {
        console.log(
          '[RAD][React] not embedded, skipping postMessage, will still POST to WP if parentOrigin known'
        )
      }

      // Also notify WordPress via REST for server-side observability
      // Only send if parentOrigin is the production WordPress site
      if (parentOrigin && parentOrigin.includes('sozo.treonstudio.com')) {
        const url =
          parentOrigin.replace(/\/$/, '') +
          '/wp-json/react-articles/v1/height'
        const payload = {
          height: Math.round(height),
          isExpanded,
          ts: String(Date.now()),
        }

        console.log('[RAD][React] POST to WP', { url, payload })

        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'cors',
        })
          .then(async (res) => {
            const data = await res.json().catch(() => ({}))
            console.log('[RAD][React] WP REST response', {
              status: res.status,
              data,
            })
          })
          .catch((err) => {
            console.error('[RAD][React] WP REST POST error', err)
          })
      }
    },
    [parentOrigin]
  )

  useEffect(() => {
    sendHeightToParent()
    const timer = setTimeout(sendHeightToParent, TIMING.HEIGHT_SYNC_DELAY)
    return () => clearTimeout(timer)
  }, dependencies)

  return { sendHeightToParent, parentOrigin }
}

/**
 * Hook to observe element size changes and sync height
 */
export const useElementHeightObserver = (
  elementRef: React.RefObject<HTMLElement>,
  enabled: boolean = true
) => {
  const { sendHeightToParent } = useIframeHeight()

  useEffect(() => {
    if (!enabled || !elementRef.current) return

    const ro = new ResizeObserver(() => sendHeightToParent())
    ro.observe(elementRef.current)

    const timer = setInterval(sendHeightToParent, TIMING.RESIZE_OBSERVER_INTERVAL)

    return () => {
      ro.disconnect()
      clearInterval(timer)
    }
  }, [enabled, elementRef, sendHeightToParent])
}
