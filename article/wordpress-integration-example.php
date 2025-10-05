<?php
/**
 * WordPress Integration Example
 *
 * Cara menggunakan iframe React di WordPress dengan auto height adjustment
 */

// ============================================
// Method 1: Enqueue Script di Theme
// ============================================

/**
 * Tambahkan di functions.php
 */
function enqueue_react_iframe_handler() {
    // Enqueue script
    wp_enqueue_script(
        'react-iframe-handler',
        get_template_directory_uri() . '/js/iframe-height-handler.js',
        array(), // no dependencies
        '1.0.0',
        true // load in footer
    );
}
add_action('wp_enqueue_scripts', 'enqueue_react_iframe_handler');


// ============================================
// Method 2: Shortcode untuk Embed Iframe
// ============================================

/**
 * Shortcode: [react_articles]
 *
 * Usage:
 * [react_articles src="https://articles-irfan.vercel.app"]
 * [react_articles src="https://articles-irfan.vercel.app" min_height="500"]
 */
function react_articles_shortcode($atts) {
    // Parse attributes
    $atts = shortcode_atts(array(
        'src' => 'https://articles-irfan.vercel.app',
        'min_height' => '400',
        'width' => '100%',
    ), $atts);

    // Generate unique ID
    $iframe_id = 'react-iframe-' . wp_rand(1000, 9999);

    // Build iframe HTML
    $html = sprintf(
        '<div class="react-iframe-wrapper" style="position: relative; width: %s;">
            <iframe
                id="%s"
                src="%s"
                data-react-iframe="true"
                style="width: 100%%; min-height: %spx; border: 0; display: block;"
                allowfullscreen
                referrerpolicy="no-referrer-when-downgrade"
                loading="lazy"
            ></iframe>
        </div>',
        esc_attr($atts['width']),
        esc_attr($iframe_id),
        esc_url($atts['src']),
        esc_attr($atts['min_height'])
    );

    return $html;
}
add_shortcode('react_articles', 'react_articles_shortcode');


// ============================================
// Method 3: Gutenberg Block (Optional)
// ============================================

/**
 * Register custom Gutenberg block untuk React Articles
 */
function register_react_articles_block() {
    if (!function_exists('register_block_type')) {
        return;
    }

    register_block_type('custom/react-articles', array(
        'editor_script' => 'react-articles-block-editor',
        'render_callback' => 'render_react_articles_block',
        'attributes' => array(
            'src' => array(
                'type' => 'string',
                'default' => 'https://articles-irfan.vercel.app',
            ),
            'minHeight' => array(
                'type' => 'number',
                'default' => 400,
            ),
        ),
    ));
}
add_action('init', 'register_react_articles_block');

function render_react_articles_block($attributes) {
    $src = isset($attributes['src']) ? $attributes['src'] : 'https://articles-irfan.vercel.app';
    $min_height = isset($attributes['minHeight']) ? $attributes['minHeight'] : 400;

    return react_articles_shortcode(array(
        'src' => $src,
        'min_height' => $min_height,
    ));
}


// ============================================
// Method 4: REST API Endpoint (untuk height logging)
// ============================================

/**
 * Custom REST endpoint untuk menerima height updates dari React
 * Endpoint: /wp-json/react-articles/v1/height
 */
function register_react_articles_rest_endpoint() {
    register_rest_route('react-articles/v1', '/height', array(
        'methods' => 'POST',
        'callback' => 'handle_react_height_update',
        'permission_callback' => '__return_true', // Public endpoint
    ));
}
add_action('rest_api_init', 'register_react_articles_rest_endpoint');

function handle_react_height_update($request) {
    $params = $request->get_json_params();

    $height = isset($params['height']) ? intval($params['height']) : 0;
    $is_expanded = isset($params['isExpanded']) ? (bool) $params['isExpanded'] : false;
    $timestamp = isset($params['ts']) ? sanitize_text_field($params['ts']) : '';

    // Optional: Log untuk analytics/debugging
    error_log(sprintf(
        '[React Articles] Height update: %dpx (expanded: %s) at %s',
        $height,
        $is_expanded ? 'yes' : 'no',
        $timestamp
    ));

    // Optional: Simpan ke database untuk analytics
    // update_option('react_articles_last_height', array(
    //     'height' => $height,
    //     'is_expanded' => $is_expanded,
    //     'timestamp' => $timestamp,
    // ));

    return new WP_REST_Response(array(
        'success' => true,
        'message' => 'Height received',
        'data' => array(
            'height' => $height,
            'is_expanded' => $is_expanded,
        ),
    ), 200);
}


// ============================================
// Method 5: Add CORS Headers (jika diperlukan)
// ============================================

/**
 * Tambahkan CORS headers untuk WordPress REST API
 * Agar React app bisa hit endpoint /wp-json/react-articles/v1/height
 */
function add_cors_headers_for_react() {
    // Allow dari domain React app
    $allowed_origins = array(
        'https://articles-irfan.vercel.app',
        'http://localhost:5173',
        'http://localhost:4173',
    );

    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Access-Control-Allow-Credentials: true");
    }
}
add_action('rest_api_init', 'add_cors_headers_for_react');
add_action('init', 'add_cors_headers_for_react');
?>
