<?php
/**
 * Block wrapper and inner blocks attributes helper functions.
 *
 * Extends the Block Supports API to allow retrieving block support attributes
 * separately for outer wrappers and inner blocks containers.
 *
 * @package gutenberg
 */

/**
 * Gets or sets whether the inner blocks layout has been handled for the current block during rendering.
 *
 * @since 6.8.0
 *
 * @param array|null $block   The block object to check or update.
 * @param bool|null  $handled Optional. Whether layout was handled. If null, returns the current status.
 * @return bool Whether layout was handled.
 */
function gutenberg_is_inner_blocks_layout_handled( $block = null, $handled = null ) {
	static $handled_blocks = array();

	if ( null === $block ) {
		if ( isset( WP_Block_Supports::$block_to_render ) && is_array( WP_Block_Supports::$block_to_render ) ) {
			$block = WP_Block_Supports::$block_to_render;
		} else {
			return false;
		}
	}

	$block_key = isset( $block['blockName'] ) ? $block['blockName'] . ':' . md5( wp_json_encode( $block['attrs'] ?? array() ) ) : '';

	if ( '' === $block_key ) {
		return false;
	}

	if ( null !== $handled ) {
		if ( $handled ) {
			// Limit memory usage by keeping at most 100 entries.
			if ( count( $handled_blocks ) > 100 ) {
				$handled_blocks = array();
			}
			$handled_blocks[ $block_key ] = true;
		} else {
			unset( $handled_blocks[ $block_key ] );
		}
		return (bool) $handled;
	}

	$is_handled = ! empty( $handled_blocks[ $block_key ] );
	if ( $is_handled ) {
		// Clean up once inspected during render_block filter.
		unset( $handled_blocks[ $block_key ] );
	}

	return $is_handled;
}

/**
 * Marks inner blocks layout as handled for a block.
 *
 * @since 6.8.0
 *
 * @param array|null $block The block object.
 */
function gutenberg_set_inner_blocks_layout_handled( $block = null ) {
	gutenberg_is_inner_blocks_layout_handled( $block, true );
}

/**
 * Merges block support attributes with extra attributes.
 *
 * @since 6.8.0
 *
 * @param array $new_attributes   Array of attributes generated from block supports.
 * @param array $extra_attributes Optional. Array of extra attributes to merge.
 * @return array Merged array of HTML attributes.
 */
function gutenberg_merge_block_attributes( $new_attributes = array(), $extra_attributes = array() ) {
	if ( empty( $new_attributes ) && empty( $extra_attributes ) ) {
		return array();
	}

	$attribute_merge_callbacks = array(
		'style'      => static function ( $new_attribute, $extra_attribute ) {
			$styles = array_filter(
				array(
					rtrim( trim( $new_attribute ), ';' ),
					rtrim( trim( $extra_attribute ), ';' ),
				)
			);
			$combined = implode( ';', array_filter( $styles ) );
			return function_exists( 'safecss_filter_attr' ) ? safecss_filter_attr( $combined ) : $combined;
		},
		'class'      => static function ( $new_attribute, $extra_attribute ) {
			$classes = array_merge(
				(array) preg_split( '/\s+/', $extra_attribute, -1, PREG_SPLIT_NO_EMPTY ),
				(array) preg_split( '/\s+/', $new_attribute, -1, PREG_SPLIT_NO_EMPTY )
			);
			$classes = array_unique( $classes );
			return implode( ' ', $classes );
		},
		'id'         => static function ( $new_attribute, $extra_attribute ) {
			return '' !== $extra_attribute ? $extra_attribute : $new_attribute;
		},
		'aria-label' => static function ( $new_attribute, $extra_attribute ) {
			return '' !== $extra_attribute ? $extra_attribute : $new_attribute;
		},
	);

	$attributes = array();
	foreach ( $attribute_merge_callbacks as $attribute_name => $merge_callback ) {
		$new_attribute   = $new_attributes[ $attribute_name ] ?? '';
		$extra_attribute = $extra_attributes[ $attribute_name ] ?? '';

		$new_attribute   = is_scalar( $new_attribute ) && ! is_bool( $new_attribute ) ? (string) $new_attribute : '';
		$extra_attribute = is_scalar( $extra_attribute ) && ! is_bool( $extra_attribute ) ? (string) $extra_attribute : '';

		if ( '' !== $new_attribute && '' !== $extra_attribute ) {
			$attributes[ $attribute_name ] = $merge_callback( $new_attribute, $extra_attribute );
		} elseif ( '' !== $new_attribute ) {
			$attributes[ $attribute_name ] = $new_attribute;
		} elseif ( '' !== $extra_attribute ) {
			$attributes[ $attribute_name ] = $extra_attribute;
		}
	}

	// Handle attributes that are not in $attribute_merge_callbacks.
	$extra_attributes = array_diff_key( $extra_attributes, $attribute_merge_callbacks );

	foreach ( $extra_attributes as $attribute_name => $attribute_value ) {
		if ( is_scalar( $attribute_value ) && ! is_bool( $attribute_value ) ) {
			$attributes[ $attribute_name ] = (string) $attribute_value;
		}
	}

	return $attributes;
}

/**
 * Formats an array of HTML attributes as a string.
 *
 * @since 6.8.0
 *
 * @param array $attributes Array of HTML attributes.
 * @return string HTML attributes string.
 */
function gutenberg_format_attributes_string( $attributes ) {
	$attributes_string = '';
	foreach ( $attributes as $attribute_name => $attribute_value ) {
		$attributes_string .= sprintf( ' %s="%s"', $attribute_name, esc_attr( $attribute_value ) );
	}

	return trim( $attributes_string );
}

/**
 * Generates a string of HTML attributes for the inner blocks container of a block.
 *
 * This provides server-rendered (dynamic and PHP-registered) blocks with a mechanism
 * analogous to `useInnerBlocksProps` in JavaScript, cleanly separating inner container
 * attributes (such as layout, alignment, and spacing) from the outer block wrapper.
 *
 * @since 6.8.0
 *
 * @param array $extra_attributes Optional. Array of extra attributes to render on the inner wrapper.
 * @param array $options          Optional. Array of options controlling attribute generation.
 * @return string String of HTML attributes.
 */
function gutenberg_get_inner_blocks_wrapper_attributes( $extra_attributes = array(), $options = array() ) {
	if ( ! isset( WP_Block_Supports::$block_to_render ) || ! is_array( WP_Block_Supports::$block_to_render ) ) {
		return gutenberg_format_attributes_string( $extra_attributes );
	}

	$block      = WP_Block_Supports::$block_to_render;
	$block_name = $block['blockName'] ?? '';
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
	if ( ! $block_type ) {
		return gutenberg_format_attributes_string( $extra_attributes );
	}

	$new_attributes = array();

	// 1. Process Layout Support if supported.
	$block_supports_layout = block_has_support( $block_type, array( 'layout' ), false ) || block_has_support( $block_type, array( '__experimentalLayout' ), false );
	if ( $block_supports_layout && function_exists( 'gutenberg_get_layout_container_classes_and_styles' ) ) {
		$layout_classes = gutenberg_get_layout_container_classes_and_styles( $block, $block_type );
		if ( ! empty( $layout_classes ) ) {
			$new_attributes['class'] = implode( ' ', $layout_classes );
		}
		// Mark layout as handled for this block so render_block does not inject it on the outer wrapper.
		gutenberg_set_inner_blocks_layout_handled( $block );
	}

	// 2. Allow explicitly including specific block supports on inner wrapper via $options['include'].
	if ( ! empty( $options['include'] ) && is_array( $options['include'] ) ) {
		$block_attributes = array_key_exists( 'attrs', $block ) && is_array( $block['attrs'] )
			? $block_type->prepare_attributes_for_render( $block['attrs'] )
			: array();

		$style_options = array();
		if ( in_array( 'spacing.padding', $options['include'], true ) && ! empty( $block_attributes['style']['spacing']['padding'] ) ) {
			$style_options['spacing']['padding'] = $block_attributes['style']['spacing']['padding'];
		}
		if ( in_array( 'spacing.blockGap', $options['include'], true ) && ! empty( $block_attributes['style']['spacing']['blockGap'] ) ) {
			$style_options['spacing']['blockGap'] = $block_attributes['style']['spacing']['blockGap'];
		}
		if ( in_array( 'typography', $options['include'], true ) && ! empty( $block_attributes['style']['typography'] ) ) {
			$style_options['typography'] = $block_attributes['style']['typography'];
		}

		if ( ! empty( $style_options ) && function_exists( 'gutenberg_style_engine_get_styles' ) ) {
			$styles = gutenberg_style_engine_get_styles( $style_options, array( 'convert_vars_to_classnames' => true ) );
			if ( ! empty( $styles['classnames'] ) ) {
				$new_attributes['class'] = ( isset( $new_attributes['class'] ) ? $new_attributes['class'] . ' ' : '' ) . $styles['classnames'];
			}
			if ( ! empty( $styles['css'] ) ) {
				$new_attributes['style'] = ( isset( $new_attributes['style'] ) ? $new_attributes['style'] . ';' : '' ) . $styles['css'];
			}
		}
	}

	$merged = gutenberg_merge_block_attributes( $new_attributes, $extra_attributes );
	return gutenberg_format_attributes_string( $merged );
}

/**
 * Generates a string of HTML attributes for a block wrapper, with support for outer/inner targeting.
 *
 * @since 6.8.0
 *
 * @param array        $extra_attributes Optional. Array of extra attributes to render on the block wrapper.
 * @param array|string $options          Optional. Array of options or target string ('outer', 'inner', 'all').
 * @return string String of HTML attributes.
 */
function gutenberg_get_block_wrapper_attributes( $extra_attributes = array(), $options = array() ) {
	$target = is_string( $options ) ? $options : ( $options['target'] ?? 'all' );

	if ( 'inner' === $target ) {
		return gutenberg_get_inner_blocks_wrapper_attributes( $extra_attributes, is_array( $options ) ? $options : array() );
	}

	$new_attributes = WP_Block_Supports::get_instance()->apply_block_supports();

	// If targeting 'outer' wrapper, strip any layout classes if present.
	if ( 'outer' === $target && ! empty( $new_attributes['class'] ) ) {
		$classes = preg_split( '/\s+/', $new_attributes['class'], -1, PREG_SPLIT_NO_EMPTY );
		$classes = array_filter(
			$classes,
			static function ( $class ) {
				return ! str_starts_with( $class, 'is-layout-' ) && ! str_starts_with( $class, 'wp-container-' );
			}
		);
		$new_attributes['class'] = implode( ' ', $classes );
	}

	$merged = gutenberg_merge_block_attributes( $new_attributes, $extra_attributes );
	return gutenberg_format_attributes_string( $merged );
}

if ( ! function_exists( 'get_inner_blocks_wrapper_attributes' ) ) {
	/**
	 * Generates a string of HTML attributes for the inner blocks container of a block.
	 *
	 * @since 6.8.0
	 *
	 * @param array $extra_attributes Optional. Array of extra attributes to render on the inner wrapper.
	 * @param array $options          Optional. Array of options controlling attribute generation.
	 * @return string String of HTML attributes.
	 */
	function get_inner_blocks_wrapper_attributes( $extra_attributes = array(), $options = array() ) {
		return gutenberg_get_inner_blocks_wrapper_attributes( $extra_attributes, $options );
	}
}

if ( ! function_exists( 'wp_get_inner_blocks_wrapper_attributes' ) ) {
	/**
	 * Generates a string of HTML attributes for the inner blocks container of a block (Core prefix).
	 *
	 * @since 6.8.0
	 *
	 * @param array $extra_attributes Optional. Array of extra attributes to render on the inner wrapper.
	 * @param array $options          Optional. Array of options controlling attribute generation.
	 * @return string String of HTML attributes.
	 */
	function wp_get_inner_blocks_wrapper_attributes( $extra_attributes = array(), $options = array() ) {
		return gutenberg_get_inner_blocks_wrapper_attributes( $extra_attributes, $options );
	}
}

if ( ! function_exists( 'wp_get_block_wrapper_attributes' ) ) {
	/**
	 * Generates a string of HTML attributes for a block wrapper (Core prefix).
	 *
	 * @since 6.8.0
	 *
	 * @param array        $extra_attributes Optional. Array of extra attributes to render on the block wrapper.
	 * @param array|string $options          Optional. Array of options or target string ('outer', 'inner', 'all').
	 * @return string String of HTML attributes.
	 */
	function wp_get_block_wrapper_attributes( $extra_attributes = array(), $options = array() ) {
		return gutenberg_get_block_wrapper_attributes( $extra_attributes, $options );
	}
}

