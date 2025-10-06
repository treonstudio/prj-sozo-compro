/**
 * WordPress Parent Window - Iframe Height Handler
 *
 * Script ini harus diload di parent window (WordPress) untuk menerima
 * postMessage dari React iframe dan mengatur height iframe secara otomatis.
 *
 * Usage di WordPress:
 * 1. Enqueue script ini di WordPress theme/plugin
 * 2. Tambahkan data-attribute 'data-react-iframe' pada iframe element
 *
 * Example:
 * <iframe
 *   src="https://articles-irfan.vercel.app"
 *   data-react-iframe="true"
 *   style="width: 100%; border: 0; display: block;"
 * ></iframe>
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    // Allowed origins untuk security (whitelist iframe sources)
    allowedOrigins: [
      'https://articles-irfan.vercel.app',
      'https://sozo-article.vercel.app',
      'https://sozo.treonstudio.com',
      'http://localhost:5173',
      'http://localhost:4173',
    ],

    // Selector untuk iframe
    iframeSelector: 'iframe[data-react-iframe]',

    // Selector untuk parent container (optional, akan auto-detect jika tidak ada)
    parentContainerSelector: '.iframe-target',

    // Minimum height (prevent collapse)
    minHeight: 400,

    // Transition duration
    transitionDuration: '300ms',

    // Debug mode
    debug: true,
  };

  // Utility: Log helper
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[WordPress][Iframe Handler]', ...args);
    }
  }

  // Utility: Check if origin is allowed
  function isOriginAllowed(origin) {
    return CONFIG.allowedOrigins.some(allowed => origin.startsWith(allowed));
  }

  // Main: Handle postMessage from React iframe
  function handleMessage(event) {
    // Security: Validate origin
    if (!isOriginAllowed(event.origin)) {
      log('❌ Rejected message from unauthorized origin:', event.origin);
      return;
    }

    // Validate message structure
    if (!event.data || typeof event.data !== 'object') {
      return;
    }

    const { type, height, isExpanded } = event.data;

    // Handle REACT_APP_HEIGHT message
    if (type === 'REACT_APP_HEIGHT' && typeof height === 'number') {
      log('✅ Received height update:', { height, isExpanded, origin: event.origin });

      // Find the iframe that sent this message
      const iframe = findIframeByOrigin(event.origin);

      if (iframe) {
        setIframeHeight(iframe, height);
      } else {
        log('⚠️ Could not find iframe for origin:', event.origin);
      }
    }
  }

  // Find iframe element by matching origin
  function findIframeByOrigin(origin) {
    const iframes = document.querySelectorAll(CONFIG.iframeSelector);

    for (const iframe of iframes) {
      try {
        const iframeOrigin = new URL(iframe.src).origin;
        if (iframeOrigin === origin) {
          return iframe;
        }
      } catch (e) {
        log('⚠️ Invalid iframe src:', iframe.src);
      }
    }

    return null;
  }

  // Set iframe height with smooth transition
  function setIframeHeight(iframe, height) {
    const newHeight = Math.max(height, CONFIG.minHeight);

    // Find parent container of iframe
    const parentContainer = iframe.closest(CONFIG.parentContainerSelector) || iframe.parentElement;

    if (!parentContainer) {
      log('⚠️ Parent container not found, setting height on iframe directly');

      // Fallback: set on iframe itself
      if (!iframe.style.transition) {
        iframe.style.transition = `height ${CONFIG.transitionDuration} ease-in-out`;
      }
      iframe.style.height = `${newHeight}px`;
      return;
    }

    // Add smooth transition to parent container if not already set
    if (!parentContainer.style.transition || !parentContainer.style.transition.includes('height')) {
      const existingTransition = parentContainer.style.transition || '';
      parentContainer.style.transition = existingTransition
        ? `${existingTransition}, height ${CONFIG.transitionDuration} ease-in-out`
        : `height ${CONFIG.transitionDuration} ease-in-out`;
    }

    // Set new height on parent container
    parentContainer.style.height = `${newHeight}px`;

    log('📐 Set parent container height:', {
      parentElement: parentContainer,
      iframeElement: iframe,
      height: newHeight,
      previousHeight: parentContainer.offsetHeight,
    });

    // Dispatch custom event for other scripts to hook into
    const customEvent = new CustomEvent('iframeHeightChanged', {
      detail: {
        iframe,
        parentContainer,
        height: newHeight,
        timestamp: Date.now(),
      },
    });
    document.dispatchEvent(customEvent);
  }

  // Initialize iframe
  function initializeIframe(iframe) {
    // Find parent container
    const parentContainer = iframe.closest(CONFIG.parentContainerSelector) || iframe.parentElement;

    // Set initial styles on parent container
    if (parentContainer) {
      parentContainer.style.position = parentContainer.style.position || 'relative';
      parentContainer.style.width = parentContainer.style.width || '100%';
      parentContainer.style.minHeight = `${CONFIG.minHeight}px`;
      parentContainer.style.overflow = 'hidden';

      log('🔧 Parent container found and styled:', parentContainer);
    }

    // Set initial styles on iframe
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.style.display = 'block';

    // Send ready signal to iframe
    iframe.addEventListener('load', function() {
      log('✅ Iframe loaded, sending IFRAME_READY signal');

      try {
        const iframeOrigin = new URL(iframe.src).origin;
        iframe.contentWindow.postMessage(
          { type: 'IFRAME_READY' },
          iframeOrigin
        );
      } catch (e) {
        log('❌ Error sending IFRAME_READY:', e);
      }
    });

    log('🔧 Initialized iframe:', iframe);
  }

  // Initialize all iframes on page
  function initializeAllIframes() {
    const iframes = document.querySelectorAll(CONFIG.iframeSelector);
    log(`🚀 Found ${iframes.length} React iframe(s)`);

    iframes.forEach(initializeIframe);
  }

  // Setup: Add message event listener
  function setup() {
    // Listen for messages from iframe
    window.addEventListener('message', handleMessage, false);
    log('👂 Listening for postMessage from React iframe');

    // Initialize existing iframes
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeAllIframes);
    } else {
      initializeAllIframes();
    }

    // Watch for dynamically added iframes (optional)
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.matches && node.matches(CONFIG.iframeSelector)) {
              initializeIframe(node);
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  // Public API (optional - for manual control)
  window.ReactIframeHandler = {
    // Manually set iframe height
    setHeight: function(iframeElement, height) {
      setIframeHeight(iframeElement, height);
    },

    // Send message to iframe
    sendMessage: function(iframeElement, message) {
      try {
        const origin = new URL(iframeElement.src).origin;
        iframeElement.contentWindow.postMessage(message, origin);
        log('📤 Sent message to iframe:', message);
      } catch (e) {
        log('❌ Error sending message:', e);
      }
    },

    // Toggle expand/collapse
    toggleExpand: function(iframeElement) {
      this.sendMessage(iframeElement, { type: 'TOGGLE_EXPAND' });
    },

    // Get current config
    getConfig: function() {
      return CONFIG;
    },

    // Update config
    updateConfig: function(updates) {
      Object.assign(CONFIG, updates);
      log('⚙️ Config updated:', CONFIG);
    },
  };

  // Auto-initialize
  setup();

})();
