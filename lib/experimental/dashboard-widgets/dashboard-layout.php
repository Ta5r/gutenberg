<?php
/**
 * Dashboard Layout: server-side defaults.
 *
 * Allows plugins and themes to register a default dashboard layout
 * that surfaces transparently through the `@wordpress/preferences`
 * store for users who have not customized theirs.
 *
 * @package gutenberg
 */

/**
 * Preferences scope under which the dashboard layout is stored.
 * Mirrors the scope read by the dashboard's JS layer.
 */
const GUTENBERG_DASHBOARD_LAYOUT_SCOPE = 'core/dashboard';

/**
 * Preferences key under `GUTENBERG_DASHBOARD_LAYOUT_SCOPE` that holds
 * the layout array.
 */
const GUTENBERG_DASHBOARD_LAYOUT_KEY = 'dashboardLayout';

/**
 * Identifier of the bundled dashboard, formatted as `<plugin>_<page>`
 * to match the underscore form produced by the wp-build pipeline
 * (mirrors the `{{PREFIX}}_{{PAGE_SLUG_UNDERSCORE}}` pair used in
 * generated page templates).
 *
 * Passed as context to `gutenberg_dashboard_default_layout` and used
 * as the `{name}` segment of the REST default-layout route.
 */
const GUTENBERG_DASHBOARD_NAME = 'gutenberg_dashboard';

/**
 * Prefix for the option key storing site-level dashboard layouts.
 */
const GUTENBERG_DASHBOARD_SITE_LAYOUT_OPTION_PREFIX = 'gutenberg_dashboard_site_layout_';

/**
 * Returns the option name for a given dashboard identifier.
 *
 * @param string $dashboard_name Dashboard identifier.
 * @return string Option name.
 */
function gutenberg_get_dashboard_site_layout_option_name( $dashboard_name ) {
	return GUTENBERG_DASHBOARD_SITE_LAYOUT_OPTION_PREFIX . sanitize_key( $dashboard_name );
}

/**
 * Injects a registered default dashboard layout into the user's
 * `persisted_preferences` read when the stored layout is empty.
 *
 * Hooks into `get_user_metadata` so the default propagates through
 * the same persistence layer the dashboard's JS layer reads from.
 * The JS side stays oblivious: a default and a user-saved layout
 * look identical at the preferences-store boundary.
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param mixed  $value    The pre-fetched value, or null to let the
 *                         meta API resolve normally.
 * @param int    $user_id  User ID.
 * @param string $meta_key Meta key being read.
 * @return mixed The original value, or a single-element array
 *               containing the extended persisted preferences.
 */
function gutenberg_inject_dashboard_default_layout( $value, $user_id, $meta_key ) {
	global $wpdb;

	$expected_key = $wpdb->get_blog_prefix() . 'persisted_preferences';
	if ( $meta_key !== $expected_key ) {
		return $value;
	}

	// Avoid recursion when reading the user meta.
	remove_filter( 'get_user_metadata', __FUNCTION__, 99 );
	$base = get_user_meta( $user_id, $meta_key, true );
	add_filter( 'get_user_metadata', __FUNCTION__, 99, 3 );

	if ( ! is_array( $base ) ) {
		$base = array();
	}

	$committed = $base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ][ GUTENBERG_DASHBOARD_LAYOUT_KEY ] ?? array();

	if ( ! empty( $committed ) ) {
		return $value;
	}

	// Check if a site-level layout has been persisted.
	$site_layout = get_option( gutenberg_get_dashboard_site_layout_option_name( GUTENBERG_DASHBOARD_NAME ) );
	if ( ! empty( $site_layout ) && is_array( $site_layout ) ) {
		$default = $site_layout;
	} else {
		/**
		 * Filters the default dashboard layout served to users who have
		 * not customized theirs.
		 *
		 * Each entry should match the dashboard's widget instance shape:
		 * `uuid`, `type`, optional `attributes`, optional `placement`.
		 *
		 * @param array  $default_layout Default array of widget instances.
		 * @param string $dashboard_name Identifier of the dashboard
		 *                               receiving the default. Callbacks
		 *                               targeting a specific dashboard
		 *                               should switch on this value.
		 */
		$default = apply_filters( 'gutenberg_dashboard_default_layout', array(), GUTENBERG_DASHBOARD_NAME );
	}

	if ( empty( $default ) || ! is_array( $default ) ) {
		return $value;
	}

	if ( ! isset( $base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ] ) || ! is_array( $base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ] ) ) {
		$base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ] = array();
	}

	$base[ GUTENBERG_DASHBOARD_LAYOUT_SCOPE ][ GUTENBERG_DASHBOARD_LAYOUT_KEY ] = $default;

	return array( $base );
}

add_filter( 'get_user_metadata', 'gutenberg_inject_dashboard_default_layout', 99, 3 );

/**
 * Returns the default layout registered for a dashboard.
 *
 * Resolves `gutenberg_dashboard_default_layout` for the supplied
 * dashboard name, returning a fresh evaluation of the filter chain
 * each call. Used by the dashboard's JS layer to back a "reset to
 * default" action without depending on the user-meta hydration path.
 *
 * @param WP_REST_Request $request REST request carrying the
 *                                 dashboard name segment.
 * @return WP_REST_Response Response wrapping the default layout
 *                          array.
 */
function gutenberg_get_dashboard_default_layout( $request ) {
	$name    = $request['name'];
	$default = apply_filters( 'gutenberg_dashboard_default_layout', array(), $name );

	if ( ! is_array( $default ) ) {
		$default = array();
	}

	return rest_ensure_response( array_values( $default ) );
}

/**
 * Returns the site-level layout for a dashboard.
 *
 * Checks if a site-level layout has been saved in options. If not, falls back to
 * the registered default layout from the filter chain.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response Response with layout, is_site_layout, and can_edit_site_layout.
 */
function gutenberg_get_dashboard_site_layout( $request ) {
	$name        = $request['name'];
	$option_name = gutenberg_get_dashboard_site_layout_option_name( $name );
	$site_layout = get_option( $option_name );

	$is_site_layout = false;
	if ( ! empty( $site_layout ) && is_array( $site_layout ) ) {
		$layout         = $site_layout;
		$is_site_layout = true;
	} else {
		$layout = apply_filters( 'gutenberg_dashboard_default_layout', array(), $name );
		if ( ! is_array( $layout ) ) {
			$layout = array();
		}
	}

	return rest_ensure_response(
		array(
			'layout'               => array_values( $layout ),
			'is_site_layout'       => $is_site_layout,
			'can_edit_site_layout' => current_user_can( 'edit_theme_options' ),
		)
	);
}

/**
 * Updates the site-level layout for a dashboard.
 *
 * Validates widget instances and ensures server-side governance before saving.
 *
 * @param WP_REST_Request $request REST request with layout array.
 * @return WP_REST_Response|WP_Error Response or error.
 */
function gutenberg_update_dashboard_site_layout( $request ) {
	$name            = $request['name'];
	$incoming_layout = $request->get_param( 'layout' );

	if ( ! is_array( $incoming_layout ) ) {
		return new WP_Error(
			'rest_invalid_param',
			__( 'The layout parameter must be an array of widget instances.', 'gutenberg' ),
			array( 'status' => 400 )
		);
	}

	$option_name    = gutenberg_get_dashboard_site_layout_option_name( $name );
	$current_layout = get_option( $option_name, array() );

	// Server-side governance: verify locked widgets from current layout are not removed.
	if ( is_array( $current_layout ) && ! empty( $current_layout ) ) {
		$incoming_uuids = array_flip( array_column( $incoming_layout, 'uuid' ) );
		foreach ( $current_layout as $instance ) {
			if ( ! empty( $instance['attributes']['locked'] ) && ! isset( $incoming_uuids[ $instance['uuid'] ] ) ) {
				return new WP_Error(
					'rest_forbidden_widget_removal',
					__( 'Locked widget instances cannot be removed.', 'gutenberg' ),
					array( 'status' => 403 )
				);
			}
		}
	}

	// Sanitize incoming widget instances.
	$sanitized_layout = array();
	foreach ( $incoming_layout as $widget ) {
		if ( empty( $widget['uuid'] ) || empty( $widget['type'] ) ) {
			continue;
		}
		$sanitized_layout[] = array(
			'uuid'       => sanitize_text_field( $widget['uuid'] ),
			'type'       => sanitize_text_field( $widget['type'] ),
			'attributes' => isset( $widget['attributes'] ) && is_array( $widget['attributes'] ) ? $widget['attributes'] : array(),
			'placement'  => isset( $widget['placement'] ) && is_array( $widget['placement'] ) ? $widget['placement'] : null,
		);
	}

	update_option( $option_name, $sanitized_layout );

	return rest_ensure_response(
		array(
			'layout'               => array_values( $sanitized_layout ),
			'is_site_layout'       => true,
			'can_edit_site_layout' => true,
		)
	);
}

/**
 * Resets the site-level layout back to registered default by deleting the option.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response Response with default layout.
 */
function gutenberg_delete_dashboard_site_layout( $request ) {
	$name        = $request['name'];
	$option_name = gutenberg_get_dashboard_site_layout_option_name( $name );
	delete_option( $option_name );

	$default = apply_filters( 'gutenberg_dashboard_default_layout', array(), $name );
	if ( ! is_array( $default ) ) {
		$default = array();
	}

	return rest_ensure_response(
		array(
			'layout'               => array_values( $default ),
			'is_site_layout'       => false,
			'can_edit_site_layout' => current_user_can( 'edit_theme_options' ),
		)
	);
}

/**
 * Registers the REST routes that expose dashboard default layouts and site-level layouts.
 */
function gutenberg_register_dashboard_default_layout_route() {
	register_rest_route(
		'wp/v2',
		'/dashboards/(?P<name>[a-z][a-z0-9]*(?:_[a-z0-9]+)+)/default-layout',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'gutenberg_get_dashboard_default_layout',
			'permission_callback' => function () {
				return current_user_can( 'read' );
			},
			'args'                => array(
				'name' => array(
					'description' => __( 'Dashboard identifier as produced by the build pipeline.', 'gutenberg' ),
					'type'        => 'string',
				),
			),
		)
	);

	register_rest_route(
		'wp/v2',
		'/dashboards/(?P<name>[a-z][a-z0-9]*(?:_[a-z0-9]+)+)/layout',
		array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => 'gutenberg_get_dashboard_site_layout',
				'permission_callback' => function () {
					return current_user_can( 'read' );
				},
				'args'                => array(
					'name' => array(
						'description' => __( 'Dashboard identifier as produced by the build pipeline.', 'gutenberg' ),
						'type'        => 'string',
					),
				),
			),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => 'gutenberg_update_dashboard_site_layout',
				'permission_callback' => function () {
					return current_user_can( 'edit_theme_options' );
				},
				'args'                => array(
					'name'   => array(
						'description' => __( 'Dashboard identifier as produced by the build pipeline.', 'gutenberg' ),
						'type'        => 'string',
					),
					'layout' => array(
						'description' => __( 'Array of dashboard widget instances.', 'gutenberg' ),
						'type'        => 'array',
						'required'    => true,
					),
				),
			),
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => 'gutenberg_delete_dashboard_site_layout',
				'permission_callback' => function () {
					return current_user_can( 'edit_theme_options' );
				},
				'args'                => array(
					'name' => array(
						'description' => __( 'Dashboard identifier as produced by the build pipeline.', 'gutenberg' ),
						'type'        => 'string',
					),
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_dashboard_default_layout_route' );
