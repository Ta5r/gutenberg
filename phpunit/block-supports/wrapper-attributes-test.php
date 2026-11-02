<?php
/**
 * Test wrapper attributes and inner blocks wrapper attributes block support functions.
 *
 * @package gutenberg
 */
class WP_Block_Supports_Wrapper_Attributes_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
	}

	public function tear_down() {
		if ( $this->test_block_name ) {
			unregister_block_type( $this->test_block_name );
			$this->test_block_name = null;
		}
		WP_Block_Supports::$block_to_render = null;
		parent::tear_down();
	}

	/**
	 * Helper to register a test block with specific supports.
	 *
	 * @param string $block_name Name of the block.
	 * @param array  $supports   Block supports array.
	 * @return WP_Block_Type The registered block type.
	 */
	private function register_test_block( $block_name, $supports = array() ) {
		$this->test_block_name = $block_name;
		return register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'supports'    => $supports,
			)
		);
	}

	/**
	 * Sets the block currently being rendered.
	 *
	 * @param array $block Block array.
	 */
	private function set_block_to_render( $block ) {
		WP_Block_Supports::$block_to_render = $block;
	}

	/**
	 * Tests get_inner_blocks_wrapper_attributes returns layout flow classes.
	 */
	public function test_get_inner_blocks_wrapper_attributes_with_layout_flow() {
		$this->register_test_block(
			'test/container-block',
			array(
				'layout' => true,
			)
		);

		$block = array(
			'blockName'    => 'test/container-block',
			'attrs'        => array(
				'layout' => array(
					'type' => 'default',
				),
			),
			'innerBlocks'  => array(),
			'innerContent' => array(),
		);

		$this->set_block_to_render( $block );

		$attributes = get_inner_blocks_wrapper_attributes();

		$this->assertStringContainsString( 'is-layout-flow', $attributes );
		$this->assertStringContainsString( 'wp-block-test-container-block-is-layout-flow', $attributes );
	}

	/**
	 * Tests get_inner_blocks_wrapper_attributes returns layout constrained classes.
	 */
	public function test_get_inner_blocks_wrapper_attributes_with_layout_constrained() {
		$this->register_test_block(
			'test/container-block-constrained',
			array(
				'layout' => true,
			)
		);

		$block = array(
			'blockName'    => 'test/container-block-constrained',
			'attrs'        => array(
				'layout' => array(
					'type' => 'constrained',
				),
			),
			'innerBlocks'  => array(),
			'innerContent' => array(),
		);

		$this->set_block_to_render( $block );

		$attributes = get_inner_blocks_wrapper_attributes();

		$this->assertStringContainsString( 'is-layout-constrained', $attributes );
	}

	/**
	 * Tests get_inner_blocks_wrapper_attributes merges extra attributes properly.
	 */
	public function test_get_inner_blocks_wrapper_attributes_merges_extra_attributes() {
		$this->register_test_block(
			'test/container-block-merge',
			array(
				'layout' => true,
			)
		);

		$block = array(
			'blockName'    => 'test/container-block-merge',
			'attrs'        => array(
				'layout' => array(
					'type' => 'flex',
				),
			),
			'innerBlocks'  => array(),
			'innerContent' => array(),
		);

		$this->set_block_to_render( $block );

		$attributes = get_inner_blocks_wrapper_attributes(
			array(
				'class'       => 'custom-inner-class',
				'data-testid' => 'inner-blocks',
			)
		);

		$this->assertStringContainsString( 'custom-inner-class', $attributes );
		$this->assertStringContainsString( 'is-layout-flex', $attributes );
		$this->assertStringContainsString( 'data-testid="inner-blocks"', $attributes );
	}

	/**
	 * Tests gutenberg_get_block_wrapper_attributes with 'outer' target.
	 */
	public function test_get_block_wrapper_attributes_outer_target() {
		$this->register_test_block(
			'test/outer-inner-block',
			array(
				'layout' => true,
				'color'  => array(
					'background' => true,
				),
			)
		);

		$block = array(
			'blockName'    => 'test/outer-inner-block',
			'attrs'        => array(
				'backgroundColor' => 'primary',
				'layout'          => array(
					'type' => 'constrained',
				),
			),
			'innerBlocks'  => array(),
			'innerContent' => array(),
		);

		$this->set_block_to_render( $block );

		$outer_attributes = gutenberg_get_block_wrapper_attributes( array(), 'outer' );

		$this->assertStringContainsString( 'has-primary-background-color', $outer_attributes );
		$this->assertStringNotContainsString( 'is-layout-constrained', $outer_attributes );
	}

	/**
	 * Tests gutenberg_get_block_wrapper_attributes with 'inner' target delegates to inner attributes.
	 */
	public function test_get_block_wrapper_attributes_inner_target() {
		$this->register_test_block(
			'test/inner-target-block',
			array(
				'layout' => true,
			)
		);

		$block = array(
			'blockName'    => 'test/inner-target-block',
			'attrs'        => array(
				'layout' => array(
					'type' => 'grid',
				),
			),
			'innerBlocks'  => array(),
			'innerContent' => array(),
		);

		$this->set_block_to_render( $block );

		$inner_attributes = gutenberg_get_block_wrapper_attributes( array(), 'inner' );

		$this->assertStringContainsString( 'is-layout-grid', $inner_attributes );
	}

	/**
	 * Tests layout support flag does not duplicate layout classes on outer wrapper when inner wrapper was handled.
	 */
	public function test_layout_support_flag_skips_outer_wrapper_when_inner_handled() {
		$this->register_test_block(
			'test/no-duplicate-layout',
			array(
				'layout' => true,
			)
		);

		$block = array(
			'blockName'    => 'test/no-duplicate-layout',
			'attrs'        => array(
				'layout' => array(
					'type' => 'constrained',
				),
			),
			'innerBlocks'  => array(),
			'innerContent' => array(),
		);

		$this->set_block_to_render( $block );

		// Simulate rendering inner wrapper in PHP.
		$inner_attrs = get_inner_blocks_wrapper_attributes( array( 'class' => 'inner-container' ) );
		$content     = sprintf( '<div class="outer-wrapper"><div %s><p>Child</p></div></div>', $inner_attrs );

		// Run layout support flag filter.
		$result = gutenberg_render_layout_support_flag( $content, $block );

		// The outer wrapper must not have is-layout-constrained added to it.
		$this->assertStringContainsString( '<div class="outer-wrapper"><div class="inner-container is-layout-constrained', $result );
		$this->assertStringNotContainsString( 'class="outer-wrapper is-layout-constrained', $result );
	}
}

