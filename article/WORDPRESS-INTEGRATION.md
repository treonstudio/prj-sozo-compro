# WordPress Integration Guide

Panduan lengkap untuk mengintegrasikan React Articles iframe dengan WordPress dan auto height adjustment.

## 📋 Table of Contents

1. [Setup JavaScript Handler](#1-setup-javascript-handler)
2. [WordPress Integration](#2-wordpress-integration)
3. [HTML Implementation](#3-html-implementation)
4. [Testing](#4-testing)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Setup JavaScript Handler

### Step 1: Upload File

Upload file `iframe-height-handler.js` ke WordPress theme:

```
wp-content/themes/your-theme/js/iframe-height-handler.js
```

### Step 2: Enqueue Script

Tambahkan di `functions.php`:

```php
function enqueue_react_iframe_handler() {
    wp_enqueue_script(
        'react-iframe-handler',
        get_template_directory_uri() . '/js/iframe-height-handler.js',
        array(),
        '1.0.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'enqueue_react_iframe_handler');
```

---

## 2. WordPress Integration

### Option A: Shortcode (Recommended)

Tambahkan shortcode di `functions.php`:

```php
function react_articles_shortcode($atts) {
    $atts = shortcode_atts(array(
        'src' => 'https://articles-irfan.vercel.app',
        'min_height' => '400',
    ), $atts);

    $iframe_id = 'react-iframe-' . wp_rand(1000, 9999);

    return sprintf(
        '<iframe
            id="%s"
            src="%s"
            data-react-iframe="true"
            style="width: 100%%; min-height: %spx; border: 0; display: block;"
            allowfullscreen
        ></iframe>',
        esc_attr($iframe_id),
        esc_url($atts['src']),
        esc_attr($atts['min_height'])
    );
}
add_shortcode('react_articles', 'react_articles_shortcode');
```

**Usage dalam Post/Page:**

```
[react_articles]
```

atau dengan custom URL:

```
[react_articles src="https://your-react-app.vercel.app" min_height="500"]
```

### Option B: Gutenberg Block

Untuk Gutenberg, lihat contoh lengkap di `wordpress-integration-example.php`.

### Option C: Direct HTML (Custom Page Template)

```php
// page-articles.php (custom template)
<?php get_header(); ?>

<div class="content">
    <iframe
        src="https://articles-irfan.vercel.app"
        data-react-iframe="true"
        style="width: 100%; min-height: 400px; border: 0; display: block;"
        allowfullscreen
    ></iframe>
</div>

<?php get_footer(); ?>
```

---

## 3. HTML Implementation

### Minimum Required Attributes

```html
<iframe
    src="https://articles-irfan.vercel.app"
    data-react-iframe="true"
    style="width: 100%; border: 0;"
></iframe>
```

### Full Example with All Options

```html
<iframe
    id="react-articles-iframe"
    src="https://articles-irfan.vercel.app"
    data-react-iframe="true"
    style="
        width: 100%;
        min-height: 400px;
        border: 0;
        display: block;
    "
    allowfullscreen
    referrerpolicy="no-referrer-when-downgrade"
    loading="lazy"
></iframe>
```

---

## 4. Testing

### Test di Browser Console

Setelah halaman load, cek di browser console:

```javascript
// Check if handler loaded
console.log(window.ReactIframeHandler);

// Manual set height
const iframe = document.querySelector('[data-react-iframe]');
window.ReactIframeHandler.setHeight(iframe, 1000);

// Send toggle expand message
window.ReactIframeHandler.toggleExpand(iframe);
```

### Debug Mode

Handler sudah include debug mode. Lihat console log:

```
[WordPress][Iframe Handler] 👂 Listening for postMessage from React iframe
[WordPress][Iframe Handler] 🚀 Found 1 React iframe(s)
[WordPress][Iframe Handler] ✅ Iframe loaded, sending IFRAME_READY signal
[WordPress][Iframe Handler] ✅ Received height update: {height: 2383, isExpanded: false}
[WordPress][Iframe Handler] 📐 Set iframe height: {height: 2383}
```

### Disable Debug Mode

Edit `iframe-height-handler.js`:

```javascript
const CONFIG = {
    // ...
    debug: false,  // Change to false
};
```

---

## 5. Troubleshooting

### Issue: Iframe height tidak berubah

**Solusi:**
1. Pastikan `data-react-iframe="true"` ada di iframe element
2. Cek console untuk error messages
3. Pastikan script `iframe-height-handler.js` ter-load
4. Cek allowed origins di CONFIG

### Issue: CORS Error

**Solusi:**

Tambahkan CORS headers di WordPress `functions.php`:

```php
function add_cors_headers_for_react() {
    $allowed_origins = array(
        'https://articles-irfan.vercel.app',
        'http://localhost:5173',
    );

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type");
    }
}
add_action('rest_api_init', 'add_cors_headers_for_react');
```

### Issue: Height update terlalu sering

**Solusi:**

Tambahkan debounce di `iframe-height-handler.js`:

```javascript
let heightUpdateTimeout;
function setIframeHeight(iframe, height) {
    clearTimeout(heightUpdateTimeout);
    heightUpdateTimeout = setTimeout(() => {
        const newHeight = Math.max(height, CONFIG.minHeight);
        iframe.style.height = `${newHeight}px`;
    }, 100); // debounce 100ms
}
```

### Issue: Origin tidak diizinkan

**Solusi:**

Update `allowedOrigins` di `iframe-height-handler.js`:

```javascript
const CONFIG = {
    allowedOrigins: [
        'https://articles-irfan.vercel.app',
        'https://your-production-domain.com',
        'http://localhost:5173',  // development
        'http://localhost:4173',  // preview
    ],
    // ...
};
```

---

## 6. Advanced Configuration

### Custom Event Listener

Listen ke event `iframeHeightChanged`:

```javascript
document.addEventListener('iframeHeightChanged', function(event) {
    console.log('Iframe height changed:', event.detail);
    // event.detail = { iframe, height, timestamp }

    // Custom logic here
    // Example: Trigger analytics
    // Example: Adjust surrounding elements
});
```

### Manual Control via API

```javascript
// Get iframe element
const iframe = document.querySelector('[data-react-iframe]');

// Set specific height
window.ReactIframeHandler.setHeight(iframe, 1500);

// Send custom message to iframe
window.ReactIframeHandler.sendMessage(iframe, {
    type: 'CUSTOM_ACTION',
    payload: { foo: 'bar' }
});

// Toggle expand/collapse
window.ReactIframeHandler.toggleExpand(iframe);

// Update config dynamically
window.ReactIframeHandler.updateConfig({
    minHeight: 500,
    transitionDuration: '500ms',
});
```

---

## 7. Security Best Practices

### 1. Validate Origins

Selalu validate origin di allowed list:

```javascript
allowedOrigins: [
    'https://your-production-domain.com',
    // NEVER use '*' in production
],
```

### 2. Content Security Policy

Tambahkan CSP header di WordPress:

```php
function add_csp_headers() {
    header("Content-Security-Policy: frame-src https://articles-irfan.vercel.app;");
}
add_action('send_headers', 'add_csp_headers');
```

### 3. Sandbox Attribute (Optional)

Jika perlu restrict iframe capabilities:

```html
<iframe
    sandbox="allow-scripts allow-same-origin allow-forms"
    ...
></iframe>
```

---

## 8. Performance Tips

1. **Lazy Loading**: Gunakan `loading="lazy"` pada iframe
2. **Debounce**: Height updates sudah di-debounce di React side (1 detik)
3. **Transition**: Smooth transition untuk better UX
4. **Min Height**: Set minimum height untuk prevent layout shift

---

## Support

Jika ada masalah, cek:
1. Browser console untuk error messages
2. Network tab untuk failed requests
3. Debug mode di `iframe-height-handler.js`

---

**File References:**
- `iframe-height-handler.js` - Main JavaScript handler
- `wordpress-integration-example.php` - PHP integration examples
- React side: `src/hooks/useIframeHeight.ts` - Height sync logic
